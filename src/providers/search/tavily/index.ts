import {
	BaseSearchParams,
	ErrorType,
	ProviderError,
	SearchProvider,
	SearchResult,
} from '../../../common/types.js';
import {
	apply_search_operators,
	parse_search_operators,
	retry_with_backoff,
	sanitize_query,
	validate_api_key,
} from '../../../common/utils.js';
import { http_json } from '../../../common/http.js';
import { config } from '../../../config/env.js';

interface TavilySearchResponse {
	results: {
		title: string;
		url: string;
		content: string;
		score: number;
	}[];
	response_time: string;
}

export class TavilySearchProvider implements SearchProvider {
	name = 'tavily';
	description =
		'Search the web using Tavily Search API. Best for factual queries requiring reliable sources and citations. Supports domain filtering through API parameters (include_domains/exclude_domains). Provides high-quality results for technical, scientific, and academic topics. Use when you need verified information with strong citation support.';

	async search(params: BaseSearchParams): Promise<SearchResult[]> {
		const api_key = validate_api_key(
			config.search.tavily.api_key,
			this.name,
		);

		// Parse search operators from the query
		const parsed_query = parse_search_operators(params.query);
		const search_params = apply_search_operators(parsed_query);

		const search_request = async () => {
			try {
				// Only use officially supported parameters
				const request_body: Record<string, any> = {
					query: sanitize_query(params.query), // Use original query without operators
					max_results: params.limit ?? 5,
					include_domains: params.include_domains ?? [],
					exclude_domains: params.exclude_domains ?? [],
					search_depth: 'basic',
					topic: 'general',
				};

				const data = await http_json<
					TavilySearchResponse & { message?: string }
				>(this.name, `${config.search.tavily.base_url}/search`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${api_key}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(request_body),
				});

				return (data.results || []).map((result) => ({
					title: result.title,
					url: result.url,
					snippet: result.content,
					score: result.score,
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
