import {
	BaseSearchParams,
	ErrorType,
	ProviderError,
	SearchProvider,
	SearchResult,
} from '../../../common/types.js';
import {
	handle_rate_limit,
	retry_with_backoff,
	sanitize_query,
	validate_api_key,
} from '../../../common/utils.js';
import { config } from '../../../config/env.js';

interface KagiSearchResponse {
	data: Array<{
		title: string;
		url: string;
		snippet: string;
		rank?: number;
	}>;
	meta?: {
		total_hits: number;
		api_balance?: number;
	};
}

export class KagiSearchProvider implements SearchProvider {
	name = 'kagi';
	description =
		'High-quality search results with minimal advertising influence, focused on authoritative sources. Features strong privacy protection and access to specialized knowledge indexes. Best for research, technical documentation, and finding high-quality content without SEO manipulation.';

	async search(params: BaseSearchParams): Promise<SearchResult[]> {
		const api_key = validate_api_key(
			config.search.kagi.api_key,
			this.name,
		);

		const search_request = async () => {
			try {
				const query_params = new URLSearchParams({
					q: sanitize_query(params.query),
					limit: (params.limit ?? 10).toString(),
				});

				if (params.include_domains?.length) {
					query_params.append(
						'filter_sites',
						params.include_domains.join(','),
					);
				}

				if (params.exclude_domains?.length) {
					query_params.append(
						'exclude_sites',
						params.exclude_domains.join(','),
					);
				}

				const response = await fetch(
					`${config.search.kagi.base_url}/search?${query_params}`,
					{
						method: 'GET',
						headers: {
							Authorization: `Bot ${api_key}`,
							Accept: 'application/json',
						},
						signal: AbortSignal.timeout(config.search.kagi.timeout),
					},
				);

				let data: KagiSearchResponse & { message?: string };
				try {
					const text = await response.text();
					data = JSON.parse(text);
				} catch (error) {
					throw new ProviderError(
						ErrorType.API_ERROR,
						`Invalid JSON response: ${
							error instanceof Error ? error.message : 'Unknown error'
						}`,
						this.name,
					);
				}

				if (!response.ok || !data.data) {
					const error_message = data.message || response.statusText;
					switch (response.status) {
						case 401:
							throw new ProviderError(
								ErrorType.API_ERROR,
								'Invalid API key',
								this.name,
							);
						case 429:
							handle_rate_limit(this.name);
						case 500:
							throw new ProviderError(
								ErrorType.PROVIDER_ERROR,
								'Kagi Search API internal error',
								this.name,
							);
						default:
							throw new ProviderError(
								ErrorType.API_ERROR,
								`Unexpected error: ${error_message}`,
								this.name,
							);
					}
				}

				return data.data.map((result) => ({
					title: result.title,
					url: result.url,
					snippet: result.snippet,
					score: result.rank,
					source_provider: this.name,
				}));
			} catch (error) {
				if (error instanceof ProviderError) {
					throw error;
				}
				throw new ProviderError(
					ErrorType.API_ERROR,
					`Failed to fetch: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`,
					this.name,
				);
			}
		};

		return retry_with_backoff(search_request);
	}
}
