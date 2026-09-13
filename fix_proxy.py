import re

def rewrite_proxy():
    with open('app/api/[...proxy]/route.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the block starting with "if (isCappoExecPath(forwardPath) || isCappoIdentityPath(forwardPath)) {"
    # and ending right before "} else if (path.startsWith("
    
    start_str = "if (isCappoExecPath(forwardPath) || isCappoIdentityPath(forwardPath)) {"
    
    start_idx = content.find(start_str)
    if start_idx == -1:
        print("Start not found")
        return
        
    end_str = "} else if (path.startsWith("
    end_idx = content.find(end_str, start_idx)
    
    if end_idx == -1:
        print("End not found")
        return
        
    # Replace the whole block with the simplified version
    replacement = '''if (isCappoExecPath(forwardPath) || isCappoIdentityPath(forwardPath)) {
   if (req.headers.has("authorization")) {
     console.log("[PROXY DEBUG] Passing authorization header directly to CAPPO");
     headers.set("authorization", req.headers.get("authorization")!);
   }
   }
   '''
    
    new_content = content[:start_idx] + replacement + content[end_idx:]
    with open('app/api/[...proxy]/route.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
        print("Fixed proxy!")

rewrite_proxy()
