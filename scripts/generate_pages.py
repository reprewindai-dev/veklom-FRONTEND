import os
import json

arch_path = r'C:\Users\antho\.gemini\antigravity\brain\f2dbdfe7-677a-40de-a1bc-9512196b3ad0\veklom_constitutional_architecture.md'
with open(arch_path, 'r', encoding='utf-8') as f:
    arch_content = f.read()

arch_json = json.dumps(arch_content)

tsx_content = """import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ArchitecturePage() {
  const markdown = """ + arch_json + """;
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 prose prose-slate">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
"""

os.makedirs(r'C:\Users\antho\.windsurf\veklom-control-plane\app\architecture', exist_ok=True)
with open(r'C:\Users\antho\.windsurf\veklom-control-plane\app\architecture\page.tsx', 'w', encoding='utf-8') as f:
    f.write(tsx_content)

# Do the same for conformance
conf_path = r'C:\Users\antho\.gemini\antigravity\brain\f2dbdfe7-677a-40de-a1bc-9512196b3ad0\conformance_track_scorecard.md'
with open(conf_path, 'r', encoding='utf-8') as f:
    conf_content = f.read()
    
conf_json = json.dumps(conf_content)

tsx_content_conf = """import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ConformancePage() {
  const markdown = """ + conf_json + """;
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 prose prose-slate">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
"""

os.makedirs(r'C:\Users\antho\.windsurf\veklom-control-plane\app\conformance', exist_ok=True)
with open(r'C:\Users\antho\.windsurf\veklom-control-plane\app\conformance\page.tsx', 'w', encoding='utf-8') as f:
    f.write(tsx_content_conf)
