# Backend Setup

## Environment Variables

Copy `.env.example` to `.env` and fill in your actual values:

```bash
cp .env.example .env
```

### Required Variables:

1. **SECRET_KEY**: Generate a secure random key:
   ```python
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **SUPABASE_URL**: Your Supabase project URL (found in Supabase dashboard)

3. **SUPABASE_SERVICE_KEY**: Your Supabase service role key (found in Supabase dashboard > Settings > API)
   - ⚠️ **Never commit this key to version control!**

4. **SUPABASE_ANON_KEY**: Your Supabase anon key (found in Supabase dashboard > Settings > API)

### Optional Variables:

- **GOOGLE_APPLICATION_CREDENTIALS**: Path to Google Cloud credentials JSON (for cloud transcription)
- **FRONTEND_URL**: URL of your frontend (default: http://localhost:3000)

## Running the Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8001
```

## Security Notes

- Never commit `.env` files to Git
- Never hardcode secrets in source code
- Use different keys for development and production
- Rotate keys regularly
