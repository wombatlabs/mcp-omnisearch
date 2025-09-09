import { McpServer } from 'tmcp';
import type { GenericSchema } from 'valibot';
import * as v from 'valibot';
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

	setup_tool_handlers(server: McpServer<GenericSchema>) {
		// Register standard search providers
		this.search_providers.forEach((provider) => {
			if (provider.name !== 'github') {
				server.tool(
					{
						name: `${provider.name}_search`,
						description: provider.description,
						schema: v.object({
							query: v.pipe(
								v.string(),
								v.description('Search query'),
							),
							limit: v.optional(
								v.pipe(
									v.number(),
									v.description(
										'Maximum number of results to return',
									),
								),
							),
							include_domains: v.optional(
								v.pipe(
									v.array(v.string()),
									v.description(
										'List of domains to include in search results',
									),
								),
							),
							exclude_domains: v.optional(
								v.pipe(
									v.array(v.string()),
									v.description(
										'List of domains to exclude from search results',
									),
								),
							),
						}),
					},
					async ({
						query,
						limit,
						include_domains,
						exclude_domains,
					}) => {
						try {
							const search_params: BaseSearchParams = {
								query,
								limit,
								include_domains,
								exclude_domains,
							};

							const results = await provider.search(search_params);
							return {
								content: [
									{
										type: 'text' as const,
										text: JSON.stringify(results, null, 2),
									},
								],
							};
						} catch (error) {
							const error_response = create_error_response(
								error as Error,
							);
							return {
								content: [
									{
										type: 'text' as const,
										text: error_response.error,
									},
								],
								isError: true,
							};
						}
					},
				);
			}
		});

		// Register GitHub tools if available
		const githubProvider = this.search_providers.get('github') as any;
		if (githubProvider) {
			// GitHub Search Tool
			server.tool(
				{
					name: 'github_search',
					description:
						'Search for code on GitHub. This is ideal for finding code examples, tracking down function definitions, or locating files with specific names or paths. Supports advanced query syntax with qualifiers like `filename:`, `path:`, `repo:`, `user:`, `language:`, and `in:file`. For example, to find a file named `settings.json` in a `.claude` directory, you could use the query: `filename:settings.json path:.claude`',
					schema: v.object({
						query: v.pipe(v.string(), v.description('Search query')),
						limit: v.optional(
							v.pipe(
								v.number(),
								v.description('Maximum number of results to return'),
							),
						),
					}),
				},
				async ({ query, limit }) => {
					try {
						const results = await githubProvider.search_code({
							query,
							limit,
						});
						return {
							content: [
								{
									type: 'text' as const,
									text: JSON.stringify(results, null, 2),
								},
							],
						};
					} catch (error) {
						const error_response = create_error_response(
							error as Error,
						);
						return {
							content: [
								{
									type: 'text' as const,
									text: error_response.error,
								},
							],
							isError: true,
						};
					}
				},
			);

			// GitHub Repository Search Tool
			server.tool(
				{
					name: 'github_repository_search',
					description: 'Search for repositories on GitHub',
					schema: v.object({
						query: v.pipe(v.string(), v.description('Search query')),
						limit: v.optional(
							v.pipe(
								v.number(),
								v.description('Maximum number of results to return'),
							),
						),
						sort: v.optional(
							v.pipe(
								v.union([
									v.literal('stars'),
									v.literal('forks'),
									v.literal('updated'),
								]),
								v.description('Sort order for results'),
							),
						),
					}),
				},
				async ({ query, limit, sort }) => {
					try {
						const results = await githubProvider.search_repositories({
							query,
							limit,
							sort,
						});
						return {
							content: [
								{
									type: 'text' as const,
									text: JSON.stringify(results, null, 2),
								},
							],
						};
					} catch (error) {
						const error_response = create_error_response(
							error as Error,
						);
						return {
							content: [
								{
									type: 'text' as const,
									text: error_response.error,
								},
							],
							isError: true,
						};
					}
				},
			);

			// GitHub User Search Tool
			server.tool(
				{
					name: 'github_user_search',
					description: 'Search for users and organizations on GitHub',
					schema: v.object({
						query: v.pipe(v.string(), v.description('Search query')),
						limit: v.optional(
							v.pipe(
								v.number(),
								v.description('Maximum number of results to return'),
							),
						),
					}),
				},
				async ({ query, limit }) => {
					try {
						const results = await githubProvider.search_users({
							query,
							limit,
						});
						return {
							content: [
								{
									type: 'text' as const,
									text: JSON.stringify(results, null, 2),
								},
							],
						};
					} catch (error) {
						const error_response = create_error_response(
							error as Error,
						);
						return {
							content: [
								{
									type: 'text' as const,
									text: error_response.error,
								},
							],
							isError: true,
						};
					}
				},
			);
		}

		// Register processing providers
		this.processing_providers.forEach((provider) => {
			server.tool(
				{
					name: `${provider.name}_process`,
					description: provider.description,
					schema: v.object({
						url: v.pipe(
							v.union([v.string(), v.array(v.string())]),
							v.description('Single URL or array of URLs to process'),
						),
						extract_depth: v.optional(
							v.pipe(
								v.union([v.literal('basic'), v.literal('advanced')]),
								v.description(
									'The depth of the extraction process. "advanced" retrieves more data but costs more credits.',
								),
							),
						),
					}),
				},
				async ({ url, extract_depth }) => {
					try {
						const result = await provider.process_content(
							url,
							extract_depth,
						);
						return {
							content: [
								{
									type: 'text' as const,
									text: JSON.stringify(result, null, 2),
								},
							],
						};
					} catch (error) {
						const error_response = create_error_response(
							error as Error,
						);
						return {
							content: [
								{
									type: 'text' as const,
									text: error_response.error,
								},
							],
							isError: true,
						};
					}
				},
			);
		});

		// Register enhancement providers
		this.enhancement_providers.forEach((provider) => {
			server.tool(
				{
					name: `${provider.name}_enhance`,
					description: provider.description,
					schema: v.object({
						content: v.pipe(
							v.string(),
							v.description('Content to enhance'),
						),
					}),
				},
				async ({ content }) => {
					try {
						const result = await provider.enhance_content(content);
						return {
							content: [
								{
									type: 'text' as const,
									text: JSON.stringify(result, null, 2),
								},
							],
						};
					} catch (error) {
						const error_response = create_error_response(
							error as Error,
						);
						return {
							content: [
								{
									type: 'text' as const,
									text: error_response.error,
								},
							],
							isError: true,
						};
					}
				},
			);
		});
	}
}

// Create singleton instance
const registry = new ToolRegistry();

export const register_tools = (server: McpServer<GenericSchema>) => {
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
