# Pay Per Crawl Template - Setup Guide for AI Agents

Context for AI coding agents to help users set up pay-per-crawl pricing for AI crawlers using the "default closed" model.

## What is Pay Per Crawl?

A Worker template that implements path-based pricing for AI crawlers. All unverified bot traffic below a configurable score threshold is blocked with HTTP 402 Payment Required, unless explicitly excepted.

**Key benefit:** This template consolidates what previously required a Worker + WAF rule into a single Worker, making deployment simpler.

---

## Step 0: Prerequisite Qualification (ASK FIRST)

> **IMPORTANT:** Before ANY technical setup, ask these 3 questions. If the user answers NO to any of them, they cannot use this template yet.

### Ask the User These Questions

**Question 1:** Do you have an Enterprise Cloudflare account with Bot Management enabled?

**Question 2:** Have you been enrolled in the Pay Per Crawl Beta program?

**Question 3:** Is your business located in one of these jurisdictions: United States, United Kingdom, European Union, Canada, or Australia?

---

### If ANY Answer is NO

Stop the technical setup and provide this guidance:

> **You're not quite ready for Pay Per Crawl yet.**
>
> Pay Per Crawl requires:
> - Enterprise plan with Bot Management
> - Enrollment in the Pay Per Crawl Beta
> - Business in a supported jurisdiction (US, UK, EU, Canada, Australia)
>
> **Next steps:**
> 1. Contact your Cloudflare account team to discuss eligibility
> 2. Review the documentation: https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/
>
> Once you have Enterprise Bot Management and Beta enrollment confirmed, come back and we can set this up!

**Do NOT proceed with technical setup if prerequisites are not met.**

---

### If ALL Answers are YES

Proceed to Step 1 to verify their dashboard state and begin technical setup.

---

## Step 1: Verify Dashboard State

Before deploying the Worker, confirm their Cloudflare account is properly configured:

### 1.1 Verify Pay Per Crawl is Enabled in Dashboard

Ask the user to check:

1. Go to **AI Crawl Control** in the Cloudflare dashboard
2. Navigate to **Settings**
3. Confirm **Pay Per Crawl** toggle is available and enabled

If the toggle is not visible, they need to contact their account team - Beta enrollment may not be complete.

### 1.2 Verify Cloudflare Authentication

```bash
npx wrangler whoami
```

If not logged in, run `npx wrangler login`.

---

## Step 2: Identify Paths to Protect

Ask the user which paths they want to charge for:

| Example Path | Description |
|-------------|-------------|
| `/blog/*` | All blog content |
| `/api/premium/*` | Premium API endpoints |
| `/content/*` | Content pages |
| `/articles/*` | Article pages |

---

## Step 3: Set Price for Each Path

For each path, determine the price in cents:

| Price (cents) | USD Amount |
|--------------|------------|
| 1 | $0.01 |
| 9 | $0.09 |
| 25 | $0.25 |
| 50 | $0.50 |
| 100 | $1.00 |

**Constraints:**
- Minimum: 1 cent ($0.01)
- Must be whole numbers (no decimals)

---

## Step 4: Set Bot Score Threshold

For each path, determine the threshold. Requests with bot score >= threshold are allowed through.

| Threshold | Description |
|-----------|-------------|
| 30 | Lenient - allows more traffic, blocks obvious bots |
| 50 | Moderate - balanced approach |
| 70 | Strict - blocks most bot-like traffic |

**This is REQUIRED** - there is no default value.

---

## Step 5: Add Bot Exceptions (Optional)

If the user wants specific bots to always pass through (e.g., allow Googlebot for SEO), add them to `except_bots`.

**If the user specifies a bot name that isn't recognized**, ask:

1. "Should we match on User-Agent string instead?"
2. "Do you have a Cloudflare detection ID for this bot?"
3. "Is there another way we can identify this crawler?"

---

## Step 6: Configure wrangler.jsonc

Edit `wrangler.jsonc` with the gathered information:

```jsonc
"PRICING_RULES": [
  {
    "pattern": "/blog/*",
    "price_cents": 9,
    "bot_score_threshold": 30,
    "except_bots": ["Googlebot", "BingBot"]
  },
  {
    "pattern": "/premium/*",
    "price_cents": 50,
    "bot_score_threshold": 50
  }
]
```

---

## Step 7: Configure Routes

Uncomment and edit the routes section:

```jsonc
"routes": [
  {
    "pattern": "example.com/*",
    "zone_name": "example.com"
  }
]
```

---

## Step 8: Deploy

```bash
npm install
npm run deploy
```

---

## Step 9: Verify Deployment

```bash
# Test a protected path (should return 402 for bot-like requests)
curl -I https://example.com/blog/test-post

# Test a bypass path (should return 200)
curl -I https://example.com/robots.txt

# Check worker logs
npx wrangler tail
```

---

## Adding More Rules

Users can add multiple rules for different paths with different prices. Simply add more entries to the `PRICING_RULES` array:

```jsonc
"PRICING_RULES": [
  // Rule 1: Blog at $0.09
  {
    "pattern": "/blog/*",
    "price_cents": 9,
    "bot_score_threshold": 30,
    "except_bots": ["Googlebot"]
  },
  
  // Rule 2: Premium API at $0.50
  {
    "pattern": "/api/premium/*",
    "price_cents": 50,
    "bot_score_threshold": 50
  },
  
  // Rule 3: Articles at $0.25
  {
    "pattern": "/articles/*",
    "price_cents": 25,
    "bot_score_threshold": 40,
    "except_bots": ["Googlebot", "BingBot", "Applebot"]
  }
]
```

**Rules are evaluated in order** - the first matching rule wins.

---

## Updating Existing Rules

To update a rule:

1. Edit `wrangler.jsonc`
2. Modify the rule properties
3. Run `npm run deploy`

No need to delete and recreate - just edit in place.

---

## Configuration Reference

### Rule Schema

```typescript
{
  pattern: string;           // Path pattern (required)
  price_cents: number;       // Price in cents, >= 1 (required)
  bot_score_threshold: number; // 0-100, allow if score >= this (required)
  except_bots?: string[];    // Bot names to always allow (optional)
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRICING_RULES` | Yes | Array of pricing rules |
| `BYPASS_PATHS` | No | Paths that always pass through |

### Default Bypass Paths

These paths always pass through without evaluation:

- `/robots.txt`
- `/crawlers.json`
- `/security.txt`
- `/.well-known/security.txt`
- `/ads.txt`

---

## Supported Bot Names

Use these exact names in the `except_bots` array:

### Search Engine Crawlers
- `Googlebot`
- `BingBot`
- `Applebot`

### AI Crawlers
- `GPTBot` (OpenAI)
- `ClaudeBot` (Anthropic)
- `Claude-SearchBot` (Anthropic)
- `Claude-User` (Anthropic)
- `CCBot` (Common Crawl)
- `Amazonbot` (Amazon)
- `Bytespider` (ByteDance)
- `Google-CloudVertexBot` (Google)
- `Meta-ExternalAgent` (Meta)
- `FacebookBot` (Meta)
- `PetalBot` (Huawei)
- `Novellum AI Crawl` (Novellum)
- `Timpibot` (Timpi)

### AI Assistants
- `ChatGPT-User` (OpenAI)
- `ChatGPT agent` (OpenAI)
- `DuckAssistBot` (DuckDuckGo)
- `Meta-ExternalFetcher` (Meta)
- `MistralAI-User` (Mistral)
- `Perplexity-User` (Perplexity)

### AI Search
- `OAI-SearchBot` (OpenAI)
- `PerplexityBot` (Perplexity)

### Archivers
- `archive.org_bot` (Internet Archive)

### Other
- `ProRataInc` (ProRata.ai)
- `Anchor Browser` (Anchor)

---

## How It Works (Technical)

```
Request arrives at Worker route
         │
         ▼
    Is path in BYPASS_PATHS?
    ┌────────┴────────┐
   Yes               No
    │                 │
    ▼                 ▼
 Proxy to      Get bot data from cf.botManagement
 origin        (score, verifiedBot, detectionIds)
                      │
                      ▼
              Evaluate PRICING_RULES in order
                      │
              ┌───────┴───────┐
              │               │
         Rule matches    No rule matches
              │               │
              ▼               ▼
     Check exceptions    Proxy to origin
     (verified bot,      (with optional
      bot score,         Crawler-Price
      except_bots)       header)
              │
     ┌────────┴────────┐
Exception met       No exception
     │                    │
     ▼                    ▼
 Proxy to            Return 402
 origin              with pricing
```

---

## Common Issues

### "Bot score is always 99"

**Cause:** Bot Management is not enabled on this zone.

**Fix:** Enable Enterprise Bot Management in the Cloudflare dashboard:
Zone → Security → Bots → Configure Bot Management

### "Verified bots are still getting through"

**Expected behavior.** Verified bots are always allowed to prevent breaking legitimate search engine indexing. This matches how WAF rules work.

To block verified bots, you would need to modify the worker code directly (not recommended).

### "Unknown bot name" error

**Cause:** The bot name isn't in the supported list.

**Fix:** Ask the user:
1. "Should we match on User-Agent string instead?"
2. "Do you have a Cloudflare detection ID?"
3. "Is there another way to identify this bot?"

### "Route already exists" error

**Cause:** Another worker owns this route.

**Fix:** See the x402-proxy template AGENTS.md for route migration guidance. In short:
1. Remove route from existing worker's config
2. Redeploy existing worker
3. Deploy this worker with routes

### "402 responses not appearing"

**Possible causes:**
1. Bot Management not enabled (check prerequisites)
2. Pay Per Crawl Beta not enabled
3. Request bot score is above threshold
4. Request is from a verified bot
5. Path doesn't match any rule pattern

**Debug:** Check worker logs with `npx wrangler tail`

---

## Pre-Deploy Checklist

Before running `npm run deploy`, verify:

- [ ] Prerequisites met (Enterprise Bot Management + PPC Beta)
- [ ] At least one rule in `PRICING_RULES`
- [ ] Each rule has `pattern`, `price_cents`, and `bot_score_threshold`
- [ ] All `except_bots` names are from the supported list
- [ ] Routes configured with correct `pattern` and `zone_name`
- [ ] No other worker owns the target routes

---

## Testing Locally

```bash
npm install
npm run dev

# Note: Bot Management data won't be available locally
# All requests will pass through (no blocking)
# Use `npx wrangler tail` after deployment for real testing
```

---

## Additional Resources

- [AI Crawl Control Documentation](https://developers.cloudflare.com/ai-crawl-control/)
- [Pay Per Crawl Guide](https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/)
- [Bot Management](https://developers.cloudflare.com/bots/)
- [Workers Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [x402 Protocol](https://x402.org)
