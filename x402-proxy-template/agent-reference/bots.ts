/**
 * x402-proxy Template - Bot Name Registry (Agent Reference Only)
 *
 * This file is used by AI agents during setup to resolve bot names to detection IDs.
 * It is NOT used at runtime - all detection IDs are resolved to numbers during setup
 * and stored directly in wrangler.jsonc.
 *
 * Maps readable bot names to Cloudflare detection IDs and heuristics IDs.
 * Source: AI_AUDIT_BOTS from Cloudflare Dashboard (stratus/ai-zone/constants.ts)
 */

export interface BotEntry {
	/** Human-readable name */
	name: string;
	/** Operator/company that runs the bot */
	operator: string;
	/** Bot category */
	category: string;
	/** User-Agent string (if known) */
	userAgent: string;
	/** Cloudflare detection IDs (verified bots) */
	detectionIds: number[];
	/** Cloudflare heuristics IDs (unverified/signature-based) */
	heuristicsIds: number[];
	/** Whether this is a verified bot */
	verified: boolean;
}

/**
 * Registry of known AI crawlers and bots.
 * Key is the canonical name users should use in config.
 */
export const BOT_REGISTRY: Record<string, BotEntry> = {
	// =========================================================================
	// SEARCH ENGINE CRAWLERS
	// =========================================================================
	Googlebot: {
		name: "Googlebot",
		operator: "Google",
		category: "Search Engine Crawler",
		userAgent: "Googlebot",
		detectionIds: [120623194],
		heuristicsIds: [33554459],
		verified: true,
	},
	BingBot: {
		name: "BingBot",
		operator: "Microsoft",
		category: "Search Engine Crawler",
		userAgent: "bingbot",
		detectionIds: [117479730],
		heuristicsIds: [33554461],
		verified: true,
	},
	Applebot: {
		name: "Applebot",
		operator: "Apple",
		category: "AI Search",
		userAgent: "Applebot",
		detectionIds: [120424214],
		heuristicsIds: [33563845],
		verified: true,
	},

	// =========================================================================
	// AI CRAWLERS
	// =========================================================================
	Amazonbot: {
		name: "Amazonbot",
		operator: "Amazon",
		category: "AI Crawler",
		userAgent: "Amazonbot",
		detectionIds: [118601807],
		heuristicsIds: [33563839],
		verified: true,
	},
	"Anchor Browser": {
		name: "Anchor Browser",
		operator: "Anchor",
		category: "AI Crawler",
		userAgent: "Anchor Browser",
		detectionIds: [124259203],
		heuristicsIds: [],
		verified: true,
	},
	Bytespider: {
		name: "Bytespider",
		operator: "ByteDance",
		category: "AI Crawler",
		userAgent: "Bytespider",
		detectionIds: [],
		heuristicsIds: [33563853],
		verified: false,
	},
	CCBot: {
		name: "CCBot",
		operator: "Common Crawl",
		category: "AI Crawler",
		userAgent: "CCBot",
		detectionIds: [133621792],
		heuristicsIds: [33563855],
		verified: true,
	},
	ClaudeBot: {
		name: "ClaudeBot",
		operator: "Anthropic",
		category: "AI Crawler",
		userAgent: "ClaudeBot",
		detectionIds: [],
		heuristicsIds: [33563859],
		verified: false,
	},
	"Claude-SearchBot": {
		name: "Claude-SearchBot",
		operator: "Anthropic",
		category: "AI Crawler",
		userAgent: "Claude-SearchBot",
		detectionIds: [],
		heuristicsIds: [33564301],
		verified: false,
	},
	"Claude-User": {
		name: "Claude-User",
		operator: "Anthropic",
		category: "AI Crawler",
		userAgent: "Claude-User",
		detectionIds: [],
		heuristicsIds: [33564303],
		verified: false,
	},
	FacebookBot: {
		name: "FacebookBot",
		operator: "Meta",
		category: "AI Crawler",
		userAgent: "FacebookBot",
		detectionIds: [],
		heuristicsIds: [33563972],
		verified: false,
	},
	"Google-CloudVertexBot": {
		name: "Google-CloudVertexBot",
		operator: "Google",
		category: "AI Crawler",
		userAgent: "Google-CloudVertexBot",
		detectionIds: [133730073],
		heuristicsIds: [33564321],
		verified: true,
	},
	GPTBot: {
		name: "GPTBot",
		operator: "OpenAI",
		category: "AI Crawler",
		userAgent: "GPTBot",
		detectionIds: [123815556],
		heuristicsIds: [33563875],
		verified: true,
	},
	"Meta-ExternalAgent": {
		name: "Meta-ExternalAgent",
		operator: "Meta",
		category: "AI Crawler",
		userAgent: "meta-externalagent",
		detectionIds: [124581738],
		heuristicsIds: [33563982],
		verified: true,
	},
	"Novellum AI Crawl": {
		name: "Novellum AI Crawl",
		operator: "Novellum",
		category: "AI Crawler",
		userAgent: "Novellum",
		detectionIds: [121781688],
		heuristicsIds: [],
		verified: true,
	},
	PetalBot: {
		name: "PetalBot",
		operator: "Huawei",
		category: "AI Crawler",
		userAgent: "PetalBot",
		detectionIds: [124150991],
		heuristicsIds: [33564369],
		verified: true,
	},
	Timpibot: {
		name: "Timpibot",
		operator: "Timpi",
		category: "AI Crawler",
		userAgent: "Timpibot",
		detectionIds: [],
		heuristicsIds: [33564051],
		verified: false,
	},

	// =========================================================================
	// AI ASSISTANTS
	// =========================================================================
	"ChatGPT agent": {
		name: "ChatGPT agent",
		operator: "OpenAI",
		category: "AI Assistant",
		userAgent: "",
		detectionIds: [129220581],
		heuristicsIds: [],
		verified: true,
	},
	"ChatGPT-User": {
		name: "ChatGPT-User",
		operator: "OpenAI",
		category: "AI Assistant",
		userAgent: "ChatGPT-User",
		detectionIds: [132995013],
		heuristicsIds: [33563857],
		verified: true,
	},
	DuckAssistBot: {
		name: "DuckAssistBot",
		operator: "DuckDuckGo",
		category: "AI Assistant",
		userAgent: "DuckAssistBot",
		detectionIds: [126666910],
		heuristicsIds: [33564037],
		verified: true,
	},
	"Meta-ExternalFetcher": {
		name: "Meta-ExternalFetcher",
		operator: "Meta",
		category: "AI Assistant",
		userAgent: "meta-externalfetcher",
		detectionIds: [132272919],
		heuristicsIds: [33563980],
		verified: true,
	},
	"MistralAI-User": {
		name: "MistralAI-User",
		operator: "Mistral",
		category: "AI Assistant",
		userAgent: "MistralAI-User",
		detectionIds: [128950951],
		heuristicsIds: [33564323],
		verified: true,
	},

	// =========================================================================
	// AI SEARCH
	// =========================================================================
	"OAI-SearchBot": {
		name: "OAI-SearchBot",
		operator: "OpenAI",
		category: "AI Search",
		userAgent: "OAI-SearchBot",
		detectionIds: [126255384],
		heuristicsIds: [33563986],
		verified: true,
	},
	PerplexityBot: {
		name: "PerplexityBot",
		operator: "Perplexity",
		category: "AI Search",
		userAgent: "PerplexityBot",
		detectionIds: [],
		heuristicsIds: [33563889],
		verified: false,
	},
	"Perplexity-User": {
		name: "Perplexity-User",
		operator: "Perplexity",
		category: "AI Assistant",
		userAgent: "Perplexity-User",
		detectionIds: [],
		heuristicsIds: [33564371],
		verified: false,
	},

	// =========================================================================
	// ARCHIVERS
	// =========================================================================
	"archive.org_bot": {
		name: "archive.org_bot",
		operator: "Internet Archive",
		category: "Archiver",
		userAgent: "archive.org_bot",
		detectionIds: [131190766],
		heuristicsIds: [33564033],
		verified: true,
	},

	// =========================================================================
	// OTHER
	// =========================================================================
	ProRataInc: {
		name: "ProRataInc",
		operator: "ProRata.ai",
		category: "AI Crawler",
		userAgent: "ProRataInc",
		detectionIds: [117766436],
		heuristicsIds: [],
		verified: false,
	},
};

/**
 * Get all supported bot names (for documentation and validation).
 */
export const SUPPORTED_BOT_NAMES = Object.keys(BOT_REGISTRY);

/**
 * Resolve a single bot name to its detection ID(s).
 * Falls back to heuristics IDs if no detection IDs available.
 *
 * @param botName - Bot name to resolve
 * @returns Array of detection/heuristics IDs, or empty array if not found
 */
export function resolveBotToIds(botName: string): number[] {
	const bot = BOT_REGISTRY[botName];
	if (!bot) {
		return [];
	}

	// Prefer detection IDs, fall back to heuristics
	if (bot.detectionIds.length > 0) {
		return bot.detectionIds;
	}
	return bot.heuristicsIds;
}

/**
 * Resolve multiple bot names to detection IDs.
 * Returns a flat array of all IDs.
 *
 * @param botNames - Array of bot names to resolve
 * @returns Array of detection/heuristics IDs
 */
export function resolveBotsToIds(botNames: string[]): number[] {
	const ids: number[] = [];

	for (const name of botNames) {
		const botIds = resolveBotToIds(name);
		if (botIds.length === 0) {
			console.warn(`[x402-proxy] Unknown bot name: "${name}". Skipping.`);
		} else {
			ids.push(...botIds);
		}
	}

	return ids;
}

/**
 * Check if a bot name is recognized.
 */
export function isBotNameSupported(name: string): boolean {
	return name in BOT_REGISTRY;
}

/**
 * Get all bots grouped by category.
 */
export function getBotsByCategory(): Record<string, BotEntry[]> {
	const categories: Record<string, BotEntry[]> = {};

	for (const bot of Object.values(BOT_REGISTRY)) {
		if (!categories[bot.category]) {
			categories[bot.category] = [];
		}
		categories[bot.category].push(bot);
	}

	return categories;
}
