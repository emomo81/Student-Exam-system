$files = git status --porcelain
foreach ($line in $files) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $file = $line.Substring(3).Trim()
    
    if ($file.StartsWith('"') -and $file.EndsWith('"')) {
        $file = $file.Substring(1, $file.Length - 2)
    }

    Write-Host "Processing: $file"
    git add "$file"
    git commit -m "feat: setup Express and MongoDB for $file"
    git push
}
