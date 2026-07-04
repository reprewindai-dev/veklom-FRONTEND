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

# dev/tools/page.tsx
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\dev\tools\page.tsx", [
    ('wrapLines', '')
])

# provider/[api_id]/page.tsx
patch_file(r"c:\Users\antho\.windsurf\veklom-control-plane\app\provider\[api_id]\page.tsx", [
    ('const response = await api.get(`/providers/${params.api_id}`);', 'const response = await api.get(`/providers/${params.api_id}`) as any;')
])
