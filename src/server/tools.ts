import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
	BaseSearchParams,
	EnhancementProvider,
	ProcessingProvider,
	SearchProvider,
} from '../common/types.js';
import { create_error_response } from '../common/utils.js';

// Track available providers by category
export const available_providers = {
	search: new Set<string>(),
	ai_response: new Set<string>(),
	processing: new Set<string>(),
	enhancement: new Set<string>(),
};

class ToolRegistry {
	private search_providers: Map<string, SearchProvider> = new Map();
	private processing_providers: Map<string, ProcessingProvider> =
		new Map();
	private enhancement_providers: Map<string, EnhancementProvider> =
		new Map();

	register_search_provider(
		provider: SearchProvider,
		is_ai_response = false,
	) {
		this.search_providers.set(provider.name, provider);
		if (is_ai_response) {
			available_providers.ai_response.add(provider.name);
		} else {
			available_providers.search.add(provider.name);
		}
	}

	register_processing_provider(provider: ProcessingProvider) {
		this.processing_providers.set(provider.name, provider);
		available_providers.processing.add(provider.name);
	}

	register_enhancement_provider(provider: EnhancementProvider) {
		this.enhancement_providers.set(provider.name, provider);
		available_providers.enhancement.add(provider.name);
	}

	setup_tool_handlers(server: Server) {
		// Register tool list handler
		server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: [
				// Standard search providers (renamed for clarity)
				...Array.from(this.search_providers.values())
					.filter((provider) => provider.name !== 'github')
					.map((provider) => ({
						name: `${provider.name}_search`,
						description: provider.description,
						inputSchema: {
							type: 'object',
							properties: {
								query: {
									type: 'string',
									description: 'Search query',
								},
								limit: {
									type: 'number',
									description: 'Maximum number of results to return',
									minimum: 1,
									maximum: 50,
								},
								include_domains: {
									type: 'array',
									items: { type: 'string' },
									description:
										'List of domains to include in search results',
								},
								exclude_domains: {
									type: 'array',
									items: { type: 'string' },
									description:
										'List of domains to exclude from search results',
								},
							},
							required: ['query'],
						},
					})),
				// GitHub-specific search tools
				...Array.from(this.search_providers.values())
					.filter((p) => p.name === 'github')
					.flatMap(() => [
						{
							name: 'github_search',
							description:
								'Search for code on GitHub. This is ideal for finding code examples, tracking down function definitions, or locating files with specific names or paths. Supports advanced query syntax with qualifiers like `filename:`, `path:`, `repo:`, `user:`, `language:`, and `in:file`. For example, to find a file named `settings.json` in a `.claude` directory, you could use the query: `filename:settings.json path:.claude`',
							inputSchema: {
								type: 'object',
								properties: {
									query: {
										type: 'string',
										description: 'Search query',
									},
									limit: {
										type: 'number',
										description:
											'Maximum number of results to return',
										minimum: 1,
										maximum: 50,
									},
								},
								required: ['query'],
							},
						},
						{
							name: 'github_repository_search',
							description: 'Search for repositories on GitHub',
							inputSchema: {
								type: 'object',
								properties: {
									query: {
										type: 'string',
										description: 'Search query',
									},
									limit: {
										type: 'number',
										description:
											'Maximum number of results to return',
										minimum: 1,
										maximum: 50,
									},
									sort: {
										type: 'string',
										enum: ['stars', 'forks', 'updated'],
										description: 'Sorts the results of a search.',
									},
								},
								required: ['query'],
							},
						},
						{
							name: 'github_user_search',
							description:
								'Search for users and organizations on GitHub',
							inputSchema: {
								type: 'object',
								properties: {
									query: {
										type: 'string',
										description: 'Search query',
									},
									limit: {
										type: 'number',
										description:
											'Maximum number of results to return',
										minimum: 1,
										maximum: 50,
									},
								},
								required: ['query'],
							},
						},
					]),
				...Array.from(this.processing_providers.values()).map(
					(provider) => ({
						name: `${provider.name}_process`,
						description: provider.description,
						inputSchema: {
							type: 'object',
							properties: {
								url: {
									oneOf: [
										{
											type: 'string',
											description: 'Single URL to process',
										},
										{
											type: 'array',
											items: {
												type: 'string',
											},
											description: 'Multiple URLs to process',
										},
									],
								},
								extract_depth: {
									type: 'string',
									enum: ['basic', 'advanced'],
									default: 'basic',
									description:
										'The depth of the extraction process. "advanced" retrieves more data but costs more credits.',
								},
							},
							required: ['url'],
						},
					}),
				),
				...Array.from(this.enhancement_providers.values()).map(
					(provider) => ({
						name: `${provider.name}_enhance`,
						description: provider.description,
						inputSchema: {
							type: 'object',
							properties: {
								content: {
									type: 'string',
									description: 'Content to enhance',
								},
							},
							required: ['content'],
						},
					}),
				),
			],
		}));

		// Register tool call handler
		server.setRequestHandler(
			CallToolRequestSchema,
			async (request) => {
				try {
					// Split from the right to handle provider names that contain underscores
					const parts = request.params.name.split('_');
					const action = parts.pop()!; // Get last part as action
					const provider_name = parts.join('_'); // Join remaining parts as provider name
					const args = request.params.arguments;

					if (!args || typeof args !== 'object') {
						return {
							content: [
								{
									type: 'text',
									text: 'Missing or invalid arguments',
								},
							],
							isError: true,
						};
					}

					// Handle GitHub-specific tools with custom routing
					if (request.params.name.startsWith('github_')) {
						return this.handle_github_tools(
							request.params.name,
							args,
						);
					}

					switch (action) {
						case 'search': {
							const provider =
								this.search_providers.get(provider_name);
							if (!provider) {
								return {
									content: [
										{
											type: 'text',
											text: `Unknown search provider: ${provider_name}`,
										},
									],
									isError: true,
								};
							}

							// Type guard for search parameters
							if (
								!('query' in args) ||
								typeof args.query !== 'string'
							) {
								return {
									content: [
										{
											type: 'text',
											text: 'Missing or invalid query parameter',
										},
									],
									isError: true,
								};
							}

							const search_params: BaseSearchParams = {
								query: args.query,
								limit:
									typeof args.limit === 'number'
										? args.limit
										: undefined,
								include_domains: Array.isArray(args.include_domains)
									? args.include_domains
									: undefined,
								exclude_domains: Array.isArray(args.exclude_domains)
									? args.exclude_domains
									: undefined,
							};

							const results = await provider.search(search_params);
							return {
								content: [
									{
										type: 'text',
										text: JSON.stringify(results, null, 2),
									},
								],
							};
						}

						case 'process': {
							const provider =
								this.processing_providers.get(provider_name);
							if (!provider) {
								return {
									content: [
										{
											type: 'text',
											text: `Unknown processing provider: ${provider_name}`,
										},
									],
									isError: true,
								};
							}

							if (
								!('url' in args) ||
								(typeof args.url !== 'string' &&
									!Array.isArray(args.url))
							) {
								return {
									content: [
										{
											type: 'text',
											text: 'Missing or invalid URL parameter',
										},
									],
									isError: true,
								};
							}

							const result = await provider.process_content(
								args.url,
								args.extract_depth as 'basic' | 'advanced',
							);
							return {
								content: [
									{
										type: 'text',
										text: JSON.stringify(result, null, 2),
									},
								],
							};
						}

						case 'enhance': {
							const provider =
								this.enhancement_providers.get(provider_name);
							if (!provider) {
								return {
									content: [
										{
											type: 'text',
											text: `Unknown enhancement provider: ${provider_name}`,
										},
									],
									isError: true,
								};
							}

							if (
								!('content' in args) ||
								typeof args.content !== 'string'
							) {
								return {
									content: [
										{
											type: 'text',
											text: 'Missing or invalid content parameter',
										},
									],
									isError: true,
								};
							}

							const result = await provider.enhance_content(
								args.content,
							);
							return {
								content: [
									{
										type: 'text',
										text: JSON.stringify(result, null, 2),
									},
								],
							};
						}

						default:
							return {
								content: [
									{ type: 'text', text: `Unknown action: ${action}` },
								],
								isError: true,
							};
					}
				} catch (error) {
					const error_response = create_error_response(
						error as Error,
					);
					return {
						content: [{ type: 'text', text: error_response.error }],
						isError: true,
					};
				}
			},
		);
	}

	// GitHub-specific tool handler
	private async handle_github_tools(tool_name: string, args: any) {
		const provider = this.search_providers.get('github') as any;
		if (!provider) {
			return {
				content: [
					{
						type: 'text',
						text: 'GitHub search provider not available',
					},
				],
				isError: true,
			};
		}

		if (!('query' in args) || typeof args.query !== 'string') {
			return {
				content: [
					{
						type: 'text',
						text: 'Missing or invalid query parameter',
					},
				],
				isError: true,
			};
		}

		const base_params = {
			query: args.query,
			limit: typeof args.limit === 'number' ? args.limit : undefined,
		};

		try {
			let results;
			switch (tool_name) {
				case 'github_search':
					results = await provider.search_code(base_params);
					break;
				case 'github_repository_search':
					const repo_params = {
						...base_params,
						sort:
							typeof args.sort === 'string' ? args.sort : undefined,
					};
					results = await provider.search_repositories(repo_params);
					break;
				case 'github_user_search':
					results = await provider.search_users(base_params);
					break;
				default:
					return {
						content: [
							{
								type: 'text',
								text: `Unknown GitHub tool: ${tool_name}`,
							},
						],
						isError: true,
					};
			}

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(results, null, 2),
					},
				],
			};
		} catch (error) {
			const error_response = create_error_response(error as Error);
			return {
				content: [{ type: 'text', text: error_response.error }],
				isError: true,
			};
		}
	}
}

// Create singleton instance
const registry = new ToolRegistry();

export const register_tools = (server: Server) => {
	registry.setup_tool_handlers(server);
};

// Export methods to register providers
export const register_search_provider = (
	provider: SearchProvider,
	is_ai_response = false,
) => {
	registry.register_search_provider(provider, is_ai_response);
};

export const register_processing_provider = (
	provider: ProcessingProvider,
) => {
	registry.register_processing_provider(provider);
};

export const register_enhancement_provider = (
	provider: EnhancementProvider,
) => {
	registry.register_enhancement_provider(provider);
};
