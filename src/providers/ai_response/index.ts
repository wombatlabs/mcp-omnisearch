import { ExaAnswerProvider } from './exa_answer/index.js';
import { KagiFastGPTProvider } from './kagi_fastgpt/index.js';
import { PerplexityProvider } from './perplexity/index.js';

// Export individual provider classes
export { ExaAnswerProvider, KagiFastGPTProvider, PerplexityProvider };

// Export array of all AI response provider constructors for easier iteration
export const all_ai_response_provider_classes = [
	PerplexityProvider,
	KagiFastGPTProvider,
	ExaAnswerProvider,
];

// Export function to create instances of all AI response providers
export const create_all_ai_response_providers = () => ({
	perplexity: new PerplexityProvider(),
	kagi_fastgpt: new KagiFastGPTProvider(),
	exa_answer: new ExaAnswerProvider(),
});
