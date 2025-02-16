import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gwocgomtdgfqtrbuomyt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2Nnb210ZGdmcXRyYnVvbXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTg2ODcsImV4cCI6MjA1NTI3NDY4N30.Mu2gQ3ViFdLKeLMnU4XHAlyD5WcVyfsZoaVU0bmKk9Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
