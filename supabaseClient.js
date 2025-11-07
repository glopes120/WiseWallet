import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
// -----------------------------------------------------------------
const supabaseUrl = 'https://uczfpbyaedxytlulxisw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjemZwYnlhZWR4eXRsdWx4aXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMTAxNjgsImV4cCI6MjA3Njg4NjE2OH0.7A_fuR3iK9sQJ3WjbFQkomsFgCnl169ObdP8zN4vAwE';
// -----------------------------------------------------------------

export const supabase = createClient(supabaseUrl, supabaseAnonKey);