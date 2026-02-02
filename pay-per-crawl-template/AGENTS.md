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

### 1.3 Install Dependencies

```bash
npm install
```

This installs wrangler and TypeScript dependencies needed for the template.

---

## Step 2: Select Domain and Confirm Account

> **Ask these together in a single prompt:**

1. **"Which domain do you want to set up Pay Per Crawl for?"**
2. **"Which Cloudflare account is this domain on?"** (if user has multiple accounts from `wrangler whoami`)

Let the user provide the domain name directly. If they have multiple Cloudflare accounts, confirm which account contains this domain.

Confirm the domain is on an **Enterprise plan** with **Bot Management enabled** before proceeding.

### Generate Worker Name

Once you have the domain, generate the worker name:

| Domain | Worker Name |
|--------|-------------|
| `example.com` | `pay-per-crawl-example-com` |
| `shop.example.co.uk` | `pay-per-crawl-shop-example-co-uk` |

Worker names: lowercase alphanumeric and hyphens only. Replace `.` with `-`, prefix with `pay-per-crawl-`.

---

## Step 3: Collect All Path Patterns

> **Ask for ALL paths at once before configuring pricing:**

Ask: **"Which URL paths do you want to charge for? List all of them."**

Examples:
- `/blog/*` - All blog content
- `/articles/*` - Article pages
- `/api/premium/*` - Premium API endpoints

**Save this list** - you'll configure each path individually in the next step.

---

## Step 4: Configure Each Path (Iterate)

> **For EACH path from Step 3, ask for these settings one path at a time:**

### 4.1 Price

Ask: **"What price (in USD) for `{path}`?"**

**Format requirements:**
- Enter as a decimal number in USD (e.g., `0.25` for 25 cents, `1.00` for one dollar)
- Minimum: `0.01` (one cent)
- Must be whole cent increments

**Do NOT suggest specific prices.** Pricing strategy is entirely up to the publisher.

> **IMPORTANT:** The $0.01 minimum and whole cent requirement are **Pay Per Crawl system-level constraints**, not just template validation. Prices below $0.01 will not be enforced. Fractional cent prices may cause inconsistent behavior.

### 4.2 Bot Score Threshold

Ask: **"What bot score threshold for `{path}`?"**

**ALWAYS offer exactly these three options:**

| Option | Threshold | What it blocks |
|--------|-----------|----------------|
| **1** | 1 | Known bots (score = 1) |
| **2** | 2 | Certainly automated traffic (score ≤ 2) |
| **30 (Recommended)** | 30 | Likely automated traffic (score ≤ 30) |

**Recommended: 30** - This is the typical starting point that blocks known bots and likely-automated traffic while allowing humans through.

### 4.3 Bot Exceptions (Optional)

Ask: **"Any bots that should get FREE access to `{path}`?"**

Offer these preset options:
- **Search engines only** - `Googlebot`, `BingBot`, `Applebot` (maintains SEO)
- **Search + AI assistants** - Also includes `ChatGPT-User`, `Claude-User`, `Perplexity-User`, etc.
- **None** - All bots must pay

If the user names specific bots, match them to the supported list in `src/bots.ts`.

### Repeat for Each Path

Complete Steps 4.1-4.3 for each path before proceeding to configuration.

---

## Step 5: Configure wrangler.jsonc

Edit `wrangler.jsonc` with the gathered information.

### 5.1 Set Worker Name and Account ID

```jsonc
"name": "pay-per-crawl-example-com",
"account_id": "your-account-id-here",
```

### 5.2 Add Routes for Each Priced Path

**IMPORTANT:** Create ONE route for EACH path pattern. This keeps the worker narrow - it only intercepts paths that need pricing evaluation.

**Format:** `{domain}{pattern}`

Example for `example.com` with `/blog/*` and `/premium/*`:

```jsonc
"routes": [
  { "pattern": "example.com/blog/*", "zone_name": "example.com" },
  { "pattern": "example.com/premium/*", "zone_name": "example.com" }
],
```

### 5.3 Add Pricing Rules

```jsonc
"PRICING_RULES": [
  {
    "pattern": "/path-from-step-3/*",
    "price": /* user's price */,
    "bot_score_threshold": /* 1, 2, or 30 */,
    "except_bots": [/* bots from step 4.3 */]
  }
]
```

**Each PRICING_RULE pattern must have a matching route!**

---

## Step 6: Deploy

```bash
npm install
npm run deploy
```

---

## Step 7: Verify Deployment

**Replace `example.com` with the user's actual domain in these commands.**

```bash
# Test a protected path (should return 402 for bot-like requests)
curl -I https://example.com/blog/test-post

# Check worker logs
npx wrangler tail
```

---

## Adding More Rules

Users can add multiple rules for different paths with different prices. Simply add more entries to the `PRICING_RULES` array:

```jsonc
"PRICING_RULES": [
  // Rule 1: Blog content
  {
    "pattern": "/blog/*",
    "price": /* your price */,
    "bot_score_threshold": 30,
    "except_bots": ["Googlebot", "BingBot"]
  },
  
  // Rule 2: Premium API (stricter threshold)
  {
    "pattern": "/api/premium/*",
    "price": /* your price */,
    "bot_score_threshold": 2
  },
  
  // Rule 3: Articles
  {
    "pattern": "/articles/*",
    "price": /* your price */,
    "bot_score_threshold": 30,
    "except_bots": ["Googlebot", "BingBot", "Applebot"]
  }
]
```

**Rules are evaluated in order** - the first matching rule wins.

Different paths can have different prices, thresholds, and bot exceptions based on content value and your business needs.

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
  pattern: string;              // Path pattern (required)
  price: number;                // Price in USD, >= 0.01, whole cents (required - SYSTEM CONSTRAINT)
  bot_score_threshold: number;  // 1, 2, or 30 (required)
  except_bots?: string[];       // Bot names to always allow (optional)
  except_detection_ids?: number[]; // Raw detection IDs to always allow (optional)
}
```

**About `except_detection_ids`:** Use this when you have specific bot detection IDs that aren't in the standard bot registry. Both `except_bots` and `except_detection_ids` can be used together - they're merged when evaluating exceptions.

### Bot Score Threshold Reference

| Threshold | Meaning | Use Case |
|-----------|---------|----------|
| **1** | Blocks known bots (score = 1) | Very permissive - most traffic passes |
| **2** | Blocks certainly automated (score ≤ 2) | Permissive - blocks obvious bots only |
| **30** | Blocks likely automated (score ≤ 30) | **Recommended** - balanced approach |

### Files to Edit

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Main config: worker name, routes, pricing rules |
| `src/bots.config.ts` | Bot exception presets (easy to read/edit) |
| `src/bots.ts` | Full bot registry with detection IDs (reference only) |

### Why Narrow Routes?

Instead of a catch-all route (`example.com/*`), this template uses **one route per priced path**:

```jsonc
// Good - narrow routes
"routes": [
  { "pattern": "example.com/blog/*", "zone_name": "example.com" },
  { "pattern": "example.com/premium/*", "zone_name": "example.com" }
]

// Avoid - catch-all route
"routes": [
  { "pattern": "example.com/*", "zone_name": "example.com" }
]
```

**Benefits:**
- Worker only intercepts traffic it needs to evaluate
- Zero overhead on unpriced paths (homepage, assets, etc.)
- Cleaner Worker list in Cloudflare dashboard
- Easier to debug and reason about

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRICING_RULES` | Yes | Array of pricing rules |

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

## Finding Detection IDs for Custom Bots

If a bot isn't in the supported list, the user can find its detection ID in the dashboard:

1. Go to **AI Crawl Control**
2. Navigate to **Crawlers**
3. Find the crawler in the list
4. Click the **three dot menu** in the Actions column
5. Copy the detection ID

Then use `except_detection_ids` instead of `except_bots`:

```jsonc
{
  "pattern": "/blog/*",
  "price": 0.50,
  "bot_score_threshold": 30,
  "except_bots": ["Googlebot"],
  "except_detection_ids": [123456789, 987654321]
}
```

---

## How It Works (Technical)

```
Request arrives at Worker route
         │
         ▼
    Bot Management data available?
    ┌────────┴────────┐
   No                Yes
    │                 │
    ▼                 ▼
 Log warning    Extract bot data (score, verifiedBot, detectionIds)
 Pass through        │
 to origin           ▼
              In-band pricing header present?
              (cf-pay-per-crawl: pricing=in-band)
                     │
              ┌──────┴──────┐
             No            Yes
              │             │
              ▼             ▼
         Log warning   Continue
         Continue           │
              └──────┬──────┘
                     │
                     ▼
              Evaluate PRICING_RULES in order
                     │
              ┌──────┴──────┐
              │             │
         Rule matches  No rule matches
              │             │
              ▼             ▼
     Check exceptions  Proxy to origin
     (verified bot,    (+ Crawler-Price header
      bot score,        if in-band enabled)
      except_bots)
              │
     ┌────────┴────────┐
Exception met       No exception
     │                    │
     ▼                    ▼
 Proxy to            Return 402
 origin              (x402 v2.0.0 format)
```

### 402 Response Format (x402 v2.0.0)

```json
{
  "x402Version": "2.0.0",
  "accepts": [{
    "scheme": "deferred",
    "network": "cloudflare:402",
    "resource": "/path/from/request",
    "amount": "0.50",
    "asset": "USD"
  }],
  "error": "Payment is required to access content. Please refer to the Cloudflare Pay Per Crawl documentation for more information. https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/what-is-pay-per-crawl/"
}
```

**Headers:**
- `Content-Type: application/json`
- `Crawler-Price: USD 0.50`

---

## Common Issues

### "Bot score is always 99"

**Meaning:** A score of 99 means "definitely human" - this traffic is legitimate and will pass through without paying (as expected).

If you're seeing this on traffic you expect to be bots, possible causes:
1. The crawler is using a residential proxy or human-like behavior
2. Bot Management hasn't fully classified this traffic yet

### "Bot score is missing or 0/-1"

**Cause:** Bot Management is not enabled on this zone, or there was an error computing the score.

**Fix:** Enable Enterprise Bot Management in the Cloudflare dashboard:
Zone → Security → Bots → Configure Bot Management

### "Verified bots are still getting through"

**Expected behavior.** Verified bots (score 1) are always allowed through by default. This matches how WAF rules work.

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
- [ ] Each rule has `pattern`, `price`, and `bot_score_threshold`
- [ ] All prices are >= $0.01 and in whole cent increments (system requirement)
- [ ] All `bot_score_threshold` values are 1, 2, or 30
- [ ] All `except_bots` names are from the supported list
- [ ] All `except_detection_ids` are positive integers (if used)
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
