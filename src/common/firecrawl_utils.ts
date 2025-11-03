import { http_json } from './http.js';
import { ErrorType, ProviderError } from './types.js';
import {
	aggregate_url_results as aggregate_url_results_common,
	validate_processing_urls,
	type ProcessedUrlResult as ProcessedUrlResultCommon,
} from './utils.js';

/**
 * Validate URLs for Firecrawl processing
 * @deprecated Use validate_processing_urls from utils.ts instead
 * Throws ProviderError if any URL is invalid
 */
export const validate_firecrawl_urls = validate_processing_urls;

/**
 * Make a Firecrawl API request with standard headers and error handling
 */
export const make_firecrawl_request = async <T>(
	provider_name: string,
	base_url: string,
	api_key: string,
	body: Record<string, any>,
	timeout: number,
): Promise<T> => {
	return http_json<T>(provider_name, base_url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${api_key}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(timeout),
	});
};

/**
 * Check Firecrawl response for errors
 * Throws ProviderError if response indicates failure
 */
export const validate_firecrawl_response = (
	data: { success: boolean; error?: string },
	provider_name: string,
	error_message: string,
): void => {
	if (!data.success || data.error) {
		throw new ProviderError(
			ErrorType.PROVIDER_ERROR,
			`${error_message}: ${data.error || 'Unknown error'}`,
			provider_name,
		);
	}
};

/**
 * Interface for processed URL results
 * @deprecated Use ProcessedUrlResult from utils.ts instead
 */
export type ProcessedUrlResult = ProcessedUrlResultCommon;

/**
 * Aggregate results from multiple URL processing attempts
 * @deprecated Use aggregate_url_results from utils.ts instead
 * Returns combined content and metadata, throws if all URLs failed
 */
export const aggregate_url_results = aggregate_url_results_common;

export interface PollingConfig {
	provider_name: string;
	status_url: string;
	api_key: string;
	max_attempts: number;
	poll_interval: number;
	timeout: number;
}

/**
 * Poll a Firecrawl job until completion
 * Returns the completed status response or throws on error/timeout
 */
export const poll_firecrawl_job = async <
	T extends {
		success: boolean;
		status: string;
		error?: string;
		data?: any;
	},
>(
	config: PollingConfig,
): Promise<T> => {
	let attempts = 0;

	while (attempts < config.max_attempts) {
		attempts++;
		await new Promise((resolve) =>
			setTimeout(resolve, config.poll_interval),
		);

		let status_result: T;
		try {
			status_result = await http_json<T>(
				config.provider_name,
				config.status_url,
				{
					method: 'GET',
					headers: { Authorization: `Bearer ${config.api_key}` },
					signal: AbortSignal.timeout(config.timeout),
				},
			);
		} catch {
			continue; // skip this poll attempt on transient HTTP errors
		}

		if (!status_result.success) {
			throw new ProviderError(
				ErrorType.PROVIDER_ERROR,
				`Error checking job status: ${status_result.error || 'Unknown error'}`,
				config.provider_name,
			);
		}

		if (status_result.status === 'completed' && status_result.data) {
			return status_result;
		} else if (status_result.status === 'error') {
			throw new ProviderError(
				ErrorType.PROVIDER_ERROR,
				`Job failed: ${status_result.error || 'Unknown error'}`,
				config.provider_name,
			);
		}

		// If still processing, continue polling
	}

	throw new ProviderError(
		ErrorType.PROVIDER_ERROR,
		'Job timed out - try again later or with a smaller scope',
		config.provider_name,
	);
};
