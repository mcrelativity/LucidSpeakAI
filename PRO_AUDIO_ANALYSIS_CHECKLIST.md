# Pro Audio Analysis - Quick Setup Checklist

## Pre-Deployment Setup (Do These First)

- [ ] **Step 1: Create Database Schema**
  - [ ] Go to Supabase → SQL Editor
  - [ ] Copy entire contents of `backend/setup_pro_tier.sql`
  - [ ] Click "Run" button
  - [ ] Verify `pro_analyses` table appears in Tables list
  - [ ] Verify RLS is enabled (toggle should be ON)

- [ ] **Step 2: Set Environment Variables**
  - [ ] Add `OPENAI_API_KEY=sk-...` to `.env` file
  - [ ] Test: `echo $OPENAI_API_KEY` (should print your key)
  - [ ] Optional: Add `USE_PARSELMOUTH=true` if you want prosody analysis

- [ ] **Step 3: Install Dependencies**
  - [ ] Run: `pip install -r requirements.txt`
  - [ ] Optional: `pip install parselmouth` (for prosody analysis)

## Local Testing (Recommended Before Deploying)

- [ ] **Test 1: Service Initialization**
  - [ ] Run: `cd backend && python -c "from services.pro_analyzer import ProAudioAnalyzer; from services.job_queue import get_job_queue; print('✅ Services loaded')"` 
  - [ ] Should print: `✅ Services loaded`

- [ ] **Test 2: Start Backend Server**
  - [ ] Run: `python -m uvicorn main:app --reload`
  - [ ] Should see: `Uvicorn running on http://127.0.0.1:8000`
  - [ ] Visit: http://localhost:8000/docs (FastAPI docs should load)

- [ ] **Test 3: Create Test User**
  - [ ] Register: `POST /register` with test@example.com
  - [ ] Get token: `POST /token` and save JWT token
  - [ ] Upgrade to pro: Manually update Supabase or skip (endpoints check tier)

- [ ] **Test 4: Test Pro Analysis Flow**
  - [ ] Upload audio: `POST /upload-audio`
  - [ ] Request analysis: `POST /api/pro-analysis?recording_id=...`
  - [ ] Should get: `{"job_id": "...", "status": "queued", ...}`
  - [ ] Poll status: `GET /api/job/{job_id}` repeatedly
  - [ ] Wait for: `"status": "completed"` (should see full analysis result)

## Deployment Checklist

- [ ] **Git Setup**
  - [ ] Current branch: `git branch` (should be `pro-audio-analysis`)
  - [ ] Stage changes: `git add -A`
  - [ ] Commit: `git commit -m "feat: Add pro audio analysis endpoints"`
  - [ ] Push: `git push origin pro-audio-analysis`

- [ ] **Merge to Main**
  - [ ] Create PR on GitHub: pro-audio-analysis → main
  - [ ] Review changes
  - [ ] Merge to main
  - [ ] Delete branch: `git push origin --delete pro-audio-analysis`

- [ ] **Deploy to Render**
  - [ ] Render automatically detects push to main
  - [ ] Monitor: https://dashboard.render.com
  - [ ] Wait for "Deploy succeeded" message (3-5 minutes)
  - [ ] Test: `curl https://api.lucidspeakapp.com/health`

- [ ] **Verify Production**
  - [ ] Check logs: Render → Logs tab
  - [ ] No errors about missing `services` module
  - [ ] No import errors for OpenAI
  - [ ] Health check responds

## Post-Deployment Validation

- [ ] **Smoke Tests in Production**
  - [ ] Register test user on production
  - [ ] Upgrade to Pro tier (manually in Supabase)
  - [ ] Upload test audio file
  - [ ] Call `/api/pro-analysis` (should get job_id)
  - [ ] Poll `/api/job/{job_id}` until completion (may take 30-60s first time)
  - [ ] Verify result contains: metrics, prosody, fillers, emotions, gpt_insights

- [ ] **Monitor First Real Users**
  - [ ] Watch Render logs for errors
  - [ ] Check Supabase for new rows in `pro_analyses` table
  - [ ] Verify OpenAI API usage: https://platform.openai.com/account/usage

- [ ] **Update Frontend**
  - [ ] Add UI for triggering analysis
  - [ ] Add polling UI for job status
  - [ ] Add results display (show metrics, prosody, emotions, GPT insights)
  - [ ] Handle error cases (quota exceeded, subscription expired, etc.)

## Files to Reference

| File | Purpose |
|------|---------|
| `backend/main.py` | 3 new endpoints: POST /api/pro-analysis, GET /api/job/{job_id}, DELETE /api/job/{job_id} |
| `backend/services/pro_analyzer.py` | Audio analysis engine (audio features, prosody, fillers, emotions, GPT) |
| `backend/services/job_queue.py` | Async job queue (queues analysis, processes in background, handles concurrency) |
| `backend/setup_pro_tier.sql` | Database schema for pro_analyses table (run once in Supabase) |
| `docs/PRO_AUDIO_ANALYSIS_IMPLEMENTATION.md` | Full implementation guide with API reference |

## Quick Commands Reference

```bash
# Test backend locally
cd backend && python -m uvicorn main:app --reload

# Check syntax errors
python -m py_compile main.py services/pro_analyzer.py services/job_queue.py

# See git changes
git status
git diff main.py

# Deploy to Render (from main branch)
git push origin main

# Tail production logs
# Visit: https://dashboard.render.com → Logs tab
```

## Support & Debugging

### "ModuleNotFoundError: No module named 'services'"
**Solution:** Run from `backend/` directory: `cd backend && python main.py`

### "openai.APIError: Invalid API key"
**Solution:** Verify `OPENAI_API_KEY` env var: `echo $OPENAI_API_KEY`

### "pro_analyses table doesn't exist"
**Solution:** Run `setup_pro_tier.sql` in Supabase SQL Editor

### "Job never completes (stuck on 'processing')"
**Solution:** Check logs for errors, verify OpenAI API is responding, check Parselmouth errors

### Frontend Can't Call Pro Analysis Endpoint
**Solution:** Check CORS origin is whitelisted in `main.py` CORS config (around line 90)

---

**Last Updated:** October 16, 2025  
**Status:** Implementation Complete - Ready for Testing & Deployment
