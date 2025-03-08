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

interface BraveSearchResponse {
	web: {
		results: Array<{
			title: string;
			url: string;
			description: string;
		}>;
	};
}

export class BraveSearchProvider implements SearchProvider {
	name = 'brave';
	description = 'Privacy-focused search engine with good coverage of technical topics. Features independent index and strong privacy protections. Best for technical documentation, developer resources, and privacy-sensitive queries.';

	async search(params: BaseSearchParams): Promise<SearchResult[]> {
		const api_key = validate_api_key(
			config.search.brave.api_key,
			this.name,
		);

		const search_request = async () => {
			try {
				const query_params = new URLSearchParams({
					q: sanitize_query(params.query),
					count: (params.limit ?? 10).toString(),
				});

				if (params.include_domains?.length) {
					// Brave API uses 'site:domain' syntax in the query parameter
					const domain_filter = params.include_domains
						.map(domain => `site:${domain}`)
						.join(' OR ');
					query_params.set('q', `${sanitize_query(params.query)} (${domain_filter})`);
				}

				const response = await fetch(
					`${config.search.brave.base_url}/web/search?${query_params}`,
					{
						method: 'GET',
						headers: {
							'Accept': 'application/json',
							'X-Subscription-Token': api_key,
						},
						signal: AbortSignal.timeout(config.search.brave.timeout),
					},
				);

				let data: BraveSearchResponse & { message?: string };
				try {
					const text = await response.text();
					data = JSON.parse(text);
				} catch (error) {
					throw new ProviderError(
						ErrorType.API_ERROR,
						`Invalid JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
						this.name,
					);
				}

				if (!response.ok || !data.web?.results) {
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
								'Brave Search API internal error',
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

				return data.web.results.map((result) => ({
					title: result.title,
					url: result.url,
					snippet: result.description,
					source_provider: this.name,
				}));
			} catch (error) {
				if (error instanceof ProviderError) {
					throw error;
				}
				throw new ProviderError(
					ErrorType.API_ERROR,
					`Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`,
					this.name,
				);
			}
		};

		return retry_with_backoff(search_request);
	}
}
