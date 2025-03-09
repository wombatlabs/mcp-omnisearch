import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
	ListResourcesRequestSchema,
	ListResourceTemplatesRequestSchema,
	ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export const setup_handlers = (server: Server) => {
	// List available resources
	server.setRequestHandler(ListResourcesRequestSchema, async () => ({
		resources: [
			{
				uri: 'omnisearch://providers/status',
				name: 'Provider Status',
				mimeType: 'application/json',
				description: 'Current status of all search providers',
			},
		],
	}));

	// List resource templates
	server.setRequestHandler(
		ListResourceTemplatesRequestSchema,
		async () => ({
			resourceTemplates: [
				{
					uriTemplate: 'omnisearch://search/{provider}/info',
					name: 'Search Provider Info',
					mimeType: 'application/json',
					description: 'Information about a specific search provider',
				},
			],
		}),
	);

	// Handle resource reads
	server.setRequestHandler(
		ReadResourceRequestSchema,
		async (request) => {
			const { uri } = request.params;

			// Handle provider status resource
			if (uri === 'omnisearch://providers/status') {
				return {
					contents: [
						{
							uri,
							mimeType: 'application/json',
							text: JSON.stringify(
								{
									status: 'operational',
									providers: {
										search: ['tavily', 'brave', 'kagi'],
										ai_response: ['perplexity', 'kagi_fastgpt'],
										processing: ['jina_reader', 'kagi_summarizer'],
										enhancement: [
											'jina_grounding',
											'kagi_enrichment',
										],
									},
								},
								null,
								2,
							),
						},
					],
				};
			}

			// Handle provider info template
			const providerMatch = uri.match(
				/^omnisearch:\/\/search\/([^/]+)\/info$/,
			);
			if (providerMatch) {
				const providerName = providerMatch[1];
				return {
					contents: [
						{
							uri,
							mimeType: 'application/json',
							text: JSON.stringify(
								{
									name: providerName,
									status: 'active',
									capabilities: ['web_search', 'news_search'],
									rate_limits: {
										requests_per_minute: 60,
										requests_per_day: 1000,
									},
								},
								null,
								2,
							),
						},
					],
				};
			}

			throw new Error(`Unknown resource URI: ${uri}`);
		},
	);
};
