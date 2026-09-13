with open("scripts/e2e_machine_cycle_auto.ps1", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('effect_id = "increment", payload = @{ amount = 1 }', 'effect_id = "increment"; payload = @{ amount = 1 }')

with open("scripts/e2e_machine_cycle_auto.ps1", "w", encoding="utf-8") as f:
    f.write(content)
