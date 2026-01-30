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
// SEARCH ENGINE BOTS
// ---------------------------------------------------------------------------
// These bots index your site for search results.
// Allowing them maintains SEO visibility.

export const SEARCH_ENGINE_BOTS = [
	"Googlebot",        // Google Search
	"BingBot",          // Microsoft Bing
	"Applebot",         // Apple Search / Siri
] as const;

// ---------------------------------------------------------------------------
// AI ASSISTANT BOTS
// ---------------------------------------------------------------------------
// These fetch content in real-time when users ask questions.
// Allowing them means your content can be cited in AI answers.

export const AI_ASSISTANT_BOTS = [
	"ChatGPT-User",     // ChatGPT browsing mode
	"Claude-User",      // Claude web access
	"Perplexity-User",  // Perplexity answers
	"MistralAI-User",   // Mistral chat
	"DuckAssistBot",    // DuckDuckGo AI
	"Meta-ExternalFetcher", // Meta AI assistant
] as const;

// ---------------------------------------------------------------------------
// AI SEARCH BOTS
// ---------------------------------------------------------------------------
// AI-powered search engines that may cite/link to your content.

export const AI_SEARCH_BOTS = [
	"OAI-SearchBot",    // OpenAI SearchGPT
	"PerplexityBot",    // Perplexity search crawler
	"Claude-SearchBot", // Anthropic search
] as const;

// ---------------------------------------------------------------------------
// AI TRAINING CRAWLERS
// ---------------------------------------------------------------------------
// These collect content for AI model training.

export const AI_TRAINING_BOTS = [
	"GPTBot",           // OpenAI training
	"ClaudeBot",        // Anthropic training
	"CCBot",            // Common Crawl dataset
	"Google-CloudVertexBot", // Google AI training
	"Meta-ExternalAgent",    // Meta AI training
	"Amazonbot",        // Amazon AI
	"Bytespider",       // ByteDance / TikTok
	"PetalBot",         // Huawei
	"FacebookBot",      // Meta crawling
] as const;

// ---------------------------------------------------------------------------
// ARCHIVER BOTS
// ---------------------------------------------------------------------------
// Web archiving services that preserve content.

export const ARCHIVER_BOTS = [
	"archive.org_bot",  // Internet Archive / Wayback Machine
] as const;

// ---------------------------------------------------------------------------
// OTHER BOTS
// ---------------------------------------------------------------------------

export const OTHER_BOTS = [
	"ChatGPT agent",    // ChatGPT agents/plugins
	"Novellum AI Crawl", // Novellum AI
	"Timpibot",         // Timpi search
	"ProRataInc",       // ProRata content licensing
	"Anchor Browser",   // Anchor AI browser
] as const;

// ---------------------------------------------------------------------------
// PRESET COMBINATIONS
// ---------------------------------------------------------------------------
// Use these as starting points, or build your own from the arrays above.

/**
 * Search engines only - maintains SEO visibility.
 */
export const STANDARD_EXCEPTIONS = [...SEARCH_ENGINE_BOTS] as const;

/**
 * Search engines + AI assistants - allows real-time citations.
 */
export const PERMISSIVE_EXCEPTIONS = [
	...SEARCH_ENGINE_BOTS,
	...AI_ASSISTANT_BOTS,
] as const;

/**
 * No exceptions - all bots subject to pricing.
 */
export const NO_EXCEPTIONS: string[] = [];
