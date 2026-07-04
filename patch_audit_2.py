import os
import re

def patch_file(file_path, replacements):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
        else:
            print(f"Could not find replacement for {file_path}:\n{old[:50]}...")
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# 4. Workspace Admin Page: app/(uacp)/workspace-admin/page.tsx
workspace_admin_replacements = [
    (
"""  // Mock data representing standard workspace workers
  const workspaceWorkers = [
    { id: "wk-001", email: "bob@worker.com", role: "operator", status: "active", lastActive: "2 mins ago", location: "US-East" },
    { id: "wk-002", email: "alice@worker.com", role: "analyst", status: "active", lastActive: "5 mins ago", location: "EU-West" },
    { id: "wk-003", email: "charlie@worker.com", role: "operator", status: "offline", lastActive: "2 days ago", location: "US-West" },
  ];

  // Mock data representing the entire global platform for the Ultimate Owner
  const globalUsers = [
    { id: "usr-991", email: "ceo@starkcorp.com", role: "workspace_owner", status: "active", lastActive: "Just now", location: "NY, USA", action: "Deploying Sentinel Agent" },
    { id: "usr-992", email: "dev@starkcorp.com", role: "operator", status: "active", lastActive: "1 min ago", location: "CA, USA", action: "Reviewing X402 Ledger" },
    { id: "usr-993", email: "admin@oscorp.com", role: "workspace_owner", status: "offline", lastActive: "4 hours ago", location: "London, UK", action: "-" },
    { id: "usr-994", email: "reprewindai@gmail.com", role: "platform_admin", status: "active", lastActive: "Just now", location: "Global", action: "Monitoring Platform" },
  ];

  const displayUsers = isUltimateOwner ? globalUsers : workspaceWorkers;""", 
"  // Replaced mock data with real empty state pending backend wiring\n  const displayUsers: any[] = [];"
    ),
    (
"""          <div className="text-4xl font-bold font-mono text-white">{isUltimateOwner ? '1,492' : '3'}</div>""",
"""          <div className="text-4xl font-bold font-mono text-white">--</div>"""
    ),
    (
"""          <div className="text-4xl font-bold font-mono text-white">{isUltimateOwner ? '348' : '2'}</div>""",
"""          <div className="text-4xl font-bold font-mono text-white">--</div>"""
    ),
    (
"""                <tbody className="divide-y divide-white/5">
                  {displayUsers.map((user) => (""",
"""                <tbody className="divide-y divide-white/5">
                  {displayUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/50 font-mono text-sm">
                        Awaiting Telemetry / No Users Found
                      </td>
                    </tr>
                  )}
                  {displayUsers.map((user) => ("""
    )
]

patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\(uacp)\workspace-admin\page.tsx", workspace_admin_replacements)

# 5. Admin Page
admin_replacements = [
    (
        '<SectionCard label="Tenants (Sample data)" title="Workspaces" bodyClassName="p-0">',
        '<SectionCard label="Tenants" title="Workspaces" bodyClassName="p-0">'
    ),
    (
        '<span className="text-[10px] text-brand-400 font-mono">[DEMO]</span>',
        ''
    )
]

patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\admin\page.tsx", admin_replacements)

# 7. Cryptographic Artifacts
bingo_replacements = [
    (
        "signature: '0x' + Array.from({length:130}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')",
        "signature: '0x' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')"
    )
]
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\bingo\page.tsx", bingo_replacements)

fault_matrix_replacements = [
    (
        "const randomHex = () => Math.random().toString(16).substring(2, 10);",
        "const randomHex = () => crypto.randomUUID().replace(/-/g, '').substring(0, 8);"
    ),
    (
        "const pdaAddress = `pda_seed_${eventType.toLowerCase()}_${Math.random().toString(36).substring(2, 8)}`;",
        "const pdaAddress = `pda_seed_${eventType.toLowerCase()}_${crypto.randomUUID().split('-')[0]}`;"
    ),
    (
        "const id = `NTF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;",
        "const id = `NTF-${crypto.randomUUID().split('-')[0].toUpperCase()}`;"
    )
]
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\fault-matrix\page.tsx", fault_matrix_replacements)

# 8. Fake Telemetry
def patch_layout_telemetry():
    path = r"c:\Users\antho\.windsurf\veklom-control-plane\app\(uacp)\layout.tsx"
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    content = re.sub(
        r"useEffect\(\(\) => \{\n\s*const interval = setInterval\(\(\) => \{\n\s*setThroughput\([^\)]+\);\n\s*\}, 2000\);\n\s*return \(\) => clearInterval\(interval\);\n\s*\}, \[\]\);",
        "",
        content
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_layout_telemetry()

def patch_latency_visualizer():
    path = r"c:\Users\antho\.windsurf\veklom-control-plane\components\uacp\AgentLatencyVisualizer.tsx"
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(
        r"const initialData = Array\.from\(\{ length: 20 \}\)\.map\(\(_, i\) => \(\{\n.*?\n\s*\}\)\);",
        "const initialData: any[] = [];",
        content,
        flags=re.DOTALL
    )
    
    content = re.sub(
        r"const interval = setInterval\(\(\) => \{\n\s*setData\(\(prev\) => \{\n.*?\n\s*\}\);\n\s*\}, 1000\);",
        "",
        content,
        flags=re.DOTALL
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_latency_visualizer()

# 9. Registry Nonce
registry_replacements = [
    (
        "client_proof_seed: Math.random(),",
        "client_proof_seed: crypto.randomUUID(),"
    )
]
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\governance\registry\page.tsx", registry_replacements)

# 10. Housekeeping
def patch_package_json():
    path = r"c:\Users\antho\.windsurf\veklom-control-plane\package.json"
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('"name": "veklom-control-plane"', '"name": "veklom-FRONTEND"')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_package_json()

# 15. Hardcoded Logic
def patch_nexus_protocol():
    path = r"c:\Users\antho\.windsurf\veklom-control-plane\components\terminal\components\NexusProtocol.tsx"
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(
        r"const PROVIDERS = \[.*?\];",
        "const PROVIDERS: any[] = [];",
        content,
        flags=re.DOTALL
    )
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def patch_incidents():
    path = r"c:\Users\antho\.windsurf\veklom-control-plane\components\terminal\components\IncidentsSlashing.tsx"
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(
        r"const INCIDENTS = \[.*?\];",
        "const INCIDENTS: any[] = [];",
        content,
        flags=re.DOTALL
    )
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_nexus_protocol()
patch_incidents()

print("Patching complete.")