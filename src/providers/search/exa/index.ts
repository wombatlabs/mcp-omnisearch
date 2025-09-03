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

interface ExaSearchRequest {
	query: string;
	type?: string;
	numResults?: number;
	includeDomains?: string[];
	excludeDomains?: string[];
	contents?: {
		text?: { maxCharacters?: number };
		livecrawl?: 'always' | 'fallback' | 'preferred';
	};
	category?: string;
	useAutoprompt?: boolean;
}

interface ExaSearchResult {
	id: string;
	title: string;
	url: string;
	publishedDate?: string;
	author?: string;
	text?: string;
	score?: number;
	highlights?: string[];
	summary?: string;
}

interface ExaSearchResponse {
	requestId: string;
	autopromptString?: string;
	resolvedSearchType: string;
	results: ExaSearchResult[];
}

export class ExaSearchProvider implements SearchProvider {
	name = 'exa';
	description =
		'AI-powered web search using neural and keyword search. Optimized for AI applications with semantic understanding, content extraction, and research capabilities.';

	async search(params: BaseSearchParams): Promise<SearchResult[]> {
		const api_key = validate_api_key(
			config.search.exa.api_key,
			this.name,
		);

		const search_request = async () => {
			try {
				const request_body: ExaSearchRequest = {
					query: sanitize_query(params.query),
					type: 'auto', // Let Exa choose between neural and keyword search
					numResults: params.limit ?? 10,
					useAutoprompt: true,
					contents: {
						text: { maxCharacters: 3000 },
						livecrawl: 'fallback',
					},
				};

				// Add domain filtering if provided
				if (
					params.include_domains &&
					params.include_domains.length > 0
				) {
					request_body.includeDomains = params.include_domains;
				}
				if (
					params.exclude_domains &&
					params.exclude_domains.length > 0
				) {
					request_body.excludeDomains = params.exclude_domains;
				}

				const response = await fetch(
					`${config.search.exa.base_url}/search`,
					{
						method: 'POST',
						headers: {
							'x-api-key': api_key,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(request_body),
					},
				);

				if (!response.ok) {
					switch (response.status) {
						case 401:
							throw new ProviderError(
								ErrorType.API_ERROR,
								'Invalid API key',
								this.name,
							);
						case 403:
							throw new ProviderError(
								ErrorType.API_ERROR,
								'API key does not have access to this endpoint',
								this.name,
							);
						case 429:
							handle_rate_limit(this.name);
							throw new ProviderError(
								ErrorType.RATE_LIMIT,
								'Rate limit exceeded',
								this.name,
							);
						case 500:
							throw new ProviderError(
								ErrorType.PROVIDER_ERROR,
								'Exa API internal error',
								this.name,
							);
						default:
							const error_text = await response.text();
							throw new ProviderError(
								ErrorType.API_ERROR,
								`Unexpected error: ${error_text}`,
								this.name,
							);
					}
				}

				const data = (await response.json()) as ExaSearchResponse;

				return data.results.map((result) => ({
					title: result.title,
					url: result.url,
					snippet:
						result.text || result.summary || 'No content available',
					score: result.score || 0,
					source_provider: this.name,
					metadata: {
						id: result.id,
						author: result.author,
						publishedDate: result.publishedDate,
						highlights: result.highlights,
						autopromptString: data.autopromptString,
						resolvedSearchType: data.resolvedSearchType,
					},
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
