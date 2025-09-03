import {
	ErrorType,
	ProcessingProvider,
	ProcessingResult,
	ProviderError,
} from '../../../common/types.js';
import {
	handle_rate_limit,
	retry_with_backoff,
	validate_api_key,
} from '../../../common/utils.js';
import { config } from '../../../config/env.js';

interface ExaResearchRequest {
	instructions: string;
}

interface ExaResearchTaskResponse {
	taskId: string;
	status: 'created' | 'processing' | 'completed' | 'failed';
	message?: string;
}

interface ExaResearchStatusResponse {
	taskId: string;
	status: 'created' | 'processing' | 'completed' | 'failed';
	result?: {
		report: string;
		sources: Array<{
			title: string;
			url: string;
			text?: string;
			publishedDate?: string;
			author?: string;
		}>;
	};
	message?: string;
}

export class ExaResearchProvider implements ProcessingProvider {
	name = 'exa_research';
	description =
		'Create asynchronous research task using Exa Research API';

	async process_content(
		instructions: string | string[],
		extract_depth: 'basic' | 'advanced' = 'basic',
	): Promise<ProcessingResult> {
		const api_key = validate_api_key(
			config.processing.exa_research.api_key,
			this.name,
		);

		const research_instructions = Array.isArray(instructions)
			? instructions.join(' ')
			: instructions;

		if (!research_instructions.trim()) {
			throw new ProviderError(
				ErrorType.INVALID_INPUT,
				'Research instructions must be provided',
				this.name,
			);
		}

		const process_request = async () => {
			try {
				// Step 1: Create research task
				const create_response = await fetch(
					`${config.processing.exa_research.base_url}/research/v0/tasks`,
					{
						method: 'POST',
						headers: {
							'x-api-key': api_key,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							instructions: research_instructions,
						} as ExaResearchRequest),
					},
				);

				if (!create_response.ok) {
					const error_text = await create_response.text();
					switch (create_response.status) {
						case 401:
							throw new ProviderError(
								ErrorType.API_ERROR,
								'Invalid API key',
								this.name,
							);
						case 403:
							throw new ProviderError(
								ErrorType.API_ERROR,
								'API key does not have access to research endpoint',
								this.name,
							);
						case 429:
							handle_rate_limit(this.name);
							throw new ProviderError(
								ErrorType.RATE_LIMIT,
								'Rate limit exceeded',
								this.name,
							);
						default:
							throw new ProviderError(
								ErrorType.API_ERROR,
								`Failed to create research task: ${error_text}`,
								this.name,
							);
					}
				}

				const task_data =
					(await create_response.json()) as ExaResearchTaskResponse;
				const taskId = task_data.taskId;

				// Step 2: Poll for completion
				let attempts = 0;
				const max_attempts = extract_depth === 'advanced' ? 40 : 20; // Wait up to 2-4 minutes
				const poll_interval = 3000; // 3 seconds

				while (attempts < max_attempts) {
					await new Promise((resolve) =>
						setTimeout(resolve, poll_interval),
					);
					attempts++;

					const status_response = await fetch(
						`${config.processing.exa_research.base_url}/research/v0/tasks/${taskId}`,
						{
							method: 'GET',
							headers: {
								'x-api-key': api_key,
							},
						},
					);

					if (!status_response.ok) {
						throw new ProviderError(
							ErrorType.API_ERROR,
							`Failed to check research status: ${status_response.statusText}`,
							this.name,
						);
					}

					const status_data =
						(await status_response.json()) as ExaResearchStatusResponse;

					if (
						status_data.status === 'completed' &&
						status_data.result
					) {
						const result = status_data.result;
						const raw_contents: Array<{
							url: string;
							content: string;
						}> = [];

						// Process sources
						for (const source of result.sources || []) {
							raw_contents.push({
								url: source.url,
								content: source.text || 'Source reference',
							});
						}

						// Create comprehensive report
						let combined_content = `# Research Report\n\n`;
						combined_content += `**Research Instructions:** ${research_instructions}\n\n`;
						combined_content += `**Task ID:** ${taskId}\n\n`;
						combined_content += `## Report\n\n${result.report}\n\n`;

						if (result.sources && result.sources.length > 0) {
							combined_content += `## Sources\n\n`;
							for (const source of result.sources) {
								combined_content += `### ${source.title}\n`;
								if (source.author) {
									combined_content += `**Author:** ${source.author}\n`;
								}
								if (source.publishedDate) {
									combined_content += `**Published:** ${source.publishedDate}\n`;
								}
								combined_content += `**URL:** ${source.url}\n\n`;
								if (source.text) {
									combined_content += `${source.text.substring(
										0,
										300,
									)}${source.text.length > 300 ? '...' : ''}\n\n`;
								}
								combined_content += '---\n\n';
							}
						}

						const word_count = result.report.split(/\s+/).length;

						return {
							content: combined_content,
							raw_contents,
							metadata: {
								title: `Research Report: ${research_instructions.substring(
									0,
									50,
								)}...`,
								word_count,
								urls_processed: result.sources?.length || 0,
								successful_extractions: result.sources?.length || 0,
								extract_depth,
								task_id: taskId,
								research_instructions: research_instructions,
							},
							source_provider: this.name,
						};
					} else if (status_data.status === 'failed') {
						throw new ProviderError(
							ErrorType.PROVIDER_ERROR,
							`Research task failed: ${
								status_data.message || 'Unknown error'
							}`,
							this.name,
						);
					}

					// Task still processing, continue polling
				}

				// Timeout reached
				throw new ProviderError(
					ErrorType.PROVIDER_ERROR,
					`Research task timed out after ${
						(max_attempts * poll_interval) / 1000
					} seconds`,
					this.name,
				);
			} catch (error) {
				if (error instanceof ProviderError) {
					throw error;
				}
				throw new ProviderError(
					ErrorType.API_ERROR,
					`Failed to complete research: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`,
					this.name,
				);
			}
		};

		return retry_with_backoff(process_request);
	}
}
