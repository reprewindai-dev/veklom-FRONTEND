import re
import os

def patch_file(file_path, replacements):
    if not os.path.exists(file_path):
        return
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. LiveSwarmDemo.tsx
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\components\LiveSwarmDemo.tsx", [
    ('"idle"', '"Idle"'),
    ('"active"', '"Active"'),
    ('"error"', '"Error"')
])

# 2. dev/tools/page.tsx
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\dev\tools\page.tsx", [
    ('wrapLines={true}', '')
])

# 3. provider/[api_id]/page.tsx
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\provider\[api_id]\page.tsx", [
    ('const response = await api.get(`/providers/${params.api_id}`);', 'const response = await api.get(`/providers/${params.api_id}`) as any;')
])

# 4. IncidentsSlashing.tsx
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\components\terminal\components\IncidentsSlashing.tsx", [
    ("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';")
])

# 5. NexusProtocol.tsx
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\components\terminal\components\NexusProtocol.tsx", [
    ("const [genome, setGenome] = useState<any>(null);", ""),
    ("export default function NexusProtocol() {", "export default function NexusProtocol() {\n  const [genome, setGenome] = useState<any>(null);")
])

print("Patched TS errors.")