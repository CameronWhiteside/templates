/**
 * Pay Per Crawl - Bot Exceptions Configuration
 *
 * This file defines which bots are ALLOWED through without paying.
 * Edit this file to customize bot exceptions for your site.
 *
 * ============================================================================
 * HOW TO USE
 * ============================================================================
 *
 * 1. Add bot names to the arrays below (use exact names from SUPPORTED_BOTS)
 * 2. Reference these arrays in wrangler.jsonc using `except_bots`
 * 3. Run `npm run deploy` to apply changes
 *
 * ============================================================================
 * SUPPORTED BOT NAMES
 * ============================================================================
 *
 * Search Engine Crawlers (usually want to allow for SEO):
 *   - "Googlebot"          - Google Search
 *   - "BingBot"            - Microsoft Bing
 *   - "Applebot"           - Apple Search / Siri
 *
 * AI Crawlers (training data collection):
 *   - "GPTBot"             - OpenAI training
 *   - "ClaudeBot"          - Anthropic training
 *   - "Claude-SearchBot"   - Anthropic search
 *   - "CCBot"              - Common Crawl
 *   - "Amazonbot"          - Amazon
 *   - "Bytespider"         - ByteDance / TikTok
 *   - "Google-CloudVertexBot" - Google AI
 *   - "Meta-ExternalAgent" - Meta / Facebook AI
 *   - "PetalBot"           - Huawei
 *
 * AI Assistants (real-time user requests):
 *   - "ChatGPT-User"       - ChatGPT browsing
 *   - "ChatGPT agent"      - ChatGPT agents
 *   - "Claude-User"        - Claude browsing
 *   - "Perplexity-User"    - Perplexity browsing
 *   - "MistralAI-User"     - Mistral browsing
 *   - "DuckAssistBot"      - DuckDuckGo AI
 *
 * AI Search:
 *   - "OAI-SearchBot"      - OpenAI SearchGPT
 *   - "PerplexityBot"      - Perplexity search
 *
 * Archivers:
 *   - "archive.org_bot"    - Internet Archive
 *
 * Full list with detection IDs: see src/bots.ts
 *
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// SEARCH ENGINE BOTS - Allow for SEO
// ---------------------------------------------------------------------------
// These bots help your site appear in search results.
// Most sites want to allow these.

export const SEARCH_ENGINE_BOTS = [
	"Googlebot",
	"BingBot",
	"Applebot",
] as const;

// ---------------------------------------------------------------------------
// AI ASSISTANT BOTS - Allow for user experience
// ---------------------------------------------------------------------------
// These bots fetch content in real-time when users ask questions.
// Allowing them means your content can be cited in AI answers.

export const AI_ASSISTANT_BOTS = [
	"ChatGPT-User",
	"Claude-User",
	"Perplexity-User",
	// "MistralAI-User",
	// "DuckAssistBot",
] as const;

// ---------------------------------------------------------------------------
// AI CRAWLER BOTS - Usually want to charge/block
// ---------------------------------------------------------------------------
// These bots collect training data. You probably want to charge them.
// Uncomment any you want to allow for free.

export const AI_CRAWLER_BOTS = [
	// "GPTBot",           // OpenAI training
	// "ClaudeBot",        // Anthropic training
	// "CCBot",            // Common Crawl
	// "Bytespider",       // ByteDance
	// "Meta-ExternalAgent", // Meta AI
] as const;

// ---------------------------------------------------------------------------
// PRESET COMBINATIONS - Use these in wrangler.jsonc
// ---------------------------------------------------------------------------

/**
 * Standard exceptions: Search engines only.
 * Use this if you want to charge AI bots but maintain SEO.
 */
export const STANDARD_EXCEPTIONS = [
	...SEARCH_ENGINE_BOTS,
] as const;

/**
 * Permissive exceptions: Search engines + AI assistants.
 * Use this if you want your content cited in AI answers.
 */
export const PERMISSIVE_EXCEPTIONS = [
	...SEARCH_ENGINE_BOTS,
	...AI_ASSISTANT_BOTS,
] as const;

/**
 * Strict: No exceptions.
 * Use this if you want to charge ALL bots.
 */
export const NO_EXCEPTIONS: string[] = [];
