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
	 * - Exact match: "/api/premium"
	 * - Prefix match: "/blog/*"
	 */
	pattern: string;

	/**
	 * Price in cents (minimum 1, whole numbers only).
	 * Examples: 9 = $0.09, 100 = $1.00
	 */
	price_cents: number;

	/**
	 * Bot score threshold - REQUIRED.
	 * Requests with bot score >= this value are allowed through.
	 * Typical values: 30 (lenient) to 50 (strict).
	 */
	bot_score_threshold: number;

	/**
	 * Bot names to always allow (optional).
	 * Use readable names like "Googlebot", "BingBot".
	 * See AGENTS.md for full list of supported names.
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

	/**
	 * Paths that always pass through (never blocked).
	 * Default: ["/robots.txt", "/crawlers.json", "/security.txt", "/.well-known/security.txt"]
	 */
	BYPASS_PATHS?: string[];
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
