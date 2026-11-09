# JobNexa Production Environment Setup Guide

**Generated:** 09 November 2026  
**Platform:** JobNexa (Next.js 14 App Router)

This guide documents every environment variable required to run JobNexa in development, staging, and production environments.

---

## 1. Environment Variables Reference

| Variable Name | Required | Scope | Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_APP_URL` | Yes | Client & Server | The root canonical URL of the application (e.g. `https://jobnexa.ng` or `http://localhost:3000`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client & Server | The URL of your Supabase project (e.g. `https://<project-ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client & Server | The Supabase anonymous/publishable key (`sb_publishable_...` or legacy JWT). Safe to expose in the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server Only | The Supabase service role secret key (`sb_secret_...` or legacy JWT). **NEVER prefix with NEXT_PUBLIC_**. |
| `UPSTASH_REDIS_REST_URL` | Yes | Server Only | The REST URL for your Upstash Redis database (e.g. `https://<name>.upstash.io`). |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Server Only | The REST Token for Upstash Redis. |
| `PAYSTACK_SECRET_KEY` | Yes | Server Only | Your Paystack secret key (`sk_live_...` in production, `sk_test_...` in development). |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Yes | Client & Server | Your Paystack public key (`pk_live_...` in production, `pk_test_...` in development). |

---

## 2. Sample `.env.local` File Template

```env
# ==============================================================================
# JobNexa Production Environment Variables
# ==============================================================================

# Application Root URL
NEXT_PUBLIC_APP_URL="https://jobnexa.ng"

# Supabase Infrastructure
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Upstash Redis (Rate Limiting & Anti-Brute-Force Protection)
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-rest-token"

# Paystack Payment Gateway
PAYSTACK_SECRET_KEY="sk_live_your_secret_key"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_live_your_public_key"
```

---

## 3. Vercel / Railway Deployment Instructions

1. Push your latest code to GitHub repository `https://github.com/OkoroJesse/job-nexa.git`.
2. Connect the repository in your deployment dashboard (e.g. Vercel).
3. Under **Project Settings** → **Environment Variables**, add all 8 variables listed above.
4. Deploy the project. The build process runs `npm run build` which produces static pages and dynamic edge/server routes.
5. In your custom domain DNS settings, point your `@` and `www` records to your deployment provider.
