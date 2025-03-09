// Environment variable configuration for the MCP Omnisearch server

// Search provider API keys
export const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
export const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
export const KAGI_API_KEY = process.env.KAGI_API_KEY;

// AI provider API keys
export const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Content processing API keys
export const JINA_AI_API_KEY = process.env.JINA_AI_API_KEY;

// Provider configuration
export const config = {
	search: {
		tavily: {
			api_key: TAVILY_API_KEY,
			base_url: 'https://api.tavily.com',
			timeout: 30000, // 30 seconds
		},
		brave: {
			api_key: BRAVE_API_KEY,
			base_url: 'https://api.search.brave.com/res/v1',
			timeout: 10000, // 10 seconds
		},
		kagi: {
			api_key: KAGI_API_KEY,
			base_url: 'https://kagi.com/api/v0',
			timeout: 20000, // 20 seconds
		},
	},
	ai_response: {
		perplexity: {
			api_key: PERPLEXITY_API_KEY,
			base_url: 'https://api.perplexity.ai',
			timeout: 60000, // 60 seconds
		},
		kagi_fastgpt: {
			api_key: KAGI_API_KEY,
			base_url: 'https://kagi.com/api/v0/fastgpt',
			timeout: 30000, // 30 seconds
		},
	},
	processing: {
		jina_reader: {
			api_key: JINA_AI_API_KEY,
			base_url: 'https://api.jina.ai/v1/reader',
			timeout: 30000, // 30 seconds
		},
		kagi_summarizer: {
			api_key: KAGI_API_KEY,
			base_url: 'https://kagi.com/api/v0/summarize',
			timeout: 30000, // 30 seconds
		},
	},
	enhancement: {
		kagi_enrichment: {
			api_key: KAGI_API_KEY,
			base_url: 'https://kagi.com/api/v0/enrich',
			timeout: 20000, // 20 seconds
		},
		jina_grounding: {
			api_key: JINA_AI_API_KEY,
			base_url: 'https://api.jina.ai/v1/ground',
			timeout: 20000, // 20 seconds
		},
	},
};

// Validate required environment variables
export const validate_config = () => {
	const missing_keys: string[] = [];

	// Check search provider keys
	if (!TAVILY_API_KEY) missing_keys.push('TAVILY_API_KEY');
	if (!BRAVE_API_KEY) missing_keys.push('BRAVE_API_KEY');
	if (!KAGI_API_KEY) missing_keys.push('KAGI_API_KEY');
	if (!PERPLEXITY_API_KEY) missing_keys.push('PERPLEXITY_API_KEY');
	if (!JINA_AI_API_KEY) missing_keys.push('JINA_AI_API_KEY');

	if (missing_keys.length > 0) {
		console.warn(
			`Warning: Missing environment variables: ${missing_keys.join(
				', ',
			)}. Some functionality may be limited.`,
		);
	}
};
