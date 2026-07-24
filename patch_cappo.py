import os
import re

directories = ['app', 'components', 'lib']
replacements = [
    (r'Covenant', 'CAPPO'),
    (r'covenant', 'cappo'),
    (r'interlink-cAPI/Covenant', 'CAPPO Backend'),
    (r'interlink-cAPI/cappo', 'CAPPO Backend'),
    (r'interlink-cAPI', 'CAPPO Backend')
]

for d in directories:
    for root, dirs, files in os.walk(d):
        # Rename directories
        for idx in range(len(dirs)):
            if 'covenant' in dirs[idx]:
                old_dir = os.path.join(root, dirs[idx])
                new_dir = os.path.join(root, dirs[idx].replace('covenant', 'cappo'))
                os.rename(old_dir, new_dir)
                dirs[idx] = dirs[idx].replace('covenant', 'cappo')
                
        for file in files:
            if not file.endswith(('.ts', '.tsx', '.json', '.md')): continue
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in replacements:
                    new_content = re.sub(old, new, new_content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
