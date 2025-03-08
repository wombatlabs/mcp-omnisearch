import { Server } from '@modelcontextprotocol/sdk/server';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types';

// Import provider tools
import { register_search_tools } from '../providers/search';
import { register_ai_response_tools } from '../providers/ai_response';
import { register_processing_tools } from '../providers/processing';
import { register_enhancement_tools } from '../providers/enhancement';

export const register_tools = (server: Server) => {
  // Register all provider tools
  register_search_tools(server);
  register_ai_response_tools(server);
  register_processing_tools(server);
  register_enhancement_tools(server);

  // Set up tool listing handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      // Search Tools
      {
        name: 'search_tavily',
        description: 'Search the web using Tavily Search API. Best for factual queries requiring reliable sources and citations. Provides high-quality results for technical, scientific, and academic topics.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'search_brave',
        description: 'Privacy-focused web search with good coverage of technical topics. Uses Brave Search API for results without tracking or profiling.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'search_kagi',
        description: 'High-quality search results with minimal advertising influence. Best for finding authoritative sources and research materials.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            },
            language: {
              type: 'string',
              description: 'Language filter (e.g., "en")'
            },
            no_cache: {
              type: 'boolean',
              description: 'Bypass cache for fresh results'
            }
          },
          required: ['query']
        }
      },

      // AI Response Tools
      {
        name: 'ai_perplexity',
        description: 'AI-powered response generation combining real-time web search with advanced language models (GPT-4 Omni, Claude 3). Best for complex queries requiring reasoning and synthesis across multiple sources. Features contextual memory for follow-up questions.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Question or topic for AI response'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'ai_kagi_fastgpt',
        description: 'Quick AI-generated answers with citations, optimized for rapid response (900ms typical start time). Runs full search underneath for enriched answers.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Question for quick AI response'
            }
          },
          required: ['query']
        }
      },

      // Content Processing Tools
      {
        name: 'process_jina_reader',
        description: 'Converts any URL to clean, LLM-friendly text. Features automatic image captioning and native PDF support. Optimized for high-quality content extraction from complex web pages.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to process'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'process_kagi_summarizer',
        description: 'Instantly summarizes content of any type and length from URLs. Supports pages, videos, and podcasts with transcripts.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to summarize'
            }
          },
          required: ['url']
        }
      },

      // Enhancement Tools
      {
        name: 'enhance_kagi_enrichment',
        description: 'Provides supplementary content from specialized indexes (Teclis for web, TinyGem for news). Ideal for discovering non-mainstream results.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Query for enrichment'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'enhance_jina_grounding',
        description: 'Real-time fact verification against web knowledge. Reduces hallucinations and improves content integrity through statement verification.',
        inputSchema: {
          type: 'object',
          properties: {
            statement: {
              type: 'string',
              description: 'Statement to verify'
            }
          },
          required: ['statement']
        }
      }
    ]
  }));
};
