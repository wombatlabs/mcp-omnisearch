import {
	BaseSearchParams,
	SearchProvider,
	SearchResult,
} from '../../../common/types.js';
import { validate_api_key } from '../../../common/utils.js';
import { config } from '../../../config/env.js';

export interface PerplexityResponse {
	answer: string;
	context: {
		sources: Array<{
			title: string;
			url: string;
			content: string;
		}>;
		follow_up_questions?: string[];
	};
	metadata: {
		model: string;
		processing_time: number;
		token_count: number;
	};
}

export interface PerplexityOptions {
	model?: 'sonar-pro' | 'sonar' | 'sonar-reasoning' | 'r1-1776';
	max_tokens?: number;
	temperature?: number;
	include_sources?: boolean;
	include_follow_up?: boolean;
	top_p?: number;
	top_k?: number;
	presence_penalty?: number;
	frequency_penalty?: number;
}

export class PerplexityProvider implements SearchProvider {
	name = 'perplexity';
	description =
		'AI-powered response generation combining real-time web search with advanced language models. Best for complex queries requiring reasoning and synthesis across multiple sources. Features contextual memory for follow-up questions.';

	async search(params: BaseSearchParams): Promise<SearchResult[]> {
		const response = await this.get_answer(params.query, {
			include_sources: true,
			max_tokens: params.limit || 1024,
		});

		// Start with the main answer, split into paragraphs if needed
		const paragraphs = response.answer
			.split('\n\n')
			.filter((p) => p.trim());
		const results: SearchResult[] = paragraphs.map((paragraph) => ({
			title: 'Perplexity AI Response',
			url: 'https://perplexity.ai',
			snippet: paragraph.trim(),
			source_provider: this.name,
		}));

		// Add sources if available
		if (
			response.context?.sources &&
			response.context.sources.length > 0
		) {
			results.push(
				...response.context.sources.map((source) => ({
					title: source.title || 'Source',
					url: source.url || 'https://perplexity.ai',
					snippet: source.content,
					source_provider: this.name,
				})),
			);
		}

		// Filter out any results with missing required fields
		const filtered_results = results.filter(
			(result) => result.title && result.url && result.snippet,
		);

		// Respect the limit parameter
		if (params.limit && params.limit > 0) {
			return filtered_results.slice(0, params.limit);
		}

		return filtered_results;
	}

	async get_answer(
		query: string,
		options: PerplexityOptions = {},
	): Promise<PerplexityResponse> {
		const api_key = validate_api_key(
			config.ai_response.perplexity.api_key,
			this.name,
		);

		const default_options: PerplexityOptions = {
			model: 'sonar-pro',
			max_tokens: 1024,
			temperature: 0.7,
			include_sources: true,
			include_follow_up: false,
			top_p: 0.8,
			top_k: 40,
		};

		const final_options = { ...default_options, ...options };

		try {
			const response = await fetch(
				`${config.ai_response.perplexity.base_url}/chat/completions`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${api_key}`,
					},
					body: JSON.stringify({
						model: 'sonar-pro', // Use sonar-pro for best search results
						search_queries: [query], // Enable online search
						messages: [
							{
								role: 'user',
								content: query,
							},
						],
						max_tokens: final_options.max_tokens,
						temperature: final_options.temperature,
						top_p: final_options.top_p,
						top_k: final_options.top_k,
						presence_penalty: final_options.presence_penalty,
						frequency_penalty: final_options.frequency_penalty,
					}),
				},
			);

			if (!response.ok) {
				const error_data = await response.json();
				throw new Error(
					`Perplexity API error: ${
						error_data.error?.message || response.statusText
					}`,
				);
			}

			const data = await response.json();
			const answer = data.choices[0].message.content;
			const request_time = response.headers.get('x-request-time');
			const processing_time = request_time
				? (Date.now() - Number(request_time)) / 1000
				: 0;

			return {
				answer,
				context: {
					sources: [], // Citations require elevated access
					follow_up_questions: data.related_questions,
				},
				metadata: {
					model: final_options.model!,
					processing_time,
					token_count: data.usage.total_tokens,
				},
			};
		} catch (error: unknown) {
			const error_message =
				error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to get Perplexity answer: ${error_message}`,
			);
		}
	}

	async get_answer_with_context(
		query: string,
		context: string,
		options: PerplexityOptions = {},
	): Promise<PerplexityResponse> {
		const api_key = validate_api_key(
			config.ai_response.perplexity.api_key,
			this.name,
		);

		const default_options: PerplexityOptions = {
			model: 'sonar-pro',
			max_tokens: 1024,
			temperature: 0.7,
			include_sources: true,
			include_follow_up: false,
			top_p: 0.8,
			top_k: 40,
		};

		const final_options = { ...default_options, ...options };

		try {
			const response = await fetch(
				`${config.ai_response.perplexity.base_url}/chat/completions`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${api_key}`,
					},
					body: JSON.stringify({
						model: 'sonar-pro', // Use sonar-pro for best search results
						search_queries: [query], // Enable online search
						messages: [
							{
								role: 'system',
								content: context,
							},
							{
								role: 'user',
								content: query,
							},
						],
						max_tokens: final_options.max_tokens,
						temperature: final_options.temperature,
						top_p: final_options.top_p,
						top_k: final_options.top_k,
						presence_penalty: final_options.presence_penalty,
						frequency_penalty: final_options.frequency_penalty,
					}),
				},
			);

			if (!response.ok) {
				const error_data = await response.json();
				throw new Error(
					`Perplexity API error: ${
						error_data.error?.message || response.statusText
					}`,
				);
			}

			const data = await response.json();
			const answer = data.choices[0].message.content;
			const request_time = response.headers.get('x-request-time');
			const processing_time = request_time
				? (Date.now() - Number(request_time)) / 1000
				: 0;

			return {
				answer,
				context: {
					sources: [], // Citations require elevated access
					follow_up_questions: data.related_questions,
				},
				metadata: {
					model: final_options.model!,
					processing_time,
					token_count: data.usage.total_tokens,
				},
			};
		} catch (error: unknown) {
			const error_message =
				error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to get Perplexity answer with context: ${error_message}`,
			);
		}
	}
}
