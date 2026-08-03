export interface VeklomClientConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

interface VeklomChatResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: { content?: string | Array<{ type?: string; text?: string }> };
    text?: string;
  }>;
}

export interface VeklomHealth {
  reachable: boolean;
  status?: string;
  version?: string;
  service?: string;
  models?: string[];
  error?: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function getConfig(config: VeklomClientConfig = {}) {
  const baseUrl = normalizeBaseUrl(config.baseUrl || process.env.VEKLOM_BASE_URL || "https://api.veklom.com");
  const apiKey = config.apiKey || process.env.VEKLOM_API_KEY;
  const model = config.model || process.env.VEKLOM_MODEL || "qwen2.5-coder:1.5b";
  const timeoutMs = config.timeoutMs || Number(process.env.VEKLOM_TIMEOUT_MS || 60000);

  if (!apiKey) throw new Error("VEKLOM_API_KEY is not configured.");
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 180000) {
    throw new Error("VEKLOM_TIMEOUT_MS must be between 1000 and 180000 milliseconds.");
  }
  return { baseUrl, apiKey, model, timeoutMs };
}

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { detail?: unknown; error?: unknown; message?: unknown };
    const detail = parsed.detail || parsed.error || parsed.message;
    if (typeof detail === "string") return detail.slice(0, 1000);
  } catch {
    // Preserve a bounded plain-text error below.
  }
  return body.slice(0, 1000) || response.statusText;
}

function contentFromResponse(data: VeklomChatResponse): string {
  const choice = data.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part.text || "").join("");
  if (typeof choice?.text === "string") return choice.text;
  throw new Error("Veklom returned no assistant content.");
}

export async function callVeklomChat(params: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; model?: string; requestId?: string }> {
  const config = getConfig({ model: params.model });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "system", content: params.systemPrompt }, { role: "user", content: params.userPrompt }],
        max_tokens: params.maxTokens || 8192,
        temperature: params.temperature ?? 0.2,
        stream: false,
      }),
    });
    if (!response.ok) throw new Error(`Veklom request failed with HTTP ${response.status}: ${await readError(response)}`);
    const data = await response.json() as VeklomChatResponse;
    return { text: contentFromResponse(data), model: data.model, requestId: data.id };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error(`Veklom request timed out after ${config.timeoutMs}ms.`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkVeklomHealth(config: VeklomClientConfig = {}): Promise<VeklomHealth> {
  const baseUrl = normalizeBaseUrl(config.baseUrl || process.env.VEKLOM_BASE_URL || "https://api.veklom.com");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 10000);
  try {
    const [healthResponse, modelsResponse] = await Promise.all([
      fetch(`${baseUrl}/health`, { signal: controller.signal }),
      fetch(`${baseUrl}/v1/models`, { signal: controller.signal, headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined }),
    ]);
    if (!healthResponse.ok) throw new Error(`health returned HTTP ${healthResponse.status}`);
    const health = await healthResponse.json() as { status?: string; version?: string; service?: string };
    let models: string[] | undefined;
    if (modelsResponse.ok) {
      const modelData = await modelsResponse.json() as { data?: Array<{ id?: string }> };
      models = modelData.data?.map((entry) => entry.id).filter((id): id is string => Boolean(id));
    }
    return { reachable: true, status: health.status, version: health.version, service: health.service, models };
  } catch (error) {
    return { reachable: false, error: error instanceof DOMException && error.name === "AbortError" ? "Veklom health check timed out." : (error as Error).message };
  } finally {
    clearTimeout(timeout);
  }
}

