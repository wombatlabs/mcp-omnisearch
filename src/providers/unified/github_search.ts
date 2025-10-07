import {
	BaseSearchParams,
	ErrorType,
	ProviderError,
	SearchProvider,
	SearchResult,
} from '../../common/types.js';
import { GitHubSearchProvider } from '../search/github/index.js';

export type GitHubSearchType = 'code' | 'repositories' | 'users';

export interface UnifiedGitHubSearchParams extends BaseSearchParams {
	search_type?: GitHubSearchType;
	sort?: 'stars' | 'forks' | 'updated';
}

export class UnifiedGitHubSearchProvider implements SearchProvider {
	name = 'github_search';
	description =
		'Search GitHub for code, repositories, or users. Supports advanced syntax (filename:, path:, repo:, user:, language:, in:file).';

	private provider: GitHubSearchProvider;

	constructor() {
		this.provider = new GitHubSearchProvider();
	}

	async search(
		params: UnifiedGitHubSearchParams,
	): Promise<SearchResult[]> {
		const { search_type = 'code', sort, ...searchParams } = params;

		switch (search_type) {
			case 'code':
				return this.provider.search_code(searchParams);
			case 'repositories':
				return this.provider.search_repositories({
					...searchParams,
					sort,
				});
			case 'users':
				return this.provider.search_users(searchParams);
			default:
				throw new ProviderError(
					ErrorType.INVALID_INPUT,
					`Invalid search_type: ${search_type}. Valid options: code, repositories, users`,
					this.name,
				);
		}
	}
}
