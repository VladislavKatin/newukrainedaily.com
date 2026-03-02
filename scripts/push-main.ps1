param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$MessageParts
)

$message = ($MessageParts -join " ").Trim()

if ([string]::IsNullOrWhiteSpace($message)) {
  Write-Error "Commit message is required."
  exit 1
}

git -c safe.directory=C:/www/ukranian add -A
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

git -c safe.directory=C:/www/ukranian commit -m "$message"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

git -c safe.directory=C:/www/ukranian push -u origin main
exit $LASTEXITCODE
