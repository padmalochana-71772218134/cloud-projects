// chat.js

// ✅ Initialize Supabase client directly (no import)
const supabaseUrl = 'https://ygdbrmwobrkrzgohemmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZGJybXdvYnJrcnpnb2hlbW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzg3MTAsImV4cCI6MjA2OTYxNDcxMH0.oXfWBKJG5rJsyGk2_ak5ueCBIiWOONiRvhXqqQJsSo4';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ✅ Example usage
console.log('Supabase client initialized:', supabase);
