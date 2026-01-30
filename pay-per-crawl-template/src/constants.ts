/**
 * Pay Per Crawl - Constants
 *
 * Centralized constants for the x402 protocol, documentation URLs, and warning messages.
 */

// =============================================================================
// x402 Protocol Constants (v2.0.0)
// =============================================================================

export const X402_VERSION = "2.0.0";
export const NETWORK = "cloudflare:com";
export const SCHEME = "deferred";
export const ASSET = "USD";

// =============================================================================
// Documentation
// =============================================================================

export const DOCS_URL =
	"https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/what-is-pay-per-crawl/";

// =============================================================================
// Error Messages
// =============================================================================

export const PAYMENT_REQUIRED_ERROR =
	`Payment is required to access content. Please refer to the Cloudflare Pay Per Crawl documentation for more information. ${DOCS_URL}`;

// =============================================================================
// Warning Messages (for console.warn)
// =============================================================================

export const WARN_NO_BOT_MANAGEMENT =
	"[pay-per-crawl] Bot Management data not available. " +
	"Ensure Enterprise Bot Management is enabled on this zone. " +
	"Passing through to origin without pricing evaluation.";

export const WARN_NO_IN_BAND_PRICING =
	"[pay-per-crawl] In-band pricing header not present (cf-pay-per-crawl: pricing=in-band). " +
	"Crawler may not be aware of pricing requirements.";
