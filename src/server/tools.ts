import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
	EnhancementProvider,
	ProcessingProvider,
	SearchProvider,
} from '../common/types.js';
import { create_error_response } from '../common/utils.js';
import {
	generate_enhancement_provider_schema,
	generate_error_response,
	generate_github_tool_schemas,
	generate_processing_provider_schema,
	generate_search_provider_schema,
	generate_success_response,
	validate_enhancement_parameters,
	validate_github_parameters,
	validate_processing_parameters,
	validate_search_parameters,
} from './schema-generator.js';

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
		// Register tool list handler using schema generator
		server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: [
				// Standard search providers (excluding GitHub)
				...Array.from(this.search_providers.values())
					.filter((provider) => provider.name !== 'github')
					.map((provider) =>
						generate_search_provider_schema(
							provider.name,
							provider.description,
						),
					),
				// GitHub-specific search tools
				...(this.search_providers.has('github')
					? generate_github_tool_schemas()
					: []),
				// Processing providers
				...Array.from(this.processing_providers.values()).map(
					(provider) =>
						generate_processing_provider_schema(
							provider.name,
							provider.description,
						),
				),
				// Enhancement providers
				...Array.from(this.enhancement_providers.values()).map(
					(provider) =>
						generate_enhancement_provider_schema(
							provider.name,
							provider.description,
						),
				),
			],
		}));

		// Register tool call handler with standardized validation
		server.setRequestHandler(
			CallToolRequestSchema,
			async (request) => {
				try {
					const tool_name = request.params.name;
					const args = request.params.arguments;

					// Handle GitHub-specific tools
					if (tool_name.startsWith('github_')) {
						return this.handle_github_tools(tool_name, args);
					}

					// Parse tool name to determine action and provider
					const parts = tool_name.split('_');
					const action = parts.pop()!;
					const provider_name = parts.join('_');

					return await this.handle_generic_tool(
						action,
						provider_name,
						args,
					);
				} catch (error) {
					const error_response = create_error_response(
						error as Error,
					);
					return generate_error_response(error_response.error);
				}
			},
		);
	}

	// Generic tool handler for search, process, and enhance actions
	private async handle_generic_tool(
		action: string,
		provider_name: string,
		args: any,
	) {
		switch (action) {
			case 'search':
				return this.handle_search_tool(provider_name, args);
			case 'process':
				return this.handle_processing_tool(provider_name, args);
			case 'enhance':
				return this.handle_enhancement_tool(provider_name, args);
			default:
				return generate_error_response(`Unknown action: ${action}`);
		}
	}

	// Handle search tool execution
	private async handle_search_tool(provider_name: string, args: any) {
		const provider = this.search_providers.get(provider_name);
		if (!provider) {
			return generate_error_response(
				`Unknown search provider: ${provider_name}`,
			);
		}

		const validation = validate_search_parameters(args);
		if (!validation.isValid) {
			return generate_error_response(validation.error!);
		}

		const results = await provider.search(validation.params!);
		return generate_success_response(results);
	}

	// Handle processing tool execution
	private async handle_processing_tool(
		provider_name: string,
		args: any,
	) {
		const provider = this.processing_providers.get(provider_name);
		if (!provider) {
			return generate_error_response(
				`Unknown processing provider: ${provider_name}`,
			);
		}

		const validation = validate_processing_parameters(args);
		if (!validation.isValid) {
			return generate_error_response(validation.error!);
		}

		const result = await provider.process_content(
			validation.params!.url,
			validation.params!.extract_depth,
		);
		return generate_success_response(result);
	}

	// Handle enhancement tool execution
	private async handle_enhancement_tool(
		provider_name: string,
		args: any,
	) {
		const provider = this.enhancement_providers.get(provider_name);
		if (!provider) {
			return generate_error_response(
				`Unknown enhancement provider: ${provider_name}`,
			);
		}

		const validation = validate_enhancement_parameters(args);
		if (!validation.isValid) {
			return generate_error_response(validation.error!);
		}

		const result = await provider.enhance_content(
			validation.params!.content,
		);
		return generate_success_response(result);
	}

	// GitHub-specific tool handler
	private async handle_github_tools(tool_name: string, args: any) {
		const provider = this.search_providers.get('github') as any;
		if (!provider) {
			return generate_error_response(
				'GitHub search provider not available',
			);
		}

		const validation = validate_github_parameters(args);
		if (!validation.isValid) {
			return generate_error_response(validation.error!);
		}

		try {
			let results;
			const { query, limit, sort } = validation.params!;

			switch (tool_name) {
				case 'github_search':
					results = await provider.search_code({ query, limit });
					break;
				case 'github_repository_search':
					results = await provider.search_repositories({
						query,
						limit,
						sort,
					});
					break;
				case 'github_user_search':
					results = await provider.search_users({ query, limit });
					break;
				default:
					return generate_error_response(
						`Unknown GitHub tool: ${tool_name}`,
					);
			}

			return generate_success_response(results);
		} catch (error) {
			const error_response = create_error_response(error as Error);
			return generate_error_response(error_response.error);
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
