/**
 * x402-proxy Template - Bot Exception Presets (Agent Reference Only)
 *
 * This file defines preset bot groups for easy exception configuration.
 * AI agents use these presets during setup to help users choose which
 * bots should get free access to protected routes.
 *
 * IMPORTANT: At setup time, the agent resolves these bot names to detection IDs
 * and writes the numeric IDs to wrangler.jsonc. This file is not used at runtime.
 *
 * ============================================================================
 * HOW AGENTS USE THIS FILE
 * ============================================================================
 *
 * 1. User selects a preset (e.g., "Search engines only")
 * 2. Agent looks up bot names in this file
 * 3. Agent resolves each name to detection IDs using bots.ts
 * 4. Agent writes the resolved IDs to wrangler.jsonc with inline comments
 *
 * Example output in wrangler.jsonc:
 * "except_detection_ids": [
 *   120623194,  // Googlebot - maintains Google Search visibility
 *   117479730,  // BingBot - maintains Bing Search visibility
 *   120424214   // Applebot - maintains Apple/Siri visibility
 * ]
 *
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// SEARCH ENGINE BOTS
// ---------------------------------------------------------------------------
// These bots index your site for search results.
// Allowing them maintains SEO visibility.

export const SEARCH_ENGINE_BOTS = [
	"Googlebot",        // Google Search - 120623194
	"BingBot",          // Microsoft Bing - 117479730
	"Applebot",         // Apple Search / Siri - 120424214
] as const;

// ---------------------------------------------------------------------------
// AI ASSISTANT BOTS
// ---------------------------------------------------------------------------
// These fetch content in real-time when users ask questions.
// Allowing them means your content can be cited in AI answers.

export const AI_ASSISTANT_BOTS = [
	"ChatGPT-User",         // ChatGPT browsing mode - 132995013
	"Claude-User",          // Claude web access - (heuristics: 33564303)
	"Perplexity-User",      // Perplexity answers - (heuristics: 33564371)
	"MistralAI-User",       // Mistral chat - 128950951
	"DuckAssistBot",        // DuckDuckGo AI - 126666910
	"Meta-ExternalFetcher", // Meta AI assistant - 132272919
] as const;

// ---------------------------------------------------------------------------
// AI SEARCH BOTS
// ---------------------------------------------------------------------------
// AI-powered search engines that may cite/link to your content.

export const AI_SEARCH_BOTS = [
	"OAI-SearchBot",    // OpenAI SearchGPT - 126255384
	"PerplexityBot",    // Perplexity search crawler - (heuristics: 33563889)
	"Claude-SearchBot", // Anthropic search - (heuristics: 33564301)
] as const;

// ---------------------------------------------------------------------------
// AI TRAINING CRAWLERS
// ---------------------------------------------------------------------------
// These collect content for AI model training.

export const AI_TRAINING_BOTS = [
	"GPTBot",                 // OpenAI training - 123815556
	"ClaudeBot",              // Anthropic training - (heuristics: 33563859)
	"CCBot",                  // Common Crawl dataset - 133621792
	"Google-CloudVertexBot",  // Google AI training - 133730073
	"Meta-ExternalAgent",     // Meta AI training - 124581738
	"Amazonbot",              // Amazon AI - 118601807
	"Bytespider",             // ByteDance / TikTok - (heuristics: 33563853)
	"PetalBot",               // Huawei - 124150991
	"FacebookBot",            // Meta crawling - (heuristics: 33563972)
] as const;

// ---------------------------------------------------------------------------
// ARCHIVER BOTS
// ---------------------------------------------------------------------------
// Web archiving services that preserve content.

export const ARCHIVER_BOTS = [
	"archive.org_bot",  // Internet Archive / Wayback Machine - 131190766
] as const;

// ---------------------------------------------------------------------------
// OTHER BOTS
// ---------------------------------------------------------------------------

export const OTHER_BOTS = [
	"ChatGPT agent",      // ChatGPT agents/plugins - 129220581
	"Novellum AI Crawl",  // Novellum AI - 121781688
	"Timpibot",           // Timpi search - (heuristics: 33564051)
	"ProRataInc",         // ProRata content licensing - 117766436
	"Anchor Browser",     // Anchor AI browser - 124259203
] as const;

// ---------------------------------------------------------------------------
// PRESET COMBINATIONS
// ---------------------------------------------------------------------------
// Use these as starting points when helping users configure exceptions.

/**
 * Search Engines Only - maintains SEO visibility.
 *
 * Use this preset when:
 * - User wants to maintain Google/Bing/Apple search rankings
 * - User wants bots to pay but search engines to index freely
 *
 * Resolved detection IDs:
 * [120623194, 117479730, 120424214]
 */
export const PRESET_SEARCH_ENGINES = [...SEARCH_ENGINE_BOTS] as const;

/**
 * Search Engines + AI Assistants - allows real-time citations.
 *
 * Use this preset when:
 * - User wants SEO visibility (search engines)
 * - User wants content cited in AI assistant answers
 * - User still wants training crawlers to pay
 *
 * Resolved detection IDs:
 * [120623194, 117479730, 120424214, 132995013, 33564303, 33564371, 128950951, 126666910, 132272919]
 */
export const PRESET_SEARCH_AND_ASSISTANTS = [
	...SEARCH_ENGINE_BOTS,
	...AI_ASSISTANT_BOTS,
] as const;

/**
 * No Exceptions - all bots subject to payment.
 *
 * Use this preset when:
 * - User wants maximum monetization
 * - User doesn't care about SEO (maybe an API-only service)
 */
export const PRESET_NONE: string[] = [];
