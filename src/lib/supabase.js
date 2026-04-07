import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wwrywhzliummlepwozkc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cnl3aHpsaXVtbWxlcHdvemtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzkxODUsImV4cCI6MjA4OTk1NTE4NX0.fhWgDwPuLFgROmrOcfBv-Oj6ILd4yyVX9wwNIvl7SAI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
