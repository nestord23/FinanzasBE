require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { flowType: 'password' } }
);

module.exports = supabaseAuth;
