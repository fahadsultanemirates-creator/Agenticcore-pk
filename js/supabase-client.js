// AgenticCore Pakistan — Supabase client configuration
// ------------------------------------------------------------
// Deliberately the SAME project as agenticcore.estate
// (iuwjlvcfnxbfhbkztsel): one account and one points balance work on
// both sites. profiles / referral_code / points stay the single source
// of truth there; this site only adds pk_-prefixed tables
// (supabase/migrations/pk_0001_*.sql).
//
// The publishable key is safe in the browser — access is enforced by
// Row Level Security and security-definer RPCs on the database side.

const SUPABASE_URL = 'https://iuwjlvcfnxbfhbkztsel.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_h6IgoqSDyVscFbKVaxWMiQ_Lsws9lWv';

const supabaseClient = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;
