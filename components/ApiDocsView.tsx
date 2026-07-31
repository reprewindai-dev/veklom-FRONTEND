import React, { useState } from 'react';
import { Server, Code, Copy, Check, Terminal, Layers, Database } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'curl' | 'ts' | 'python' | 'go'>('curl');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const endpoints = [
    {
      id: 'capi-invoke',
      method: 'POST',
      path: '/api/v1/capi/invoke',
      title: 'cAPI Universal Capability Invocation',
      desc: 'Routes a skill invocation payload through specified harness adapters (Ollama Local, Gemini, Claude, Codex, Cursor, OpenCode), returning Execution Identity tokens and PGL certificates.',
      snippets: {
        curl: `curl -X POST "https://your-domain.com/api/v1/capi/invoke" \\
  -H "Content-Type: application/json" \\
  -d '{
    "skillId": "skill-ecc-refactor-ts",
    "harness": "ollama",
    "humanRequester": "reprewindai@gmail.com",
    "parameters": {
      "targetFilePath": "src/App.tsx",
      "optimizationLevel": "O2"
    },
    "mode": "production"
  }'`,
        ts: `import { CAPIClient } from '@veklom/capi-sdk';

const capi = new CAPIClient({ endpoint: 'https://your-domain.com' });

const response = await capi.invoke({
  skillId: 'skill-ecc-refactor-ts',
  harness: 'ollama',
  humanRequester: 'reprewindai@gmail.com',
  parameters: { targetFilePath: 'src/App.tsx', optimizationLevel: 'O2' },
  mode: 'production'
});

console.log('PGL Cert:', response.pglCertificate.certId);`,
        python: `import requests

url = "https://your-domain.com/api/v1/capi/invoke"
payload = {
    "skillId": "skill-ecc-refactor-ts",
    "harness": "ollama",
    "humanRequester": "reprewindai@gmail.com",
    "parameters": {"targetFilePath": "src/App.tsx", "optimizationLevel": "O2"},
    "mode": "production"
}

res = requests.post(url, json=payload)
print(res.json())`,
        go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"skillId": "skill-ecc-refactor-ts",
		"harness": "ollama",
		"humanRequester": "reprewindai@gmail.com",
		"mode": "production",
	}
	jsonVal, _ := json.Marshal(payload)
	resp, _ := http.Post("https://your-domain.com/api/v1/capi/invoke", "application/json", bytes.NewBuffer(jsonVal))
	fmt.Println("Status:", resp.Status)
}`
      }
    },
    {
      id: 'abide-plan',
      method: 'POST',
      path: '/api/v1/abide/plan',
      title: 'Abide Hierarchical Abstract Plan Compiler',
      desc: 'Compiles raw user or machine intent into gold-standard hierarchical execution blueprints backed by the Einstein trend probability model, SSRN academic validator, and X402 settlement tokens.',
      snippets: {
        curl: `curl -X POST "https://your-domain.com/api/v1/abide/plan" \\
  -H "Content-Type: application/json" \\
  -d '{ "rawIntent": "Refactor TypeScript code and run RepoGate security scan" }'`,
        ts: `const plan = await fetch('/api/v1/abide/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rawIntent: 'Refactor TypeScript code and run RepoGate security scan' })
}).then(res => res.json());`,
        python: `res = requests.post("https://your-domain.com/api/v1/abide/plan", json={"rawIntent": "Refactor code"})`,
        go: `// Abide Plan Go Request Snippet`
      }
    }
  ];

  const handleCopy = (path: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedEndpoint(path);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-200 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium mb-1">
            <Server className="w-4 h-4" /> cAPI PROTOCOL OpenAPI SPECIFICATION & SDKs
          </div>
          <h2 className="text-2xl font-bold text-white font-sans">Developer API Reference & SDK Integration</h2>
          <p className="text-xs text-slate-400">
            Integrate Veklom cAPI capability routing, Abide plan compilation, and PGL evidence logging directly into your enterprise software.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-2xs">
          {(['curl', 'ts', 'python', 'go'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                selectedLang === lang
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {endpoints.map((ep) => (
          <div key={ep.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-3xs">
                    {ep.method}
                  </span>
                  <span className="text-white font-bold text-sm font-sans">{ep.title}</span>
                </div>
                <div className="text-xs text-cyan-400 mt-1">{ep.path}</div>
              </div>

              <button
                onClick={() => handleCopy(ep.path, ep.snippets[selectedLang])}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-3xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedEndpoint === ep.path ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">{ep.desc}</p>

            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-2xs text-cyan-300 overflow-x-auto whitespace-pre">
              {ep.snippets[selectedLang]}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
