# Deployment Guide

This guide explains how to deploy the Fail-Safe Mail worker with AI Agent using different environments for testing and production.

## Overview

- **Production Worker**: `fail-safe-mail` (from `wrangler.jsonc` - default)
- **Dev Worker**: `fail-safe-mail-dev` (from `wrangler.jsonc` - dev environment)
- **Staging Worker**: `fail-safe-mail-agent-staging` (from `wrangler.staging.jsonc` - optional)

The dev and staging workers allow you to test the AI agent functionality without affecting your production email routing.

## Setup Steps

### 1. Create R2 Buckets for Testing

Create separate R2 buckets for dev and staging to avoid mixing test data with production:

**Dev Environment:**
```bash
wrangler r2 bucket create fail-safe-mail-storage-dev
```

**Staging Environment (if using wrangler.staging.jsonc):**
```bash
wrangler r2 bucket create fail-safe-mail-storage-staging
```

### 2. Configure Email Routing for Testing

To test the dev or staging workers, you'll need to set up email routing in Cloudflare Dashboard:

1. Go to **Email Routing** in your Cloudflare dashboard
2. Create a new **Email Worker** route or use a test email address
3. Point it to the appropriate worker:
   - Dev: `fail-safe-mail-dev`
   - Staging: `fail-safe-mail-agent-staging`

**Option A: Use a Test Subdomain**
- Set up a test subdomain like `test@yourdomain.com` or `dev@yourdomain.com`
- Route it to the dev or staging worker

**Option B: Use a Different Domain**
- Use a completely separate domain for testing
- Route all emails to the dev or staging worker

**Option C: Manual Testing**
- Deploy the dev or staging worker
- Use Cloudflare's Email Workers testing tools
- Or temporarily switch your production route to dev/staging for testing

### 3. Deploy Dev Worker

Deploy the dev worker with the agent (recommended for testing):

```bash
wrangler deploy --env dev
```

Or for local development:

```bash
wrangler dev --env dev
```

### 4. Deploy Staging Worker (Alternative)

Alternatively, deploy the staging worker with the agent:

```bash
npm run deploy:staging
```

Or manually:

```bash
wrangler deploy --config wrangler.staging.jsonc
```

### 5. Test the Workers

You can test locally first:

**Dev Environment:**
```bash
wrangler dev --env dev
```

**Staging Environment:**
```bash
npm run dev:staging
```

Then send test emails to your test email address to verify:
- Agent analysis works correctly
- Replies are sent properly
- Email forwarding still works

### 6. Deploy Production Worker (When Ready)

Once testing is complete and you're satisfied with the agent:

```bash
npm run deploy
```

This will deploy to the production worker `fail-safe-mail`.

## Configuration Differences

| Setting | Production | Dev | Staging |
|---------|-----------|-----|---------|
| Worker Name | `fail-safe-mail` | `fail-safe-mail-dev` | `fail-safe-mail-agent-staging` |
| R2 Bucket | `fail-safe-mail-storage` | `fail-safe-mail-storage-dev` | `fail-safe-mail-storage-staging` |
| Config File | `wrangler.jsonc` | `wrangler.jsonc` (env: dev) | `wrangler.staging.jsonc` |
| Deploy Command | `wrangler deploy` | `wrangler deploy --env dev` | `wrangler deploy --config wrangler.staging.jsonc` |
| Dev Command | `wrangler dev` | `wrangler dev --env dev` | `wrangler dev --config wrangler.staging.jsonc` |

## Switching Between Environments

### Deploy to Dev (Recommended for Testing)
```bash
wrangler deploy --env dev
```

### Deploy to Staging (Alternative)
```bash
npm run deploy:staging
# or
wrangler deploy --config wrangler.staging.jsonc
```

### Deploy to Production
```bash
wrangler deploy
```

### Local Development - Dev
```bash
wrangler dev --env dev
```

### Local Development - Staging
```bash
npm run dev:staging
# or
wrangler dev --config wrangler.staging.jsonc
```

### Local Development - Production
```bash
wrangler dev
```

## Important Notes

1. **Email Routing**: Make sure your Cloudflare Email Routing is configured to point to the correct worker
2. **Durable Objects**: Each environment has its own Durable Objects namespace, so agent state is separate
3. **R2 Storage**: Dev, staging, and production use separate buckets
4. **Secrets**: If you use Discord webhooks or other secrets, set them for each environment:
   ```bash
   # Production (default)
   wrangler secret put DISCORD_WEBHOOK_URL
   
   # Dev environment
   wrangler secret put DISCORD_WEBHOOK_URL --env dev
   
   # Staging environment
   wrangler secret put DISCORD_WEBHOOK_URL --config wrangler.staging.jsonc
   ```
5. **Environment Selection**: The `--env dev` flag uses the dev environment defined in `wrangler.jsonc`. This is the recommended approach for testing as it keeps everything in one config file.

## Testing Strategy

1. **Start with Dev**: Deploy to dev environment first and test thoroughly (`wrangler deploy --env dev`)
2. **Use Test Emails**: Send test emails to verify agent responses
3. **Monitor Logs**: Check Cloudflare dashboard for worker logs
4. **Verify Replies**: Ensure replies are sent correctly
5. **Check Forwarding**: Verify original emails still forward properly
6. **Production Rollout**: Once confident, deploy to production (`wrangler deploy`)

## Rollback Plan

If you need to rollback:

1. **Quick Rollback**: Switch Email Routing back to the original `fail-safe-mail` worker (without agent)
2. **Code Rollback**: Revert to the master branch code
3. **Redeploy**: Deploy the original worker configuration

## Troubleshooting

### Dev/Staging Worker Not Receiving Emails
- Check Email Routing configuration in Cloudflare Dashboard
- Verify the worker name matches:
  - Dev: `fail-safe-mail-dev`
  - Staging: `fail-safe-mail-agent-staging`
- Check worker logs in Cloudflare Dashboard

### Agent Not Responding
- Check Durable Objects are properly configured
- Verify the agent class is exported correctly
- Check worker logs for errors

### Replies Not Sending
- Verify `mimetext` package is installed: `npm install`
- Check email format requirements (DMARC, etc.)
- Check worker logs for reply errors
