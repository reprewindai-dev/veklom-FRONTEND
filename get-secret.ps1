Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "Veklom Secure Credential Injector (AI Agent)"
$form.Size = New-Object System.Drawing.Size(450,200)
$form.StartPosition = "CenterScreen"
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::FromArgb(15,23,42)
$form.ForeColor = [System.Drawing.Color]::White

$label = New-Object System.Windows.Forms.Label
$label.Location = New-Object System.Drawing.Point(20,20)
$label.Size = New-Object System.Drawing.Size(400,40)
$label.Text = "Please paste the new GITHUB_CLIENT_SECRET below.`n(This is securely written to .env.local and avoids chat logs)"
$form.Controls.Add($label)

$textBox = New-Object System.Windows.Forms.TextBox
$textBox.Location = New-Object System.Drawing.Point(20,70)
$textBox.Size = New-Object System.Drawing.Size(390,25)
$textBox.PasswordChar = '*'
$form.Controls.Add($textBox)

$button = New-Object System.Windows.Forms.Button
$button.Location = New-Object System.Drawing.Point(20,110)
$button.Size = New-Object System.Drawing.Size(100,30)
$button.Text = "Inject Secret"
$button.BackColor = [System.Drawing.Color]::FromArgb(37,99,235)
$button.FlatStyle = "Flat"
$button.Add_Click({
    $secret = $textBox.Text
    if (![string]::IsNullOrWhiteSpace($secret)) {
        # Read .env.local, remove old secret if exists, append new
        $envPath = "c:\Users\antho\.windsurf\veklom-control-plane\.env.local"
        $content = ""
        if (Test-Path $envPath) {
            $content = (Get-Content $envPath) -match "^(?!GITHUB_CLIENT_SECRET=)"
        }
        $content += "GITHUB_CLIENT_SECRET=$secret"
        $content += "GITHUB_APP_ID=4443037"
        $content += "GITHUB_CALLBACK_URL=https://veklom.com/api/auth/github/callback"
        $content += "VEKLOM_PUBLIC_BASE_URL=https://veklom.com"
        $content += "VEKLOM_SESSION_COOKIE_NAME=veklom_session"
        $content += "GITHUB_DEVICE_FLOW_ENABLED=true"
        $content | Set-Content $envPath -Force
        
        $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
    }
    $form.Close()
})
$form.Controls.Add($button)

$form.ShowDialog()
