import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Terminal Link
content = re.sub(r'<Link href="https://terminal.veklom.com"[^>]*>Terminal</Link>\s*', '', content)

# Change title
content = content.replace('The era of <span className="text-brass data-[machine=true]:text-cyan transition-colors" data-machine={isMachine}>"AI agents"</span><br className="hidden md:block"/> is already over.', 'VIO Intent Infrastructure')

# Change image
content = content.replace('/images/veklom-visor-concept.jpg', '/images/veklom-logo-m2m.jpg')

# Change isMachine to true
content = content.replace('const [isMachine, setIsMachine] = useState(false);', 'const isMachine = true;')

# Remove the toggle buttons
content = re.sub(r'<button onClick=\{crossThreshold\}.*?</button>', '', content, flags=re.DOTALL)

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
