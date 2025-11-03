import { http_json } from './http.js';
import { ErrorType, ProviderError } from './types.js';
import { is_valid_url } from './utils.js';

/**
 * Validate URLs for Firecrawl processing
 * Throws ProviderError if any URL is invalid
 */
export const validate_firecrawl_urls = (
	url: string | string[],
	provider_name: string,
): string[] => {
	const urls = Array.isArray(url) ? url : [url];

	for (const u of urls) {
		if (!is_valid_url(u)) {
			throw new ProviderError(
				ErrorType.INVALID_INPUT,
				`Invalid URL provided: ${u}`,
				provider_name,
			);
		}
	}

	return urls;
};

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

export interface ProcessedUrlResult {
	url: string;
	content: string;
	metadata?: any;
	success: boolean;
	error?: string;
}

/**
 * Aggregate results from multiple URL processing attempts
 * Returns combined content and metadata, throws if all URLs failed
 */
export const aggregate_url_results = (
	results: ProcessedUrlResult[],
	provider_name: string,
	urls: string[],
	extract_depth: 'basic' | 'advanced',
) => {
	// Filter successful and failed results
	const successful_results = results.filter((r) => r.success);
	const failed_urls = results
		.filter((r) => !r.success)
		.map((r) => r.url);

	// If all URLs failed, throw an error
	if (successful_results.length === 0) {
		throw new ProviderError(
			ErrorType.PROVIDER_ERROR,
			'Failed to extract content from all URLs',
			provider_name,
		);
	}

	// Map results to raw_contents array
	const raw_contents = successful_results.map((result) => ({
		url: result.url,
		content: result.content,
	}));

	// Combine all results into a single content string
	const combined_content = raw_contents
		.map((result) => result.content)
		.join('\n\n');

	// Calculate total word count
	const word_count = combined_content
		.split(/\s+/)
		.filter(Boolean).length;

	// Get title from first successful result if available
	const title = successful_results[0]?.metadata?.title;

	return {
		content: combined_content,
		raw_contents,
		metadata: {
			title,
			word_count,
			failed_urls: failed_urls.length > 0 ? failed_urls : undefined,
			urls_processed: urls.length,
			successful_extractions: successful_results.length,
			extract_depth,
		},
		source_provider: provider_name,
	};
};

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
