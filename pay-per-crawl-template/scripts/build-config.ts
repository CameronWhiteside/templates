#!/usr/bin/env npx tsx
/**
 * Pay Per Crawl - Config Build Script
 *
 * Transforms simplified wrangler.jsonc config into stratus-compatible config.json.
 *
 * Input:  wrangler.jsonc vars.PRICING_RULES (SimplifiedPricingRule[])
 * Output: src/config.json (PayPerCrawlConfig)
 *
 * Usage: npm run build:config
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Import bot registry for name → ID resolution
import { BOT_REGISTRY, SUPPORTED_BOT_NAMES } from "../src/bots";
import type {
	SimplifiedPricingRule,
	PayPerCrawlConfig,
	PayPerCrawlRule,
	RuleCondition,
	RuleAction,
	RuleException,
} from "../src/types";

// =============================================================================
// Configuration
// =============================================================================

const WRANGLER_CONFIG_PATH = path.join(__dirname, "..", "wrangler.jsonc");
const OUTPUT_CONFIG_PATH = path.join(__dirname, "..", "src", "config.json");
const WORKER_ENTRY_PATH = path.join(__dirname, "..", "src", "index.ts");

// Template metadata - increment version when making breaking changes
const TEMPLATE_SOURCE = "pay-per-crawl-template";
const TEMPLATE_VERSION = "1.0.0";

// =============================================================================
// JSONC Parser (simple - handles // and /* */ comments)
// =============================================================================

function stripJsonComments(jsonc: string): string {
	let result = "";
	let inString = false;
	let inLineComment = false;
	let inBlockComment = false;

	for (let i = 0; i < jsonc.length; i++) {
		const char = jsonc[i];
		const nextChar = jsonc[i + 1];

		if (inLineComment) {
			if (char === "\n") {
				inLineComment = false;
				result += char;
			}
			continue;
		}

		if (inBlockComment) {
			if (char === "*" && nextChar === "/") {
				inBlockComment = false;
				i++; // Skip the /
			}
			continue;
		}

		if (inString) {
			result += char;
			if (char === '"' && jsonc[i - 1] !== "\\") {
				inString = false;
			}
			continue;
		}

		if (char === '"') {
			inString = true;
			result += char;
			continue;
		}

		if (char === "/" && nextChar === "/") {
			inLineComment = true;
			i++; // Skip the second /
			continue;
		}

		if (char === "/" && nextChar === "*") {
			inBlockComment = true;
			i++; // Skip the *
			continue;
		}

		result += char;
	}

	return result;
}

function parseJsonc<T>(jsonc: string): T {
	const stripped = stripJsonComments(jsonc);
	return JSON.parse(stripped);
}

// =============================================================================
// Validation
// =============================================================================

interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

function isValidPrice(price: number): boolean {
	if (price < 0.01) return false;
	const cents = Math.round(price * 100);
	return Math.abs(price * 100 - cents) < 0.0001;
}

function validateRule(
	rule: SimplifiedPricingRule,
	index: number,
	seenPatterns: Set<string>
): { errors: string[]; warnings: string[] } {
	const errors: string[] = [];
	const warnings: string[] = [];
	const ruleLabel = `Rule ${index + 1}`;

	// Pattern is required
	if (!rule.pattern || typeof rule.pattern !== "string") {
		errors.push(`${ruleLabel}: 'pattern' is required and must be a string`);
	} else {
		// Check for duplicate patterns (warn only)
		if (seenPatterns.has(rule.pattern)) {
			warnings.push(
				`${ruleLabel}: Duplicate pattern "${rule.pattern}" - first match will win`
			);
		}
		seenPatterns.add(rule.pattern);
	}

	// Price validation
	if (typeof rule.price !== "number") {
		errors.push(`${ruleLabel}: 'price' is required (e.g., 0.50 for $0.50)`);
	} else if (rule.price < 0.01) {
		errors.push(
			`${ruleLabel}: 'price' must be >= 0.01 (Pay Per Crawl system minimum)`
		);
	} else if (!isValidPrice(rule.price)) {
		errors.push(
			`${ruleLabel}: 'price' must be in whole cent increments (e.g., 0.50, not 0.505)`
		);
	}

	// Bot score threshold is required
	if (typeof rule.bot_score_threshold !== "number") {
		errors.push(`${ruleLabel}: 'bot_score_threshold' is required (e.g., 30)`);
	} else if (rule.bot_score_threshold < 0 || rule.bot_score_threshold > 100) {
		errors.push(`${ruleLabel}: 'bot_score_threshold' must be between 0 and 100`);
	}

	// Validate bot names (warn on unknown, don't fail)
	if (rule.except_bots && Array.isArray(rule.except_bots)) {
		for (const botName of rule.except_bots) {
			if (!BOT_REGISTRY[botName]) {
				warnings.push(
					`${ruleLabel}: Unknown bot name "${botName}" - skipping (not in registry)`
				);
			}
		}
	}

	// Validate detection IDs
	if (rule.except_detection_ids && Array.isArray(rule.except_detection_ids)) {
		for (const id of rule.except_detection_ids) {
			if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
				errors.push(
					`${ruleLabel}: Invalid detection ID "${id}" - must be a positive integer`
				);
			}
		}
	}

	return { errors, warnings };
}

function validateRules(rules: SimplifiedPricingRule[]): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const seenPatterns = new Set<string>();

	if (!rules || rules.length === 0) {
		errors.push("No PRICING_RULES configured in wrangler.jsonc");
		return { valid: false, errors, warnings };
	}

	for (let i = 0; i < rules.length; i++) {
		const result = validateRule(rules[i], i, seenPatterns);
		errors.push(...result.errors);
		warnings.push(...result.warnings);
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

// =============================================================================
// Transformation
// =============================================================================

/**
 * Generate a deterministic ID from the pattern.
 */
function generateRuleId(pattern: string, index: number): string {
	const hash = crypto.createHash("sha256").update(pattern).digest("hex");
	return hash.substring(0, 8) + "-" + index.toString().padStart(4, "0");
}

/**
 * Transform pattern to condition object.
 *
 * "/blog/*" → { field: "requestPath", operator: "starts_with", value: "/blog" }
 * "/exact"  → { field: "requestPath", operator: "eq", value: "/exact" }
 */
function patternToCondition(pattern: string): RuleCondition {
	if (pattern.endsWith("/*")) {
		return {
			field: "requestPath",
			operator: "starts_with",
			value: pattern.slice(0, -2), // Remove /*
		};
	}

	return {
		field: "requestPath",
		operator: "eq",
		value: pattern,
	};
}

/**
 * Resolve bot names to IDs and build exceptions array.
 */
function buildExceptions(rule: SimplifiedPricingRule): RuleException[] {
	const exceptions: RuleException[] = [];

	// Bot score exception
	exceptions.push({
		type: "botScore",
		botScoreOperator: "ge",
		botScoreValue: rule.bot_score_threshold,
	});

	// Bot ID exceptions (from names + raw IDs)
	const botIds: number[] = [];
	const botNames: string[] = [];

	// Resolve bot names to IDs
	if (rule.except_bots && rule.except_bots.length > 0) {
		for (const name of rule.except_bots) {
			const bot = BOT_REGISTRY[name];
			if (bot) {
				botNames.push(name);
				// Prefer detection IDs, fall back to heuristics
				if (bot.detectionIds.length > 0) {
					botIds.push(...bot.detectionIds);
				} else if (bot.heuristicsIds.length > 0) {
					botIds.push(...bot.heuristicsIds);
				}
			}
			// Unknown names already warned during validation
		}
	}

	// Add raw detection IDs
	if (rule.except_detection_ids && rule.except_detection_ids.length > 0) {
		for (const id of rule.except_detection_ids) {
			if (typeof id === "number" && Number.isInteger(id) && id > 0) {
				if (!botIds.includes(id)) {
					botIds.push(id);
				}
			}
		}
	}

	// Only add bot exception if there are IDs
	if (botIds.length > 0) {
		const botException: RuleException = {
			type: "bots",
			bots: botIds,
		};
		// Add informational _botNames field
		if (botNames.length > 0) {
			botException._botNames = botNames;
		}
		exceptions.push(botException);
	}

	return exceptions;
}

/**
 * Transform a simplified rule to stratus format.
 */
function transformRule(
	rule: SimplifiedPricingRule,
	index: number
): PayPerCrawlRule {
	const action: RuleAction = {
		type: "charge",
		chargeAmount: rule.price,
	};

	return {
		id: generateRuleId(rule.pattern, index),
		condition: patternToCondition(rule.pattern),
		action,
		exceptions: buildExceptions(rule),
		enabled: rule.enabled !== false, // Default to true
	};
}

/**
 * Compute SHA-256 hash of content.
 */
function computeHash(content: string): string {
	return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

/**
 * Transform all rules to stratus-compatible config with integrity metadata.
 */
function transformConfig(
	rules: SimplifiedPricingRule[],
	workerSourceHash: string
): PayPerCrawlConfig {
	const transformedRules = rules.map((rule, index) => transformRule(rule, index));

	return {
		config: {
			rules: transformedRules,
		},
		// Template metadata - identifies this as a template-deployed worker
		templateSource: TEMPLATE_SOURCE,
		templateVersion: TEMPLATE_VERSION,
		// Hash of the worker LOGIC (src/index.ts) for integrity verification
		// This verifies the proxy/block/price behavior hasn't been tampered with
		// Dashboard maintains a list of known good hashes per template version
		hash: workerSourceHash,
	};
}

// =============================================================================
// Main
// =============================================================================

function main(): void {
	console.log("[build-config] Reading wrangler.jsonc...");

	// Read wrangler.jsonc
	if (!fs.existsSync(WRANGLER_CONFIG_PATH)) {
		console.error(`[build-config] ERROR: ${WRANGLER_CONFIG_PATH} not found`);
		process.exit(1);
	}

	const wranglerContent = fs.readFileSync(WRANGLER_CONFIG_PATH, "utf-8");

	let wranglerConfig: { vars?: { PRICING_RULES?: SimplifiedPricingRule[] } };
	try {
		wranglerConfig = parseJsonc(wranglerContent);
	} catch (e) {
		console.error(`[build-config] ERROR: Failed to parse wrangler.jsonc: ${e}`);
		process.exit(1);
	}

	const rules = wranglerConfig.vars?.PRICING_RULES;

	// Validate
	console.log("[build-config] Validating rules...");
	const validation = validateRules(rules || []);

	// Print warnings
	for (const warning of validation.warnings) {
		console.warn(`[build-config] WARNING: ${warning}`);
	}

	// Print errors and exit if invalid
	if (!validation.valid) {
		for (const error of validation.errors) {
			console.error(`[build-config] ERROR: ${error}`);
		}
		console.error("[build-config] Config validation failed. Aborting.");
		process.exit(1);
	}

	// Read worker source for hash computation
	console.log("[build-config] Computing worker source hash...");
	if (!fs.existsSync(WORKER_ENTRY_PATH)) {
		console.error(`[build-config] ERROR: ${WORKER_ENTRY_PATH} not found`);
		process.exit(1);
	}
	const workerSource = fs.readFileSync(WORKER_ENTRY_PATH, "utf-8");
	const workerSourceHash = computeHash(workerSource);

	// Transform
	console.log(`[build-config] Transforming ${rules!.length} rules...`);
	const config = transformConfig(rules!, workerSourceHash);

	// Write output
	const outputContent = JSON.stringify(config, null, "\t");
	fs.writeFileSync(OUTPUT_CONFIG_PATH, outputContent, "utf-8");

	console.log(`[build-config] Template: ${TEMPLATE_SOURCE} v${TEMPLATE_VERSION}`);
	console.log(`[build-config] Worker hash: ${workerSourceHash.substring(0, 16)}...`);
	console.log(`[build-config] Wrote ${OUTPUT_CONFIG_PATH}`);
	console.log("[build-config] Done!");
}

main();
