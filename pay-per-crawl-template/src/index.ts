/**
 * Pay Per Crawl Worker
 *
 * Blocks AI crawlers with HTTP 402 Payment Required unless they pay.
 * Uses x402 v2.0.0 protocol format.
 *
 * PREREQUISITES:
 *   1. Enterprise Bot Management enabled on your zone
 *   2. Pay Per Crawl Beta enabled for your account
 *
 * @see AGENTS.md for setup instructions
 * @see https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/
 */

import { validateRules, evaluateRules, pathMatches } from "./rules";
import { createPaymentRequiredResponse, formatCrawlerPrice } from "./x402";
import { WARN_NO_BOT_MANAGEMENT, WARN_NO_IN_BAND_PRICING } from "./constants";
import type { Env, CfProperties } from "./types";

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const rules = env.PRICING_RULES || [];

		// Validate rules (logs warnings for any issues)
		validateRules(rules);

		// Get bot management data from cf object
		const cf = request.cf as CfProperties | undefined;
		const botManagement = cf?.botManagement;

		// =====================================================================
		// SHORT-CIRCUIT: No Bot Management → pass through to origin
		// =====================================================================
		if (!botManagement) {
			console.warn(WARN_NO_BOT_MANAGEMENT);
			return fetch(request);
		}

		// Extract bot data
		const botScore = botManagement.score ?? 99;
		const isVerifiedBot = botManagement.verifiedBot ?? false;
		const detectionIds = (botManagement.detectionIds ?? []).map(String);

		// Check for in-band pricing header
		const cfPayPerCrawl = request.headers.get("cf-pay-per-crawl") || "";
		const inBandPricingEnabled = cfPayPerCrawl.includes("pricing=in-band");

		if (!inBandPricingEnabled) {
			console.warn(WARN_NO_IN_BAND_PRICING);
			// Continue with pricing logic (don't short-circuit)
		}

		// =====================================================================
		// Evaluate pricing rules
		// =====================================================================
		const matchedRule = evaluateRules(path, botScore, isVerifiedBot, detectionIds, rules);

		if (matchedRule) {
			// Rule matched, no exception → return 402
			return createPaymentRequiredResponse(path, matchedRule.price);
		}

		// =====================================================================
		// No rule matched or exception applied → proxy to origin
		// =====================================================================
		const response = await fetch(request);

		// Add Crawler-Price header if in-band pricing is enabled
		if (inBandPricingEnabled) {
			const newResponse = new Response(response.body, response);

			// Find applicable price for this path
			let priceSet = false;
			for (const rule of rules) {
				if (pathMatches(path, rule.pattern)) {
					newResponse.headers.set("Crawler-Price", formatCrawlerPrice(rule.price));
					priceSet = true;
					break;
				}
			}

			// No matching rule → price is $0.00
			if (!priceSet) {
				newResponse.headers.set("Crawler-Price", "USD 0.00");
			}

			return newResponse;
		}

		return response;
	},
};
