
import os
import shutil

spine = [
    ("command", "Command", "Command"),
    ("capabilities", "Capabilities", "Capabilities"),
    ("workflows", "Workflows", "Workflows"),
    ("authority", "Authority", "Authority"),
    ("governed-compute", "Governed Compute", "Governed Compute"),
    ("executions", "Executions", "Executions"),
    ("evidence", "Evidence", "Evidence"),
    ("measure", "Measure", "Measure"),
    ("settings", "Settings", "Settings"),
    ("terminal", "Terminal", "Terminal"),
]

app_os_dir = "app/os"

# Create directories and stub pages if they do not exist
for stage_id, label, purpose in spine:
    stage_dir = os.path.join(app_os_dir, stage_id)
    os.makedirs(stage_dir, exist_ok=True)
    page_path = os.path.join(stage_dir, "page.tsx")
    if not os.path.exists(page_path):
        with open(page_path, "w") as f:
            f.write(f"""export default function {stage_id.capitalize().replace("-", "")}Page() {{
  return (
    <div className="p-8 font-mono text-cos-muted">
      <h1 className="text-xl text-cos-text mb-4">{label}</h1>
      <p>Workspace initialized.</p>
    </div>
  );
}}
""")

print("Done creating directories and stub pages.")

