import { JinaGroundingProvider } from './jina_grounding/index.js';
import { KagiEnrichmentProvider } from './kagi_enrichment/index.js';

// Export individual provider classes
export { JinaGroundingProvider, KagiEnrichmentProvider };

// Export array of all enhancement provider constructors for easier iteration
export const all_enhancement_provider_classes = [
	JinaGroundingProvider,
	KagiEnrichmentProvider,
];

// Export function to create instances of all enhancement providers
export const create_all_enhancement_providers = () => ({
	jina_grounding: new JinaGroundingProvider(),
	kagi_enrichment: new KagiEnrichmentProvider(),
});
