/**
 * Pay Per Crawl - Rule Evaluation
 *
 * Path matching, validation, and pricing rule evaluation logic.
 */

import { resolveBotsToIds, isBotNameSupported, SUPPORTED_BOT_NAMES } from "./bots";
import type { PricingRule } from "./types";

// =============================================================================
// Path Matching
// =============================================================================

/**
 * Check if a path matches a pattern.
 * Supports exact matches and prefix matches with /* wildcard.
 *
 * Examples:
 *   pathMatches("/blog/post", "/blog/*") → true
 *   pathMatches("/blog/post", "/blog/post") → true
 *   pathMatches("/other", "/blog/*") → false
 */
export function pathMatches(path: string, pattern: string): boolean {
	if (pattern.endsWith("/*")) {
		return path.startsWith(pattern.slice(0, -2));
	}
	return path === pattern;
}

// =============================================================================
// Price Validation
// =============================================================================

/**
 * Check if a price is valid (minimum $0.01, whole cent increments).
 */
function isValidPrice(price: number): boolean {
	if (price < 0.01) return false;
	// Check for whole cent increments: multiply by 100 and verify it's an integer
	const cents = Math.round(price * 100);
	return Math.abs(price * 100 - cents) < 0.0001;
}

// =============================================================================
// Rule Validation
// =============================================================================

/**
 * Validate a single pricing rule.
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
				return `Rule ${index + 1}: Unknown bot name "${botName}". Supported: ${SUPPORTED_BOT_NAMES.slice(0, 5).join(", ")}... (see bots.ts)`;
			}
		}
	}

	return null;
}

/**
 * Validate all pricing rules on startup.
 * Logs errors for any invalid rules.
 */
export function validateRules(rules: PricingRule[]): void {
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

// =============================================================================
// Rule Evaluation
// =============================================================================

/**
 * Evaluate pricing rules against a request.
 * Returns the matching rule if request should be blocked, null if allowed.
 *
 * A request is ALLOWED (returns null) if:
 * - Path doesn't match any rule pattern
 * - Request is from a verified bot
 * - Bot score is >= the rule's threshold
 * - Bot is in the rule's except_bots list
 *
 * A request is BLOCKED (returns rule) if:
 * - Path matches a rule pattern AND
 * - Not a verified bot AND
 * - Bot score < threshold AND
 * - Bot not in except_bots
 */
export function evaluateRules(
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

		// Verified bots always pass (matches WAF behavior)
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
