/**
 * Schema generator utility for MCP tool registration
 * Generates standardized tool schemas programmatically to eliminate duplication
 */

// Tool interface matching the MCP SDK structure
interface Tool {
	name: string;
	description: string;
	inputSchema: {
		type: 'object';
		properties: Record<string, any>;
		required: string[];
	};
}

/**
 * Common property definitions used across multiple tool types
 */
const common_properties = {
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
		description: 'List of domains to include in search results',
	},
	exclude_domains: {
		type: 'array',
		items: { type: 'string' },
		description: 'List of domains to exclude from search results',
	},
	url: {
		oneOf: [
			{
				type: 'string',
				description: 'Single URL to process',
			},
			{
				type: 'array',
				items: { type: 'string' },
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
	content: {
		type: 'string',
		description: 'Content to enhance',
	},
	sort: {
		type: 'string',
		enum: ['stars', 'forks', 'updated'],
		description: 'Sorts the results of a search.',
	},
} as const;

/**
 * Generate schema for standard search providers
 */
export function generate_search_provider_schema(
	provider_name: string,
	description: string,
	additional_properties: Record<string, any> = {},
): Tool {
	const properties = {
		query: common_properties.query,
		limit: common_properties.limit,
		include_domains: common_properties.include_domains,
		exclude_domains: common_properties.exclude_domains,
		...additional_properties,
	};

	return {
		name: `${provider_name}_search`,
		description,
		inputSchema: {
			type: 'object',
			properties,
			required: ['query'],
		},
	};
}

/**
 * Generate schema for GitHub-specific tools
 */
export function generate_github_tool_schemas(): Tool[] {
	return [
		{
			name: 'github_search',
			description:
				'Search for code on GitHub. This is ideal for finding code examples, tracking down function definitions, or locating files with specific names or paths. Supports advanced query syntax with qualifiers like `filename:`, `path:`, `repo:`, `user:`, `language:`, and `in:file`. For example, to find a file named `settings.json` in a `.claude` directory, you could use the query: `filename:settings.json path:.claude`',
			inputSchema: {
				type: 'object',
				properties: {
					query: common_properties.query,
					limit: common_properties.limit,
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
					query: common_properties.query,
					limit: common_properties.limit,
					sort: common_properties.sort,
				},
				required: ['query'],
			},
		},
		{
			name: 'github_user_search',
			description: 'Search for users and organizations on GitHub',
			inputSchema: {
				type: 'object',
				properties: {
					query: common_properties.query,
					limit: common_properties.limit,
				},
				required: ['query'],
			},
		},
	];
}

/**
 * Generate schema for processing providers
 */
export function generate_processing_provider_schema(
	provider_name: string,
	description: string,
): Tool {
	return {
		name: `${provider_name}_process`,
		description,
		inputSchema: {
			type: 'object',
			properties: {
				url: common_properties.url,
				extract_depth: common_properties.extract_depth,
			},
			required: ['url'],
		},
	};
}

/**
 * Generate schema for enhancement providers
 */
export function generate_enhancement_provider_schema(
	provider_name: string,
	description: string,
): Tool {
	return {
		name: `${provider_name}_enhance`,
		description,
		inputSchema: {
			type: 'object',
			properties: {
				content: common_properties.content,
			},
			required: ['content'],
		},
	};
}

/**
 * Validate required parameters for search operations
 */
export function validate_search_parameters(args: any): {
	isValid: boolean;
	error?: string;
	params?: {
		query: string;
		limit?: number;
		include_domains?: string[];
		exclude_domains?: string[];
	};
} {
	if (!args || typeof args !== 'object') {
		return { isValid: false, error: 'Missing or invalid arguments' };
	}

	if (!('query' in args) || typeof args.query !== 'string') {
		return {
			isValid: false,
			error: 'Missing or invalid query parameter',
		};
	}

	const params = {
		query: args.query,
		limit: typeof args.limit === 'number' ? args.limit : undefined,
		include_domains: Array.isArray(args.include_domains)
			? args.include_domains
			: undefined,
		exclude_domains: Array.isArray(args.exclude_domains)
			? args.exclude_domains
			: undefined,
	};

	return { isValid: true, params };
}

/**
 * Validate required parameters for processing operations
 */
export function validate_processing_parameters(args: any): {
	isValid: boolean;
	error?: string;
	params?: {
		url: string | string[];
		extract_depth?: 'basic' | 'advanced';
	};
} {
	if (!args || typeof args !== 'object') {
		return { isValid: false, error: 'Missing or invalid arguments' };
	}

	if (
		!('url' in args) ||
		(typeof args.url !== 'string' && !Array.isArray(args.url))
	) {
		return {
			isValid: false,
			error: 'Missing or invalid URL parameter',
		};
	}

	const params = {
		url: args.url,
		extract_depth:
			(args.extract_depth as 'basic' | 'advanced') || 'basic',
	};

	return { isValid: true, params };
}

/**
 * Validate required parameters for enhancement operations
 */
export function validate_enhancement_parameters(args: any): {
	isValid: boolean;
	error?: string;
	params?: {
		content: string;
	};
} {
	if (!args || typeof args !== 'object') {
		return { isValid: false, error: 'Missing or invalid arguments' };
	}

	if (!('content' in args) || typeof args.content !== 'string') {
		return {
			isValid: false,
			error: 'Missing or invalid content parameter',
		};
	}

	return { isValid: true, params: { content: args.content } };
}

/**
 * Validate required parameters for GitHub-specific operations
 */
export function validate_github_parameters(args: any): {
	isValid: boolean;
	error?: string;
	params?: {
		query: string;
		limit?: number;
		sort?: string;
	};
} {
	if (!args || typeof args !== 'object') {
		return { isValid: false, error: 'Missing or invalid arguments' };
	}

	if (!('query' in args) || typeof args.query !== 'string') {
		return {
			isValid: false,
			error: 'Missing or invalid query parameter',
		};
	}

	const params = {
		query: args.query,
		limit: typeof args.limit === 'number' ? args.limit : undefined,
		sort: typeof args.sort === 'string' ? args.sort : undefined,
	};

	return { isValid: true, params };
}

/**
 * Generate standard error response
 */
export function generate_error_response(message: string) {
	return {
		content: [{ type: 'text', text: message }],
		isError: true,
	};
}

/**
 * Generate standard success response
 */
export function generate_success_response(data: any) {
	return {
		content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
	};
}
