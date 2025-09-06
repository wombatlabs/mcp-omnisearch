import { BraveSearchProvider } from './brave/index.js';
import { ExaSearchProvider } from './exa/index.js';
import { GitHubSearchProvider } from './github/index.js';
import { KagiSearchProvider } from './kagi/index.js';
import { TavilySearchProvider } from './tavily/index.js';

// Export individual provider classes
export {
	BraveSearchProvider,
	ExaSearchProvider,
	GitHubSearchProvider,
	KagiSearchProvider,
	TavilySearchProvider,
};

// Export array of all search provider constructors for easier iteration
export const all_search_provider_classes = [
	TavilySearchProvider,
	BraveSearchProvider,
	KagiSearchProvider,
	GitHubSearchProvider,
	ExaSearchProvider,
];

// Export function to create instances of all search providers
export const create_all_search_providers = () => ({
	tavily: new TavilySearchProvider(),
	brave: new BraveSearchProvider(),
	kagi: new KagiSearchProvider(),
	github: new GitHubSearchProvider(),
	exa: new ExaSearchProvider(),
});
