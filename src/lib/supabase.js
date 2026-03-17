import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aszxuwktoeivxxmxunxf.supabase.co"
const SUPABASE_KEY = "sb_publishable_aqp_tJNZd42jOQj4OZQSrw_YTTisf1j"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
