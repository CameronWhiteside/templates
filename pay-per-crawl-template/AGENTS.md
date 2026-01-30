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

## Step 2: Get Domain and Worker Name

### 2.1 Get Available Domains

First, list the user's Cloudflare zones:

```bash
npx wrangler zones list
```

This returns their available domains. Present these as options, or let them type their own.

### 2.2 Ask Which Domain to Protect

Ask the user: **Which domain will this worker protect?**

(No pre-populated suggestions - use their actual zones from the command above, or let them type it.)

### 2.3 Generate Worker Name

Workers names only allow **lowercase alphanumeric characters and hyphens**.

**Sanitization steps:**
1. Convert to lowercase
2. Replace `.` and `_` with `-`
3. Remove any character that's not `a-z`, `0-9`, or `-`
4. Collapse multiple hyphens (`--`) into single (`-`)
5. Remove leading/trailing hyphens
6. Prefix with `pay-per-crawl-`

**Examples:**
| Domain | Worker Name |
|--------|-------------|
| `Example.COM` | `pay-per-crawl-example-com` |
| `my_site.io` | `pay-per-crawl-my-site-io` |
| `shop.example.co.uk` | `pay-per-crawl-shop-example-co-uk` |

**JavaScript helper:**
```javascript
function toWorkerName(domain) {
  const slug = domain
    .toLowerCase()
    .replace(/[._]/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `pay-per-crawl-${slug}`;
}
```

Update `wrangler.jsonc`:
```jsonc
"name": "pay-per-crawl-example-com",
```

---

## Step 3: Identify Paths to Protect

Ask the user which paths they want to charge for:

| Example Path | Description |
|-------------|-------------|
| `/blog/*` | All blog content |
| `/api/premium/*` | Premium API endpoints |
| `/content/*` | Content pages |
| `/articles/*` | Article pages |

**Save these paths** - you'll need them for both PRICING_RULES and routes.

---

## Step 4: Set Price for Each Path

Ask the user: **What price do you want to set for each path?**

**Format requirements:**
- Enter as a decimal number in USD (e.g., `0.25` for 25 cents, `1.00` for one dollar)
- Minimum: `0.01` (one cent)
- Must be whole cent increments

**Do NOT suggest specific prices.** Pricing strategy is entirely up to the publisher.

---

## Step 5: Set Bot Score Threshold

For each path, determine the threshold. Requests with bot score >= threshold are allowed through.

### How Bot Scores Work

Cloudflare Bot Management assigns a score from 1-99:

| Score | Meaning |
|-------|---------|
| 1 | **Verified bot** - known crawler (Googlebot, etc.) |
| 2-29 | **Likely automated** - probable bot traffic |
| 30-49 | **Possibly automated** - suspicious but uncertain |
| 50-69 | **Likely human** - probably legitimate traffic |
| 70-99 | **Definitely human** - very high confidence |
| 0 or -1 | **Error** - score couldn't be computed |

**Lower score = more likely a bot. Higher score = more likely human.**

### Choosing a Threshold

The threshold determines which requests pass through without paying:

| Threshold | Effect | Use Case |
|-----------|--------|----------|
| 30 | Blocks scores 1-29, allows 30+ | Lenient - only blocks obvious bots |
| 50 | Blocks scores 1-49, allows 50+ | Moderate - blocks suspicious traffic |
| 70 | Blocks scores 1-69, allows 70+ | Strict - only allows definite humans |

**Recommended starting point: 30** - This blocks known bots and likely-automated traffic while allowing uncertain cases through. You can tighten later if needed.

**This is REQUIRED** - there is no default value.

---

## Step 6: Add Bot Exceptions

Help the user decide which bots should be allowed through WITHOUT paying. Ask these questions in order:

### Question 1: Search Engine Visibility

**"Do you want search engines to index this content for SEO?"**

If YES, add these to `except_bots`:
| Bot | Operator | Purpose |
|-----|----------|---------|
| `Googlebot` | Google | Google Search indexing |
| `BingBot` | Microsoft | Bing Search indexing |
| `Applebot` | Apple | Apple Search / Siri |

### Question 2: AI Assistant Citations

**"Do you want AI assistants to cite your content when users ask questions in real-time?"**

(These fetch content live when a user asks a question, and may cite/link back to you)

If YES, add these to `except_bots`:
| Bot | Operator | Purpose |
|-----|----------|---------|
| `ChatGPT-User` | OpenAI | ChatGPT browsing mode |
| `Claude-User` | Anthropic | Claude web access |
| `Perplexity-User` | Perplexity | Perplexity answers |
| `MistralAI-User` | Mistral | Mistral chat |
| `DuckAssistBot` | DuckDuckGo | DuckDuckGo AI answers |
| `Meta-ExternalFetcher` | Meta | Meta AI assistant |

### Question 3: AI Search Engines

**"Do you want AI-powered search engines to include your content in search results?"**

If YES, add these to `except_bots`:
| Bot | Operator | Purpose |
|-----|----------|---------|
| `OAI-SearchBot` | OpenAI | SearchGPT |
| `PerplexityBot` | Perplexity | Perplexity search crawler |
| `Claude-SearchBot` | Anthropic | Claude search |

### Question 4: AI Training Crawlers

**"Do you want AI companies to crawl your content for model training?"**

(Most publishers say NO here - this is the content they typically want to charge for)

If YES, add these to `except_bots`:
| Bot | Operator | Purpose |
|-----|----------|---------|
| `GPTBot` | OpenAI | OpenAI training data |
| `ClaudeBot` | Anthropic | Anthropic training data |
| `CCBot` | Common Crawl | Common Crawl dataset |
| `Google-CloudVertexBot` | Google | Google AI training |
| `Meta-ExternalAgent` | Meta | Meta AI training |
| `Amazonbot` | Amazon | Amazon AI training |
| `Bytespider` | ByteDance | ByteDance/TikTok AI |
| `PetalBot` | Huawei | Huawei AI |
| `FacebookBot` | Meta | Meta crawling |

### Question 5: Web Archives

**"Do you want your content preserved in web archives like the Internet Archive?"**

If YES, add to `except_bots`:
| Bot | Operator | Purpose |
|-----|----------|---------|
| `archive.org_bot` | Internet Archive | Wayback Machine |

### Question 6: Other Bots

**"Are there any other specific bots you want to allow?"**

Additional available bots:
| Bot | Operator | Purpose |
|-----|----------|---------|
| `ChatGPT agent` | OpenAI | ChatGPT agents/plugins |
| `Novellum AI Crawl` | Novellum | Novellum AI |
| `Timpibot` | Timpi | Timpi search |
| `ProRataInc` | ProRata.ai | ProRata content licensing |
| `Anchor Browser` | Anchor | Anchor AI browser |

### If User Mentions an Unrecognized Bot

Ask:
1. "Do you have the exact bot name or User-Agent string?"
2. "Do you have a Cloudflare detection ID for this bot?"

See `src/bots.ts` for the full registry with detection IDs.

---

## Step 7: Configure wrangler.jsonc

Edit `wrangler.jsonc` with the gathered information.

### 7.1 Set Worker Name (from Step 2)

```jsonc
"name": "pay-per-crawl-willsguitars-com",
```

### 7.2 Add Routes for Each Priced Path

**IMPORTANT:** Create ONE route for EACH path pattern. This keeps the worker narrow - it only intercepts paths that need pricing evaluation.

**Format:** `{domain}{pattern}`

Example for `willsguitars.com` with `/blog/*` and `/premium/*`:

```jsonc
"routes": [
  { "pattern": "willsguitars.com/blog/*", "zone_name": "willsguitars.com" },
  { "pattern": "willsguitars.com/premium/*", "zone_name": "willsguitars.com" }
],
```

### 7.3 Add Pricing Rules

```jsonc
"PRICING_RULES": [
  {
    "pattern": "/path-from-step-3/*",
    "price": /* user's price from Step 4 */,
    "bot_score_threshold": /* threshold from Step 5 */,
    "except_bots": [/* bots from Step 6 */]
  }
]
```

**Each PRICING_RULE pattern must have a matching route!**

For bot exceptions, you can also edit `src/bots.config.ts` which has preset combinations:
- `STANDARD_EXCEPTIONS` - Search engines only
- `PERMISSIVE_EXCEPTIONS` - Search engines + AI assistants
- `NO_EXCEPTIONS` - No free access

---

## Step 8: Deploy

```bash
npm install
npm run deploy
```

---

## Step 9: Verify Deployment

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
  
  // Rule 2: Premium API (different price/threshold)
  {
    "pattern": "/api/premium/*",
    "price": /* your price */,
    "bot_score_threshold": 50
  },
  
  // Rule 3: Articles (allow more bots)
  {
    "pattern": "/articles/*",
    "price": /* your price */,
    "bot_score_threshold": 40,
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
  pattern: string;           // Path pattern (required)
  price: number;             // Price in USD, >= 0.01, whole cents (required)
  bot_score_threshold: number; // 0-100, allow if score >= this (required)
  except_bots?: string[];    // Bot names to always allow (optional)
}
```

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
    "network": "cloudflare:com",
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
- [ ] Each rule has `pattern`, `price`, and `bot_score_threshold`
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
