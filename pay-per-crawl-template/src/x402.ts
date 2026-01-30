/**
 * Pay Per Crawl - x402 Response Builder
 *
 * Creates HTTP 402 Payment Required responses in x402 v2.0.0 format.
 * No external library dependencies - just the response shape.
 */

import {
	X402_VERSION,
	NETWORK,
	SCHEME,
	ASSET,
	PAYMENT_REQUIRED_ERROR,
} from "./constants";

// =============================================================================
// Types (x402 v2.0.0 response shape)
// =============================================================================

interface PaymentRequirement {
	scheme: typeof SCHEME;
	network: typeof NETWORK;
	resource: string;
	amount: string;
	asset: typeof ASSET;
}

interface X402Response {
	x402Version: typeof X402_VERSION;
	accepts: PaymentRequirement[];
	error: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format price as amount string (e.g., 0.5 → "0.50")
 */
function formatAmount(priceUsd: number): string {
	return priceUsd.toFixed(2);
}

/**
 * Format price for Crawler-Price header (e.g., 0.5 → "USD 0.50")
 */
export function formatCrawlerPrice(priceUsd: number): string {
	return `USD ${formatAmount(priceUsd)}`;
}

// =============================================================================
// Response Builder
// =============================================================================

/**
 * Create a 402 Payment Required response in x402 v2.0.0 format.
 *
 * Response body:
 * {
 *   "x402Version": "2.0.0",
 *   "accepts": [{
 *     "scheme": "deferred",
 *     "network": "cloudflare:com",
 *     "resource": "/path/from/request",
 *     "amount": "0.50",
 *     "asset": "USD"
 *   }],
 *   "error": "Payment is required..."
 * }
 *
 * Headers:
 * - Content-Type: application/json
 * - Crawler-Price: USD 0.50
 */
export function createPaymentRequiredResponse(
	resourcePath: string,
	priceUsd: number
): Response {
	const body: X402Response = {
		x402Version: X402_VERSION,
		accepts: [
			{
				scheme: SCHEME,
				network: NETWORK,
				resource: resourcePath,
				amount: formatAmount(priceUsd),
				asset: ASSET,
			},
		],
		error: PAYMENT_REQUIRED_ERROR,
	};

	return new Response(JSON.stringify(body), {
		status: 402,
		headers: {
			"Content-Type": "application/json",
			"Crawler-Price": formatCrawlerPrice(priceUsd),
		},
	});
}
