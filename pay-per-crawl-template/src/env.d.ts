/**
 * Type declarations for Cloudflare Worker environment.
 */

import type { Env } from "./types";

declare global {
	// Extend the cf object with bot management types
	interface CfProperties {
		botManagement?: {
			score?: number;
			verifiedBot?: boolean;
			detectionIds?: number[];
		};
	}
}

export {};
