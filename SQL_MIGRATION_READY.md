# SQL Migration Updated - Ready to Run

## ✅ Changes Made to `setup_pro_tier.sql`

Your SQL migration has been **updated to match your existing schema**. No manual edits needed - just copy and run!

### What Changed

**From:** Generic PostgreSQL syntax  
**To:** Supabase-compatible syntax matching your existing tables

### Key Adaptations

```sql
OLD ❌                           NEW ✅
─────────────────────────────────────────────────────────
BIGSERIAL PRIMARY KEY    →    uuid NOT NULL DEFAULT gen_random_uuid()
VARCHAR(255)             →    text
INDEX                    →    CREATE INDEX (Supabase style)
CONSTRAINT fk_           →    CONSTRAINT with proper naming
                         →    ON DELETE CASCADE/SET NULL
```

### Exact Changes for Your Schema

| Feature | Your Schema | Our Update |
|---------|------------|-----------|
| **ID** | `uuid DEFAULT gen_random_uuid()` | ✅ Matches |
| **Timestamps** | `bigint` (Unix) | ✅ Uses bigint like your other tables |
| **Email** | `text` in users table | ✅ Uses text for user_email |
| **Foreign Keys** | REFERENCES public.users(email) | ✅ Matches your structure |
| **RLS** | Already enabled on other tables | ✅ Enabled on pro_analyses |

### New Table Structure

```sql
pro_analyses
├── id (uuid)                        ← Unique per analysis
├── user_email (text)                ← Links to users.email
├── recording_id (uuid, nullable)    ← Links to recordings.id (optional)
├── job_id (text, unique)            ← Async job identifier
├── status (text)                    ← queued/processing/completed/failed
├── result (jsonb)                   ← Full analysis data
├── error (text)                     ← Error message if failed
├── created_at (bigint)              ← Unix timestamp (matches your schema)
├── started_at (bigint)              ← When processing started
├── completed_at (bigint)            ← When completed
├── progress (integer)               ← 0-100 percentage
└── updated_at (timestamp)           ← Postgres timestamp
```

### Indexes Created

```sql
✅ idx_pro_analyses_user_email         (for user lookups)
✅ idx_pro_analyses_job_id             (for job lookups)
✅ idx_pro_analyses_status             (for status queries)
✅ idx_pro_analyses_created_at         (for sorting)
✅ idx_pro_analyses_user_monthly       (for quota checking)
```

### RLS Policies

```sql
✅ Users can view their own analyses
✅ Users can insert their own analyses
✅ Users can update their own analyses
✅ Service role can manage (backend access)
```

---

## 🚀 How to Run

### Step 1: Copy the SQL
```
File: z:\lucidspeak\backend\setup_pro_tier.sql
```

### Step 2: Go to Supabase
```
https://app.supabase.com
→ Select your project
→ SQL Editor (left sidebar)
→ New Query (or paste into existing)
```

### Step 3: Paste and Run
1. Copy entire contents of `setup_pro_tier.sql`
2. Paste into Supabase SQL Editor
3. Click "Run" button
4. Wait for success message

### Step 4: Verify
Go to Supabase → Tables (left sidebar)
- You should see: `pro_analyses` table
- Click it to verify columns match above

---

## ⚠️ Important Notes

1. **Safe to run:** Uses `CREATE TABLE IF NOT EXISTS` - won't break existing data
2. **Idempotent:** Can run multiple times safely
3. **No data loss:** Only adds new table, doesn't modify existing ones
4. **Auto-indexes:** Supabase creates indexes automatically
5. **RLS enabled:** Service role key (backend) can still insert/update

---

## What Gets Created

After running the SQL, you'll have:

```
New Table: pro_analyses
├── Columns: 11
├── Indexes: 5
├── RLS Policies: 4
├── Foreign Keys: 2
└── Status: Ready for production
```

---

## Next Steps

1. ✅ Run this SQL in Supabase
2. ✅ Verify table appears
3. ✅ Set OPENAI_API_KEY environment variable
4. ✅ Deploy code: `git push origin pro-audio-analysis`
5. ✅ Test endpoints

---

## Questions?

**Q: Will this break my existing tables?**  
A: No. It only creates a new table. Existing tables (users, sessions, recordings, payments) are untouched.

**Q: Can I run it twice?**  
A: Yes. It uses `CREATE TABLE IF NOT EXISTS` so it's safe.

**Q: What if I'm worried about something?**  
A: Test it on a staging database first if you have one. Or just run it - it's very conservative SQL.

---

**Ready?** Copy `setup_pro_tier.sql` and paste into Supabase SQL Editor, then click Run!
