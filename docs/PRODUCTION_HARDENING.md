Production hardening checklist for LucidSpeak

This document collects concrete, reproducible steps to make LucidSpeak safe to run in production:

1) Network & DDoS
- Put the app behind Cloudflare (or equivalent CDN/WAF).
  - Enable "Under Attack" mode for initial launch if expecting traffic spikes.
  - Create WAF rules to block suspicious URIs and rate-limit /upload-audio/ and /create-checkout-session.
  - Configure bot management and challenge suspicious IPs.

2) TLS / HTTPS
- Use managed TLS (Cloudflare or Let's Encrypt via certbot / ACME) for both frontend and backend.
  - For the backend, configure the load balancer / reverse proxy to terminate TLS.
  - Use HSTS, secure cookies, and disable weak TLS ciphers.

3) Access control & secrets
- Store secrets in the cloud provider's Secret Manager (AWS Secrets Manager, GCP Secret Manager, or Azure Key Vault).
- Do not store credentials in source. Use environment variables or a secrets manager in deployment.
- Rotate keys regularly and enforce least privilege.

4) Payments & payouts
- Use Stripe Checkout (hosted) to reduce PCI burden. Configure webhooks and verify signatures.
- For payouts to Chile, sign up for Stripe and complete KYC. If Stripe payouts aren't supported for your bank/currency, use Wise (TransferWise) to repatriate funds.
- Keep a ledger of payments (we write to `data/payments.json` for demo). In production use a DB and reconcile payouts.

5) Upload handling & processing
- Limit upload size (8 MB in demo) and enforce content-type and magic-byte checks.
- Process uploads in a worker queue (Celery, RQ) to avoid blocking the web process and to control concurrency.
- Use timeouts for external calls (transcription, GCS, OpenAI) and retries with backoff.

6) Rate limiting & quotas
- Implement per-account quotas (not just per-IP), soft and hard limits. Free tier should have small daily allowance.
- Use Redis or API Gateway for distributed rate-limiting.

7) Data retention & privacy
- Default: do NOT persist raw transcripts or audio beyond processing unless user opts in.
- Implement data deletion endpoints (user data export & delete) and a background job to purge old files.

8) Logging, monitoring and alerts
- Centralize logs (Sentry for errors, ELK/Cloud logging for access). Monitor error rates, latency, and costs.
- Budget alerts: set cloud billing alerts and daily spending caps tied to an automated kill-switch for LLM calls.

9) Secure coding & dependency hygiene
- Pin dependencies in `requirements.txt` and run scheduled vulnerability scans (dependabot or safety).
- Static analysis (ruff/flake8), SAST (bandit), and pre-commit hooks (ruff/black) should run on PRs.

10) CI/CD
- Use GitHub Actions (or equivalent) to run tests, linters, and security checks on PRs before merging.
- Automate deployments with a pipeline that provisions infra via IaC (Terraform) and applies DB migrations.

11) WAF rules examples (Cloudflare)
- Rate-limit POST /upload-audio/ to 6 reqs per minute for anonymous users.
- Challenge requests that match high entropy paths or sudden spikes in traffic.

12) Incident response
- Have an incident runbook: how to scale down LLM calls, rotate keys, disable public access, and notify customers.

Quick checklist (minimum to launch a public demo)
- Cloudflare in front (free tier) + WAF rule for upload endpoint.
- TLS via Let's Encrypt or Cloudflare.
- Stripe Checkout integration (webhooks verified).
- Upload size limits + queue processing.
- Basic rate-limiter and usage meter (demo implemented in code).

Further reading & links
- Cloudflare docs: WAF, rate limiting
- Stripe docs: Checkout, webhooks, payouts
- OWASP: Secure Coding Practices

If you'd like, I can create Terraform snippets for Cloudflare and a sample `docker-compose` or Kubernetes manifest for production.
