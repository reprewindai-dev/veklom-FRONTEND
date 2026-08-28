for ($i=1; $i -le 30; $i++) {
  $date = Get-Date
  $local = (curl.exe -I -s http://localhost:3002/ | Select-String HTTP | Out-String).Trim()
  $public = (curl.exe -I -s https://veklom.com/ | Select-String HTTP | Out-String).Trim()
  "Check $i $date | Local: $local | Public: $public" | Out-File -FilePath logs\stability-test.log -Append
  Start-Sleep -Seconds 30
}
