import {
	BaseSearchParams,
	SearchProvider,
	SearchResult,
} from '../../../common/types.js';
import { validate_api_key } from '../../../common/utils.js';
import { config } from '../../../config/env.js';

export class TavilySearchProvider implements SearchProvider {
	name = 'tavily';
	description =
		'Search the web using Tavily Search API. Best for factual queries requiring reliable sources and citations. Provides high-quality results for technical, scientific, and academic topics. Use when you need verified information with strong citation support.';

	async search(params: BaseSearchParams): Promise<SearchResult[]> {
		const api_key = validate_api_key(
			config.search.tavily.api_key,
			this.name,
		);

		// TODO: Implement actual API call
		// This is a placeholder implementation
		return [
			{
				title: 'Example Result',
				url: 'https://example.com',
				snippet: 'Example search result snippet',
				source_provider: this.name,
			},
		];
	}
}
