import { NextResponse } from "next/server";
import { callVeklomChat } from "@/lib/veklom-client";
import { canonicalBackends, canonicalBackendUrl } from "@/lib/canonical-backends";

export async function POST(req: Request) {
  try {
    const { codeText, apiName, category } = await req.json();

    if (!codeText || !apiName) {
      return NextResponse.json({ detail: "Missing required fields." }, { status: 400 });
    }

    // Use active canonical services only. BYOS is decommissioned and must not
    // remain a validation or fallback dependency.
    const backends = canonicalBackends();
    const capiBackend = backends.find((backend) => backend.id === "capi");
    const cappoBackend = backends.find((backend) => backend.id === "cappo");

    const capiMcpUrl = capiBackend
      ? canonicalBackendUrl(capiBackend, "/mcp")
      : "https://capi.veklom.com/mcp";
    const cappoMcpUrl = cappoBackend
      ? canonicalBackendUrl(cappoBackend, "/mcp")
      : "https://cappo.veklom.com/mcp";

    const systemPrompt = `You are the Apex Blueprint V4 Compiler.
Compile the user's raw API source code into a source-backed protocol manifest.
Do not claim runtime validation merely because a service URL is configured.
Do not fabricate benchmark or verification values.
Return strict JSON. If required evidence is unavailable, mark the corresponding value or verification state as unknown/not_verified.
The active connection/authority references are cAPI ${capiMcpUrl} and CAPPO ${cappoMcpUrl}; these references do not themselves prove either service was contacted by this request.`;

    const result = await callVeklomChat({
      systemPrompt,
      userPrompt: `Compile this API named '${apiName}' (Category: ${category}):\n\n${codeText}`,
      model: "qwen2.5-coder:1.5b",
    });

    try {
      const parsed = JSON.parse(result.text.replace(/```json/g, "").replace(/```/g, ""));
      return NextResponse.json({
        verification_state: "NOT_VERIFIED",
        source: "COMPILER_OUTPUT",
        result: parsed,
      });
    } catch {
      return NextResponse.json(
        {
          verification_state: "NOT_VERIFIED",
          source: "COMPILER_OUTPUT_UNPARSEABLE",
          detail: "Compiler output was not valid JSON; no verification result was synthesized.",
        },
        { status: 502 },
      );
    }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "Compiler request failed";
    console.error("Compiler error:", error);
    return NextResponse.json({ detail, verification_state: "NOT_VERIFIED" }, { status: 500 });
  }
}
