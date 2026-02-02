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
	 * SYSTEM REQUIREMENTS (enforced by Pay Per Crawl):
	 *   - Minimum: $0.01 (1 cent) - lower prices will not be enforced
	 *   - Must be whole cent increments - fractional cents may cause
	 *     unexpected blocking or free access
	 *
	 * These are NOT template preferences - they are hard constraints from
	 * Cloudflare's Pay Per Crawl system. Prices outside these bounds may
	 * silently fail to block crawlers or block when they shouldn't.
	 *
	 * Examples:
	 *   - 0.01 = $0.01 (minimum valid price)
	 *   - 0.50 = $0.50 (50 cents)
	 *   - 1.00 = $1.00 (1 dollar)
	 *   - 0.005 = INVALID (not whole cents)
	 *   - 0.00 = INVALID (below minimum)
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

	/**
	 * Raw detection IDs to always allow through (optional).
	 *
	 * Use this when you have specific bot detection IDs that aren't in the
	 * standard bot registry. You can find detection IDs in the Cloudflare
	 * dashboard: AI Crawl Control → Crawlers → Actions column (three dot menu).
	 *
	 * This is useful for:
	 *   - Custom or internal bots you want to allow
	 *   - New crawlers not yet in the bot registry
	 *   - Specific crawler variants with unique detection IDs
	 *
	 * Example:
	 *   except_detection_ids: [123456789, 987654321]
	 */
	except_detection_ids?: number[];
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
