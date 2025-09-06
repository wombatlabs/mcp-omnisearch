import { ExaContentsProvider } from './exa_contents/index.js';
import { ExaSimilarProvider } from './exa_similar/index.js';
import {
	FirecrawlActionsProvider,
	FirecrawlCrawlProvider,
	FirecrawlExtractProvider,
	FirecrawlMapProvider,
	FirecrawlScrapeProvider,
} from './firecrawl/index.js';
import { JinaReaderProvider } from './jina_reader/index.js';
import { KagiSummarizerProvider } from './kagi_summarizer/index.js';
import { TavilyExtractProvider } from './tavily_extract/index.js';

// Export individual provider classes
export {
	ExaContentsProvider,
	ExaSimilarProvider,
	FirecrawlActionsProvider,
	FirecrawlCrawlProvider,
	FirecrawlExtractProvider,
	FirecrawlMapProvider,
	FirecrawlScrapeProvider,
	JinaReaderProvider,
	KagiSummarizerProvider,
	TavilyExtractProvider,
};

// Export array of all processing provider constructors for easier iteration
export const all_processing_provider_classes = [
	JinaReaderProvider,
	KagiSummarizerProvider,
	TavilyExtractProvider,
	FirecrawlScrapeProvider,
	FirecrawlCrawlProvider,
	FirecrawlMapProvider,
	FirecrawlExtractProvider,
	FirecrawlActionsProvider,
	ExaContentsProvider,
	ExaSimilarProvider,
];

// Export function to create instances of all processing providers
export const create_all_processing_providers = () => ({
	jina_reader: new JinaReaderProvider(),
	kagi_summarizer: new KagiSummarizerProvider(),
	tavily_extract: new TavilyExtractProvider(),
	firecrawl_scrape: new FirecrawlScrapeProvider(),
	firecrawl_crawl: new FirecrawlCrawlProvider(),
	firecrawl_map: new FirecrawlMapProvider(),
	firecrawl_extract: new FirecrawlExtractProvider(),
	firecrawl_actions: new FirecrawlActionsProvider(),
	exa_contents: new ExaContentsProvider(),
	exa_similar: new ExaSimilarProvider(),
});
