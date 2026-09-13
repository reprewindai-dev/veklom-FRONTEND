import re

with open("scripts/e2e_machine_cycle.ps1", "r", encoding="utf-8") as f:
    content = f.read()

# Replace steps 3 and 4 with direct LockerPhycer exchange
new_steps = '''# Step 3: Bypassing Device Flow via direct exchange
Write-Host "3. Bypassing Device Flow via direct exchange"

# Step 4: Machine requests token directly from LockerPhycer
Write-Host "4. Machine authenticates with LockerPhycer"
$exchange_body = @{ github_username = "machine_agent" } | ConvertTo-Json
$session = Invoke-RestMethod -Uri "http://127.0.0.1:8092/api/v1/auth/github/exchange" -Method Post -Body $exchange_body -ContentType "application/json"
$token = $session.access_token
Write-Host "Received LockerPhycer token!"'''

# Find the block from # Step 3 to the end of # Step 4
pattern = re.compile(r'# Step 3: Start Device Flow.*?Write-Host "Received LockerPhycer token!"', re.DOTALL)
content = pattern.sub(new_steps, content)

with open("scripts/e2e_machine_cycle_auto.ps1", "w", encoding="utf-8") as f:
    f.write(content)
