# GCP setup for long-running transcription

This document explains how to configure Google Cloud credentials and a Storage bucket so the backend can reliably transcribe long audio files using `long_running_recognize`.

Steps:

1. Create a Google Cloud project and enable the Speech-to-Text API and Cloud Storage API.

2. Create a Service Account with `roles/storage.admin` and `roles/speech.admin` (or narrower roles if you prefer).

3. Generate and download a JSON key for the service account. Save it locally (do not commit to git).

4. Set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON key, e.g.:

   ```pwsh
   $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\service-account.json'
   ```

5. Create a Cloud Storage bucket to upload audio files. Note the bucket name.

6. Set the `GCP_BUCKET` environment variable in your `.env` or shell to the bucket name.

7. Restart the backend. The endpoint `POST /upload-audio/` will upload long audio to GCS and use `long_running_recognize` on the bucket URI.

Notes:
- If you can't or don't want to use GCS, the backend will attempt to use local content and `long_running_recognize` as a fallback, but GCS is recommended for large files.
- Keep your service account JSON private. Add it to `.gitignore` if necessary.
