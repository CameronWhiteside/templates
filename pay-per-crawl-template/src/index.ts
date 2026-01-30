/**
 * Pay Per Crawl Worker Template
 *
 * Implements path-based pricing for AI crawlers using Cloudflare Bot Management.
 * This template consolidates what previously required Worker + WAF rule into a single Worker.
 *
 * PREREQUISITES:
 * - Enterprise Bot Management enabled on your zone
 * - Pay Per Crawl Beta enabled for your account
 *
 * WITHOUT THESE: The worker will NOT block any crawlers and may have unexpected results.
 *
 * @see AGENTS.md for setup instructions
 */

import { resolveBotsToIds, isBotNameSupported, SUPPORTED_BOT_NAMES } from "./bots";
import type { Env, PricingRule, CfProperties } from "./types";

/**
 * Default bypass paths - always pass through without evaluation.
 */
const DEFAULT_BYPASS_PATHS = [
	"/robots.txt",
	"/crawlers.json",
	"/security.txt",
	"/.well-known/security.txt",
	"/ads.txt",
];

/**
 * Check if a path matches a pattern.
 * Supports exact matches and prefix matches with /* wildcard.
 */
function pathMatches(path: string, pattern: string): boolean {
	if (pattern.endsWith("/*")) {
		return path.startsWith(pattern.slice(0, -2));
	}
	return path === pattern;
}

/**
 * Check if a path should bypass pricing evaluation.
 */
function shouldBypass(path: string, bypassPaths: string[]): boolean {
	return bypassPaths.some((bp) => pathMatches(path, bp));
}

/**
 * Check if a price is valid (minimum $0.01, whole cent increments).
 */
function isValidPrice(price: number): boolean {
	if (price < 0.01) return false;
	// Check for whole cent increments: multiply by 100 and verify it's an integer
	const cents = Math.round(price * 100);
	return Math.abs(price * 100 - cents) < 0.0001;
}

/**
 * Convert USD price to cents (for internal use).
 */
function priceToCents(price: number): number {
	return Math.round(price * 100);
}

/**
 * Validate a pricing rule.
 * Returns error message if invalid, null if valid.
 */
function validateRule(rule: PricingRule, index: number): string | null {
	// Pattern is required
	if (!rule.pattern || typeof rule.pattern !== "string") {
		return `Rule ${index + 1}: 'pattern' is required and must be a string`;
	}

	// Price must be >= $0.01 and in whole cent increments
	if (typeof rule.price !== "number") {
		return `Rule ${index + 1}: 'price' is required (e.g., 0.50 for $0.50)`;
	}
	if (rule.price < 0.01) {
		return `Rule ${index + 1}: 'price' must be >= 0.01 (minimum $0.01)`;
	}
	if (!isValidPrice(rule.price)) {
		return `Rule ${index + 1}: 'price' must be in whole cent increments (e.g., 0.01, 0.09, 0.50, 1.00)`;
	}

	// Bot score threshold is REQUIRED
	if (typeof rule.bot_score_threshold !== "number") {
		return `Rule ${index + 1}: 'bot_score_threshold' is required (e.g., 30)`;
	}
	if (rule.bot_score_threshold < 0 || rule.bot_score_threshold > 100) {
		return `Rule ${index + 1}: 'bot_score_threshold' must be between 0 and 100`;
	}

	// Validate bot names if provided
	if (rule.except_bots && Array.isArray(rule.except_bots)) {
		for (const botName of rule.except_bots) {
			if (!isBotNameSupported(botName)) {
				return `Rule ${index + 1}: Unknown bot name "${botName}". Supported names: ${SUPPORTED_BOT_NAMES.slice(0, 5).join(", ")}... (see bots.ts for full list)`;
			}
		}
	}

	return null;
}

/**
 * Validate all pricing rules on startup.
 * Logs warnings for any issues.
 */
function validateRules(rules: PricingRule[]): void {
	if (!rules || rules.length === 0) {
		console.warn("[pay-per-crawl] No PRICING_RULES configured. All traffic will pass through.");
		return;
	}

	for (let i = 0; i < rules.length; i++) {
		const error = validateRule(rules[i], i);
		if (error) {
			console.error(`[pay-per-crawl] Configuration error: ${error}`);
		}
	}
}

/**
 * Check if a request should be blocked based on pricing rules.
 * Returns the matching rule if blocked, null if allowed.
 */
function evaluateRules(
	path: string,
	botScore: number,
	isVerifiedBot: boolean,
	detectionIds: string[],
	rules: PricingRule[]
): PricingRule | null {
	for (const rule of rules) {
		// Skip if path doesn't match
		if (!pathMatches(path, rule.pattern)) {
			continue;
		}

		// Verified bots always pass (this matches WAF behavior)
		if (isVerifiedBot) {
			continue;
		}

		// Bot score exception: allow if score >= threshold
		if (botScore >= rule.bot_score_threshold) {
			continue;
		}

		// Specific bot exceptions
		if (rule.except_bots && rule.except_bots.length > 0) {
			const exceptIds = resolveBotsToIds(rule.except_bots);
			const hasException = exceptIds.some((id) => detectionIds.includes(String(id)));
			if (hasException) {
				continue;
			}
		}

		// No exception matched - this request should be blocked
		return rule;
	}

	// No rule matched or all exceptions passed
	return null;
}

/**
 * Format price (in USD) to standard string format.
 */
function formatPriceUsd(price: number): string {
	return `USD ${price.toFixed(2)}`;
}

/**
 * Main Worker handler.
 */
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// Validate rules on first request (logs warnings)
		const rules = env.PRICING_RULES || [];
		validateRules(rules);

		// Always bypass certain paths
		const bypassPaths = env.BYPASS_PATHS || DEFAULT_BYPASS_PATHS;
		if (shouldBypass(path, bypassPaths)) {
			return fetch(request);
		}

		// Get bot management data from cf object
		const cf = request.cf as CfProperties | undefined;
		const botManagement = cf?.botManagement;

		// Extract bot data (with safe defaults)
		const botScore = botManagement?.score ?? 99;
		const isVerifiedBot = botManagement?.verifiedBot ?? false;
		const detectionIds = (botManagement?.detectionIds ?? []).map(String);

		// Log warning if bot management data is missing (indicates BotM not enabled)
		if (!botManagement) {
			console.warn(
				"[pay-per-crawl] Bot Management data not available. " +
					"Ensure Enterprise Bot Management is enabled on this zone. " +
					"All traffic will pass through without blocking."
			);
		}

		// =========================================================================
		// EMBEDDED WAF LOGIC - Evaluate pricing rules BEFORE fetching from origin
		// =========================================================================
		const matchedRule = evaluateRules(path, botScore, isVerifiedBot, detectionIds, rules);

	if (matchedRule) {
		// Rule matched and no exception applied - return 402
		const priceUsd = formatPriceUsd(matchedRule.price);

		return new Response(
				JSON.stringify({
					error: "Payment Required",
					message: "This content requires payment for bot access.",
					price: priceUsd,
					path: path,
				}),
				{
					status: 402,
					headers: {
						"Content-Type": "application/json",
						"Crawler-Price": priceUsd,
						"X-Pay-Per-Crawl": "blocked",
					},
				}
			);
		}

		// =========================================================================
		// No rule matched or exception applied - Proxy to origin
		// =========================================================================
		const response = await fetch(request, { cf: { cacheEverything: true } });

		// Check for in-band pricing request
		const cfPayPerCrawl = request.headers.get("cf-pay-per-crawl") || "";
		const wantsInBandPricing = cfPayPerCrawl.includes("pricing=in-band");

	if (wantsInBandPricing) {
		// Find applicable price for this path (for informational header)
		let contentPrice: number | null = null;

		for (const rule of rules) {
			if (pathMatches(path, rule.pattern)) {
				contentPrice = rule.price;
				break;
			}
		}

		// Clone response and add Crawler-Price header
		const newResponse = new Response(response.body, response);

		if (contentPrice !== null) {
			newResponse.headers.set("Crawler-Price", formatPriceUsd(contentPrice));
		} else {
			newResponse.headers.set("Crawler-Price", "USD 0.00");
		}

		return newResponse;
	}

		return response;
	},
};
