$envContent = @"
NEXT_PUBLIC_SUPABASE_URL=https://gwocgomtdgfqtrbuomyt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2Nnb210ZGdmcXRyYnVvbXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTg2ODcsImV4cCI6MjA1NTI3NDY4N30.Mu2gQ3ViFdLKeLMnU4XHAlyD5WcVyfsZoaVU0bmKk9Y
"@

Set-Content -Path ".env.local" -Value $envContent
Write-Host "Environment variables have been set up successfully!"
"@
