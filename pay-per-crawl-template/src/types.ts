/**
 * Pay Per Crawl Template - Type Definitions
 *
 * This file contains two sets of types:
 * 1. Simplified types for wrangler.jsonc (user-facing, easy to write)
 * 2. Stratus-compatible types for config.json (dashboard-compatible)
 *
 * The build script transforms simplified → stratus format.
 */

// =============================================================================
// SIMPLIFIED TYPES (wrangler.jsonc input)
// =============================================================================

/**
 * A simplified pricing rule for wrangler.jsonc.
 * This is what users/agents write - it gets transformed to stratus format.
 *
 * Rules are evaluated in order - first matching rule wins.
 */
export interface SimplifiedPricingRule {
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
	 *   - 1 = Known bots only (score = 1)
	 *   - 2 = Certainly automated (score <= 2)
	 *   - 30 = Likely automated (recommended starting point)
	 */
	bot_score_threshold: number;

	/**
	 * Bot names to always allow through (optional).
	 *
	 * Use readable names like "Googlebot", "BingBot".
	 * These bots will NOT be blocked, even if their score is below threshold.
	 * Names are resolved to detection IDs at build time.
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

	/**
	 * Whether the rule is enabled (optional, defaults to true).
	 */
	enabled?: boolean;
}

/**
 * Simplified env for wrangler.jsonc vars.
 */
export interface SimplifiedEnv {
	PRICING_RULES?: SimplifiedPricingRule[];
}

// =============================================================================
// STRATUS-COMPATIBLE TYPES (config.json output)
// =============================================================================

/**
 * Rule condition - matches stratus PayPerCrawlRuleCondition.
 */
export interface RuleCondition {
	field: string;
	operator: string;
	value: string | number;
}

/**
 * Rule action - matches stratus PayPerCrawlRuleAction.
 */
export interface RuleAction {
	type: 'charge' | 'block' | 'allow';
	chargeAmount?: number;
}

/**
 * Rule exception - matches stratus PayPerCrawlRuleException.
 */
export interface RuleException {
	type: 'bots' | 'botScore';
	bots?: number[];
	/** Informational only - human readable names for the bot IDs */
	_botNames?: string[];
	botScoreOperator?: string;
	botScoreValue?: number;
}

/**
 * A pricing rule - matches stratus PayPerCrawlRule.
 */
export interface PayPerCrawlRule {
	id: string;
	condition: RuleCondition;
	action: RuleAction;
	exceptions?: RuleException[];
	enabled: boolean;
}

/**
 * The full config structure - matches stratus PayPerCrawlConfig.
 *
 * For template-deployed workers, includes templateSource/templateVersion
 * so the dashboard can identify and validate accordingly.
 */
export interface PayPerCrawlConfig {
	config: {
		rules: PayPerCrawlRule[];
	};
	/**
	 * SHA-256 hash of the worker LOGIC (source code).
	 * This verifies the proxy/block/price behavior hasn't been tampered with.
	 *
	 * For dashboard-deployed workers: hash of PAY_PER_CRAWL_WORKER_TEMPLATE
	 * For template-deployed workers: hash of src/index.ts
	 *
	 * Note: This does NOT hash the config/rules - those are user-configurable.
	 */
	hash?: string;
	/**
	 * SHA-256 hash of the WAF expression (dashboard-deployed only).
	 */
	wafExpressionHash?: string;
	/**
	 * Template identifier (template-deployed only).
	 * Example: "pay-per-crawl-template"
	 */
	templateSource?: string;
	/**
	 * Template version (template-deployed only).
	 * Follows semver. Example: "1.0.0"
	 */
	templateVersion?: string;
}

// =============================================================================
// RUNTIME TYPES
// =============================================================================

/**
 * Bot management data from Cloudflare's cf object.
 *
 * Note: detectionIds can come in two formats from Cloudflare:
 *   - Array: [123456, 789012]
 *   - Object: {123456: true, 789012: true}
 * The worker code handles both.
 */
export interface BotManagement {
	score?: number;
	verifiedBot?: boolean;
	detectionIds?: number[] | Record<number, boolean>;
}

/**
 * Extended Request.cf with bot management.
 */
export interface CfProperties {
	botManagement?: BotManagement;
}

/**
 * Worker environment bindings (runtime).
 * At runtime, the worker reads from config.json, not env vars.
 */
export interface Env {
	// Reserved for future bindings (KV, D1, etc.)
}
