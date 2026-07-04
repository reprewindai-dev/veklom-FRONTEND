"use client";

import DevSidebar from "../components/DevSidebar";
import { CopyBlock, dracula } from "react-code-blocks";

export default function DeveloperTools() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#3EE7A2]/30 selection:text-white">
      <div className="flex max-w-[1600px] mx-auto pt-16">
        {/* Left Sidebar */}
        <DevSidebar />

        {/* Main Content Pane */}
        <div className="flex-1 min-w-0 p-8 lg:p-12 overflow-y-auto pb-32">
          <div className="max-w-4xl mx-auto space-y-12">
            <header className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                Veklom Tools by Language
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed max-w-3xl">
                Veklom works with the stack your team already uses. Pick your language and get governed AI inference, tamper-evident audit logging, compliance checks, and model routing — without changing your workflow.
              </p>
            </header>

            {/* API Info */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
              <h2 className="text-xl font-semibold text-white">API Base</h2>
              <p className="text-gray-400">All SDKs connect to: <code className="text-[#3EE7A2] bg-[#3EE7A2]/10 px-2 py-1 rounded">https://api.veklom.com/api/v1</code></p>
              <p className="text-gray-400">Auth: JWT or API key via <code className="text-gray-300">Authorization: Bearer &lt;token&gt;</code></p>
            </div>

            {/* Quick Starts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Python */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🐍</span>
                  <h3 className="text-2xl font-semibold">Python</h3>
                </div>
                <div className="p-4 bg-black border border-white/10 rounded-xl font-mono text-sm text-gray-300">
                  pip install veklom
                </div>
                <div className="rounded-xl overflow-hidden border border-white/10 text-sm">
                  <CopyBlock
                    text={`from veklom import VeklomClient

client = VeklomClient(api_key="your-api-key")

response = client.complete(
    model="qwen2.5:1.5b",
    messages=[
        {"role": "user", "content": "Summarize this contract clause:"}
    ]
)

print(response.text)
print(response.audit_log_id)  # tamper-evident log entry
print(response.provider)      # ollama | groq`}
                    language="python"
                    theme={dracula}
                    showLineNumbers={true}
                    
                  />
                </div>
              </div>

              {/* JavaScript */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🟨</span>
                  <h3 className="text-2xl font-semibold">JavaScript / TypeScript</h3>
                </div>
                <div className="p-4 bg-black border border-white/10 rounded-xl font-mono text-sm text-gray-300">
                  npm install @veklom/sdk
                </div>
                <div className="rounded-xl overflow-hidden border border-white/10 text-sm">
                  <CopyBlock
                    text={`import { VeklomClient } from '@veklom/sdk';

const client = new VeklomClient({ apiKey: 'your-api-key' });

const response = await client.complete({
  model: 'qwen2.5:1.5b',
  messages: [
    { role: 'user', content: 'Summarize this contract clause:' }
  ]
});

console.log(response.text);
console.log(response.auditLogId);
console.log(response.provider);`}
                    language="typescript"
                    theme={dracula}
                    showLineNumbers={true}
                    
                  />
                </div>
              </div>
            </div>

            {/* Detailed Catalog Table */}
            <div className="pt-8 space-y-8">
              <h2 className="text-3xl font-bold">Veklom Developer Tools Catalog</h2>
              <p className="text-gray-400">Veklom supports the languages and tools your team already uses. Every SDK wraps the same governed inference engine — your prompts, your audit trail, your compliance — from any language.</p>
              
              <div className="space-y-12">
                
                {/* Python Catalog */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Python</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 font-medium">Tool</th>
                          <th className="px-6 py-4 font-medium">Type</th>
                          <th className="px-6 py-4 font-medium">Install</th>
                          <th className="px-6 py-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom SDK for Python</td>
                          <td className="px-6 py-4">SDK</td>
                          <td className="px-6 py-4 font-mono text-xs">pip install veklom</td>
                          <td className="px-6 py-4 text-gray-400">Official Python client for governed inference, audit logging, model routing, and compliance</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom Toolkit for VS Code</td>
                          <td className="px-6 py-4">IDE Plugin</td>
                          <td className="px-6 py-4 text-gray-500 italic">[coming soon]</td>
                          <td className="px-6 py-4 text-gray-400">Prompt testing, audit log inspector, deployment manager inside VS Code</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom Toolkit for PyCharm</td>
                          <td className="px-6 py-4">IDE Plugin</td>
                          <td className="px-6 py-4 text-gray-500 italic">[coming soon]</td>
                          <td className="px-6 py-4 text-gray-400">Same as VS Code toolkit — for PyCharm and all JetBrains IDEs</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom Powertools for Python</td>
                          <td className="px-6 py-4">Framework</td>
                          <td className="px-6 py-4 font-mono text-xs">pip install veklom-powertools</td>
                          <td className="px-6 py-4 text-gray-400">Lambda-style utilities: structured logging, tracing, audit chain, budget guard</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* JS Catalog */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b border-white/10 pb-2">JavaScript / TypeScript</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 font-medium">Tool</th>
                          <th className="px-6 py-4 font-medium">Type</th>
                          <th className="px-6 py-4 font-medium">Install</th>
                          <th className="px-6 py-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom SDK for JavaScript</td>
                          <td className="px-6 py-4">SDK</td>
                          <td className="px-6 py-4 font-mono text-xs">npm install @veklom/sdk</td>
                          <td className="px-6 py-4 text-gray-400">Official JS/TS client — works in Node.js and browser. Full type safety with TypeScript.</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom Toolkit for VS Code</td>
                          <td className="px-6 py-4">IDE Plugin</td>
                          <td className="px-6 py-4 text-gray-500 italic">[coming soon]</td>
                          <td className="px-6 py-4 text-gray-400">Shared with Python toolkit — covers JS/TS projects too</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Java Catalog */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Java</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 font-medium">Tool</th>
                          <th className="px-6 py-4 font-medium">Type</th>
                          <th className="px-6 py-4 font-medium">Install</th>
                          <th className="px-6 py-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom SDK for Java</td>
                          <td className="px-6 py-4">SDK</td>
                          <td className="px-6 py-4 text-gray-500 italic">Maven/Gradle [coming soon]</td>
                          <td className="px-6 py-4 text-gray-400">Official Java client for governed inference and audit logging</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom Toolkit for IntelliJ</td>
                          <td className="px-6 py-4">IDE Plugin</td>
                          <td className="px-6 py-4 text-gray-500 italic">[coming soon]</td>
                          <td className="px-6 py-4 text-gray-400">Prompt testing and audit inspection inside IntelliJ</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* C# Catalog */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b border-white/10 pb-2">.NET / C#</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 font-medium">Tool</th>
                          <th className="px-6 py-4 font-medium">Type</th>
                          <th className="px-6 py-4 font-medium">Install</th>
                          <th className="px-6 py-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom SDK for .NET</td>
                          <td className="px-6 py-4">SDK</td>
                          <td className="px-6 py-4 text-gray-500 italic">NuGet [coming soon]</td>
                          <td className="px-6 py-4 text-gray-400">Official .NET client — full async/await support</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom Toolkit for Visual Studio</td>
                          <td className="px-6 py-4">IDE Plugin</td>
                          <td className="px-6 py-4 text-gray-500 italic">[coming soon]</td>
                          <td className="px-6 py-4 text-gray-400">Governed inference testing inside Visual Studio</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Go Catalog */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Go</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 font-medium">Tool</th>
                          <th className="px-6 py-4 font-medium">Type</th>
                          <th className="px-6 py-4 font-medium">Install</th>
                          <th className="px-6 py-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-medium text-white">Veklom SDK for Go</td>
                          <td className="px-6 py-4">SDK</td>
                          <td className="px-6 py-4 text-gray-500 italic">go get github.com/veklom/sdk-go [coming soon]</td>
                          <td className="px-6 py-4 text-gray-400">Idiomatic Go client for governed inference and audit</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
