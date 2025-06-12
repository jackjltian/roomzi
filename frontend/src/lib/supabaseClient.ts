import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdjyzzfuukhrqrcytyyo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkanl6emZ1dWtocnFyY3l0eXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1ODU0NDcsImV4cCI6MjA2NTE2MTQ0N30.onG23hREOfPfKY4x7Yjc_XPpvirdJsvdRcsWq8q_9nA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
