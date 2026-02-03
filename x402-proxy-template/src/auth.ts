/**
 * Authentication middleware for cookie-based JWT verification
 */

import { Context, Next, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { verifyJWT } from "./jwt";
import { paymentMiddleware } from "x402-hono";
import type { AppContext } from "./env";

/**
 * Creates a combined middleware that checks for valid cookie authentication
 * and conditionally applies payment middleware only if cookie auth fails
 *
 * @param paymentMiddleware - The payment middleware to apply when no valid cookie exists
 * @returns Combined authentication and payment middleware
 */
export function requirePaymentOrCookie(paymentMw: MiddlewareHandler) {
	return async (c: Context<AppContext>, next: Next) => {
		// Check for valid cookie
		const token = getCookie(c, "auth_token");

		if (token) {
			const jwtSecret = c.env.JWT_SECRET;

			// Ensure JWT_SECRET is configured
			if (!jwtSecret) {
				return c.json(
					{
						error:
							"Server misconfigured: JWT_SECRET not set. See README for setup instructions.",
					},
					500
				);
			}

			const payload = await verifyJWT(token, jwtSecret);

			// If token is valid, skip payment and go directly to handler
			if (payload) {
				c.set("auth", payload);
				await next(); // Call the handler
				return;
			}
		}

		// No valid cookie - apply payment middleware
		return await paymentMw(c, next);
	};
}

/**
 * Configuration for a protected route that requires payment
 */
export interface ProtectedRouteConfig {
	/** Route pattern to protect (e.g., "/premium", "/api/paid/*") */
	pattern: string;
	/** Price in USD (e.g. "$0.01") */
	price: string;
	/** Human-readable description of what the payment is for */
	description: string;
	// ─────────────────────────────────────────────────────────────────────────
	// Bot Management Filtering (optional - requires Cloudflare Bot Management)
	// ─────────────────────────────────────────────────────────────────────────
	/**
	 * Bot score threshold for payment enforcement.
	 * Requests with bot score ABOVE this threshold are considered human and pass through free.
	 * Requests with bot score AT OR BELOW this threshold must pay (unless excepted).
	 *
	 * Recommended values:
	 *   - 30 (default): Blocks likely automated traffic, humans pass free
	 *   - 2: Very strict, only clear human traffic passes free
	 *   - 1: Strictest, only verified humans pass free
	 *
	 * If not set, all traffic to this route must pay (no bot filtering).
	 */
	bot_score_threshold?: number;
	/**
	 * Detection IDs of bots that should get FREE access (bypass payment).
	 * These are resolved from bot names during setup (see agent-reference/bots.ts).
	 *
	 * Example: [120623194, 117479730, 120424214] for Googlebot, BingBot, Applebot
	 *
	 * Only used when bot_score_threshold is set.
	 */
	except_detection_ids?: number[];
}

/**
 * Creates middleware for a protected route that requires payment OR valid cookie
 * This dynamically creates payment middleware at request time to access environment variables
 * The route path is automatically determined from the request context
 *
 * @param config - Payment configuration
 * @returns Middleware that enforces payment or cookie authentication
 */
export function createProtectedRoute(config: ProtectedRouteConfig) {
	return async (c: Context<AppContext>, next: Next) => {
		// Get the route path from the request context
		// Normalize the path by removing trailing slashes (except for root "/")
		// This matches how x402's findMatchingRoute normalizes incoming request paths
		const rawPath = c.req.path;
		const routePath =
			rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;

		// Create payment middleware dynamically with config from env
		// Facilitator is optional - x402 uses its own default when not provided
		const facilitator = c.env.FACILITATOR_URL
			? { url: c.env.FACILITATOR_URL }
			: undefined;

		const paymentMw = paymentMiddleware(
			c.env.PAY_TO as `0x${string}`,
			{
				[routePath]: {
					price: config.price,
					network: c.env.NETWORK,
					config: {
						description: config.description,
					},
				},
			},
			facilitator
		);

		// Apply the combined auth/payment middleware
		return await requirePaymentOrCookie(paymentMw)(c, next);
	};
}
