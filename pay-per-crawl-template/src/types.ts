/**
 * Pay Per Crawl Template - Type Definitions
 *
 * Simple, user-friendly types for configuring pricing rules.
 */

/**
 * A pricing rule defines which paths to charge and at what price.
 *
 * Rules are evaluated in order - first matching rule wins.
 */
export interface PricingRule {
	/**
	 * Path pattern to match.
	 *
	 * Examples:
	 *   - Exact match: "/api/premium"
	 *   - Prefix match: "/blog/*"
	 */
	pattern: string;

	/**
	 * Price in USD (dollars).
	 *
	 * Requirements:
	 *   - Minimum: 0.01 ($0.01 = 1 cent)
	 *   - Must be whole cent increments (0.01, 0.02, ..., 0.50, 1.00, etc.)
	 *
	 * Examples:
	 *   - 0.09 = $0.09 (9 cents)
	 *   - 0.50 = $0.50 (50 cents)
	 *   - 1.00 = $1.00 (1 dollar)
	 */
	price: number;

	/**
	 * Bot score threshold - REQUIRED.
	 *
	 * Requests with bot score >= this value are allowed through (not blocked).
	 * Lower values = more lenient, higher values = more strict.
	 *
	 * Typical values:
	 *   - 30 = Lenient (allows more bot-like traffic through)
	 *   - 50 = Moderate (balanced approach)
	 *   - 70 = Strict (blocks most bot-like traffic)
	 */
	bot_score_threshold: number;

	/**
	 * Bot names to always allow through (optional).
	 *
	 * Use readable names like "Googlebot", "BingBot".
	 * These bots will NOT be blocked, even if their score is below threshold.
	 *
	 * Configure in: src/bots.config.ts
	 * Full list of supported names: see src/bots.ts
	 */
	except_bots?: string[];
}

/**
 * Worker environment bindings.
 */
export interface Env {
	/**
	 * Array of pricing rules.
	 * Rules are evaluated in order - first match wins.
	 */
	PRICING_RULES?: PricingRule[];
}

/**
 * Bot management data from Cloudflare's cf object.
 */
export interface BotManagement {
	score?: number;
	verifiedBot?: boolean;
	detectionIds?: number[];
}

/**
 * Extended Request.cf with bot management.
 */
export interface CfProperties {
	botManagement?: BotManagement;
}
