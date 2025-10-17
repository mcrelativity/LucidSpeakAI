# Pro Audio Analysis - Implementation Guide

## Overview

The pro audio analysis system is now fully implemented with three key components:

1. **ProAudioAnalyzer** (`services/pro_analyzer.py`) - Performs comprehensive audio analysis
2. **JobQueue** (`services/job_queue.py`) - Manages async background processing
3. **API Endpoints** (in `main.py`) - Exposes pro analysis functionality

## Setup Steps

### Step 1: Create Database Schema

Run the SQL migration in Supabase:

1. Go to: https://app.supabase.com → Select your project → SQL Editor
2. Copy and run the entire contents of `backend/setup_pro_tier.sql`
3. This creates:
   - `pro_analyses` table for tracking jobs
   - Row-level security (RLS) policies
   - Optimized indexes for monthly quota checking

### Step 2: Update Environment Variables

Add these to your `.env` file (required for GPT analysis):

```
# OpenAI API Key (for GPT-4o-mini analysis)
OPENAI_API_KEY=sk-...

# Optional: For Parselmouth prosody analysis (local processing, no cost)
# Leave empty to skip prosody analysis
USE_PARSELMOUTH=true
```

### Step 3: Install Optional Dependencies

The system works with or without Parselmouth. To enable prosody analysis:

```bash
pip install parselmouth
```

Or keep as optional (will skip prosody if not installed).

### Step 4: Commit and Deploy

```bash
git add .
git commit -m "feat: Add pro audio analysis endpoints and services"
git push origin pro-audio-analysis
```

Then merge to main and deploy to Render.

## API Reference

### 1. Create Analysis Job

**Endpoint:** `POST /api/pro-analysis`

**Rate Limit:** 10 requests/minute per user

**Authentication:** Required (JWT token in header)

**Query Parameters:**
```
recording_id: string (required) - ID of the recording to analyze
```

**Request:**
```bash
curl -X POST "https://api.lucidspeakapp.com/api/pro-analysis?recording_id=rec_123" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "job_id": "job_550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Analysis queued successfully. Check status with GET /api/job/{job_id}"
}
```

**Error Responses:**
- `403 Forbidden` - Not a Pro subscriber or subscription expired
- `404 Not Found` - Recording doesn't exist or doesn't belong to user
- `429 Too Many Requests` - Monthly quota exceeded (50 analyses/month)

**What Happens:**
1. Validates user has active Pro subscription
2. Checks monthly quota (50 analyses included)
3. Retrieves recording audio file and transcript
4. Queues for background processing
5. Returns immediately with `job_id` for polling

---

### 2. Check Job Status

**Endpoint:** `GET /api/job/{job_id}`

**Rate Limit:** 30 requests/minute per user

**Authentication:** Required (JWT token in header)

**Request:**
```bash
curl -X GET "https://api.lucidspeakapp.com/api/job/job_550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response While Processing (200):**
```json
{
  "job_id": "job_550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 65,
  "result": null,
  "error": null,
  "created_at": 1697500000,
  "started_at": 1697500010,
  "completed_at": null
}
```

**Response When Complete (200):**
```json
{
  "job_id": "job_550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "result": {
    "timestamp": "2024-10-16T12:34:56Z",
    "metrics": {
      "duration_seconds": 45.3,
      "rms_energy": 0.285,
      "spectral_centroid": 2500.5,
      "mfcc": [45.2, 12.3, -5.1, ...],
      "onset_count": 23,
      "speech_rate_wpm": 145,
      "silence_ratio": 0.15
    },
    "prosody": {
      "pitch_hz": {"mean": 185, "min": 120, "max": 320, "std": 45},
      "pitch_range": 200,
      "contour": "rising",
      "intensity_variation": 0.42,
      "voiced_ratio": 0.85
    },
    "fillers": {
      "top_fillers": [{"word": "um", "count": 5}, {"word": "uh", "count": 3}],
      "filler_density": 0.18,
      "total_fillers": 8
    },
    "emotions": {
      "confident": 0.8,
      "anxious": 0.2,
      "engaged": 0.7,
      "bored": 0.1,
      "happy": 0.6,
      "sad": 0.05,
      "frustrated": 0.1,
      "neutral": 0.15
    },
    "gpt_insights": {
      "analysis": "You speak with strong confidence and clear engagement throughout. Your delivery shows consistent energy with minimal hesitation. Consider slightly slowing pace in technical sections.",
      "token_count": 145
    },
    "processing_time_ms": 8500
  },
  "error": null,
  "created_at": 1697500000,
  "started_at": 1697500010,
  "completed_at": 1697500020
}
```

**Status Values:**
- `queued` - Waiting in the queue to start processing
- `processing` - Currently analyzing the audio
- `completed` - Analysis finished successfully, result available
- `failed` - Analysis failed (see `error` field)
- `cancelled` - Job was cancelled before processing

**Frontend Polling Strategy:**
```javascript
// Poll every 1-2 seconds until complete
async function pollJobStatus(jobId) {
  const maxAttempts = 60; // 2 minutes max
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const response = await fetch(`/api/job/${jobId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (data.status === 'completed') {
      return data.result;
    } else if (data.status === 'failed') {
      throw new Error(data.error);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }
  
  throw new Error('Job polling timeout');
}
```

---

### 3. Cancel Job

**Endpoint:** `DELETE /api/job/{job_id}`

**Rate Limit:** 10 requests/minute per user

**Authentication:** Required (JWT token in header)

**Request:**
```bash
curl -X DELETE "https://api.lucidspeakapp.com/api/job/job_550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Success Response (200):**
```json
{
  "status": "cancelled",
  "message": "Job job_550e8400-e29b-41d4-a716-446655440000 has been cancelled"
}
```

**Error Responses:**
- `403 Forbidden` - Job doesn't belong to user, or status is not "queued" (processing/completed can't be cancelled)
- `404 Not Found` - Job doesn't exist

---

## Analysis Output Format

### Metrics (Audio Features)
```json
{
  "duration_seconds": 45.3,           // Total audio length
  "rms_energy": 0.285,                // Energy level (0-1)
  "spectral_centroid": 2500.5,        // Center of spectral mass (Hz)
  "mfcc": [45.2, 12.3, -5.1, ...],   // 13 MFCC coefficients
  "onset_count": 23,                  // Speech syllable count
  "speech_rate_wpm": 145,             // Words per minute
  "silence_ratio": 0.15               // % of silence (0-1)
}
```

### Prosody (Speech Patterns)
```json
{
  "pitch_hz": {
    "mean": 185,                      // Average pitch in Hz
    "min": 120,
    "max": 320,
    "std": 45                         // Variation (std dev)
  },
  "pitch_range": 200,                 // Max - Min pitch
  "contour": "rising",                // "rising", "falling", or "level"
  "intensity_variation": 0.42,        // Loudness variation (0-1)
  "voiced_ratio": 0.85                // % of voiced speech (0-1)
}
```

### Fillers (Hesitation Words)
```json
{
  "top_fillers": [
    {"word": "um", "count": 5},
    {"word": "uh", "count": 3}
  ],
  "filler_density": 0.18,             // Fillers per minute
  "total_fillers": 8                  // Total count
}
```

### Emotions (Detected From Audio Patterns)
```json
{
  "confident": 0.8,                   // 0-1 confidence score
  "anxious": 0.2,
  "engaged": 0.7,
  "bored": 0.1,
  "happy": 0.6,
  "sad": 0.05,
  "frustrated": 0.1,
  "neutral": 0.15
}
```

### GPT Insights (AI-Generated Analysis)
```json
{
  "analysis": "You speak with strong confidence and clear engagement...",
  "token_count": 145                  // OpenAI tokens used
}
```

---

## Testing Locally

### Prerequisites
```bash
# Ensure you have test audio files
ls tmp_test_wavs/
# Should show: long_90s.wav, short_30s.wav

# Set environment
source .env  # or use .env.local
echo $OPENAI_API_KEY  # Verify it's set
```

### Test 1: Quick Service Test
```bash
cd backend
python -c "
from services.pro_analyzer import ProAudioAnalyzer
from services.job_queue import get_job_queue

# Test analyzer initialization
analyzer = ProAudioAnalyzer('sk-test-key')
print('✅ ProAudioAnalyzer initialized')

# Test job queue
queue = get_job_queue()
print('✅ JobQueue initialized')
print(f'Concurrent workers: {queue.max_concurrent}')
"
```

### Test 2: Full Integration Test
```bash
# Start the backend
python -m uvicorn main:app --reload

# In another terminal, register a test user
curl -X POST "http://localhost:8000/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'

# Get JWT token
TOKEN=$(curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=TestPassword123" \
  | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Upgrade user to Pro for testing
sqlite3 data/lucidspeak.db "UPDATE users SET tier='pro', subscription_status='active' WHERE email='test@example.com';"

# Upload audio and create recording
RECORDING=$(curl -X POST "http://localhost:8000/upload-audio?duration=30" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tmp_test_wavs/short_30s.wav" \
  | python -c "import sys, json; print(json.load(sys.stdin)['recording_id'])")

# Request pro analysis
JOB=$(curl -X POST "http://localhost:8000/api/pro-analysis?recording_id=$RECORDING" \
  -H "Authorization: Bearer $TOKEN" \
  | python -c "import sys, json; print(json.load(sys.stdin)['job_id'])")

echo "Job ID: $JOB"

# Poll for results
for i in {1..30}; do
  curl -X GET "http://localhost:8000/api/job/$JOB" \
    -H "Authorization: Bearer $TOKEN" \
    | python -c "import sys, json; d=json.load(sys.stdin); print(f\"Status: {d['status']}, Progress: {d.get('progress', 0)}%\")"
  
  sleep 2
done
```

### Test 3: Error Scenarios
```bash
# Test: Free user tries pro analysis (should fail)
curl -X POST "http://localhost:8000/api/pro-analysis?recording_id=test" \
  -H "Authorization: Bearer $TOKEN" \
  # Should return 403 Forbidden

# Test: Cancel a job
curl -X DELETE "http://localhost:8000/api/job/$JOB" \
  -H "Authorization: Bearer $TOKEN"

# Test: Invalid job ID
curl -X GET "http://localhost:8000/api/job/invalid" \
  -H "Authorization: Bearer $TOKEN"
  # Should return 404 Not Found
```

---

## Cost Tracking

### Per-User Monthly Cost
For each Pro user who submits 50 analyses (monthly limit):

```
OpenAI Whisper: 50 × $0.005 = $0.25
GPT-4o-mini: 50 × $0.06 = $3.00
Total per user: ~$3.25

Revenue: $4.99
Profit margin: 35%
```

### Total Monthly Cost (Infrastructure + AI)
```
Render Starter: $7.00
Supabase Free: $0.00
Total: $7.00

At 10 users: $7.00 + (10 × $3.25) = $39.50/month
At 50 users: $7.00 + (50 × $3.25) = $169.50/month
At 100 users: Upgrade Render to Standard (+$18) + Supabase to Pro (+$25) = $50.00 + (100 × $3.25) = $375.00/month
```

---

## Troubleshooting

### Issue: "Job never completes"
- Check logs: `tail logs/backend.out.log`
- Verify OpenAI API key: `echo $OPENAI_API_KEY`
- Check Parselmouth (optional): `python -c "import parselmouth"` (should not error if installed)

### Issue: "ModuleNotFoundError: No module named 'services'"
- Ensure backend directory is in Python path
- Try: `cd backend && python main.py`
- Or: `PYTHONPATH=. python main.py`

### Issue: "Supabase connection error"
- Verify credentials: `echo $SUPABASE_URL` and `echo $SUPABASE_SERVICE_KEY`
- Test connection: `python -c "from supabase import create_client; c=create_client('$SUPABASE_URL', '$SUPABASE_SERVICE_KEY'); print(c)"`

### Issue: "RLS policy error on pro_analyses table"
- Check SQL migration was run: Go to Supabase → Tables → Look for `pro_analyses`
- Rerun `setup_pro_tier.sql` if missing
- Verify RLS is enabled: Supabase → Tables → pro_analyses → RLS toggle should be ON

---

## Next Steps

1. ✅ Run `setup_pro_tier.sql` in Supabase to create tables
2. ✅ Set `OPENAI_API_KEY` in environment
3. ✅ Test locally with `Test 2: Full Integration Test`
4. ✅ Deploy to Render (merge pro-audio-analysis → main)
5. ✅ Update frontend to call `/api/pro-analysis` and poll `/api/job/{job_id}`
6. ✅ Monitor costs and user adoption

---

## Files Modified/Created

```
backend/
  main.py                    (modified - added 3 endpoints)
  setup_pro_tier.sql        (new - database schema)
  services/
    pro_analyzer.py         (new - audio analysis engine)
    job_queue.py            (new - async processing)
    __init__.py             (new - package exports)
```

## API Documentation

Full OpenAPI docs available at `/docs` when backend is running.

---

**Implementation Date:** October 16, 2025  
**Status:** Ready for testing  
**Contacts:** For issues, check logs and error messages in API responses
