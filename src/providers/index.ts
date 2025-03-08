import { PerplexityProvider } from './ai_response/perplexity/index.js';
import { JinaGroundingProvider } from './enhancement/jina_grounding/index.js';
import { KagiEnrichmentProvider } from './enhancement/kagi_enrichment/index.js';
import { JinaReaderProvider } from './processing/jina_reader/index.js';
import { KagiSummarizerProvider } from './processing/kagi_summarizer/index.js';
import { BraveSearchProvider } from './search/brave/index.js';
import { KagiSearchProvider } from './search/kagi/index.js';
import { TavilySearchProvider } from './search/tavily/index.js';

import {
	register_enhancement_provider,
	register_processing_provider,
	register_search_provider,
} from '../server/tools.js';

export const initialize_providers = () => {
	// Initialize search providers
	register_search_provider(new TavilySearchProvider());
	register_search_provider(new BraveSearchProvider());
	register_search_provider(new KagiSearchProvider());

	// Initialize AI response providers
	const perplexity = new PerplexityProvider();
	// Note: Perplexity provider is initialized but not registered as it uses a custom interface

	// Initialize processing providers
	register_processing_provider(new JinaReaderProvider());
	register_processing_provider(new KagiSummarizerProvider());

	// Initialize enhancement providers
	register_enhancement_provider(new JinaGroundingProvider());
	register_enhancement_provider(new KagiEnrichmentProvider());

	// Log initialization
	console.error('Initialized providers:');
	console.error('- Search: Tavily, Brave, Kagi');
	console.error('- AI Response: Perplexity');
	console.error('- Processing: Jina Reader, Kagi Summarizer');
	console.error('- Enhancement: Jina Grounding, Kagi Enrichment');
};
