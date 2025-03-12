# mcp-omnisearch

A Model Context Protocol (MCP) server that provides unified access to
multiple search providers and AI tools. This server combines the
capabilities of Tavily, Perplexity, Kagi, Jina AI, and Brave to offer
comprehensive search, AI responses, content processing, and
enhancement features through a single interface.

<a href="https://glama.ai/mcp/servers/gz5wgmptd8">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/gz5wgmptd8/badge" alt="Glama badge" />
</a>

## Features

### 🔍 Search Tools

- **Tavily Search**: Optimized for factual information with strong
  citation support
- **Brave Search**: Privacy-focused search with good technical content
  coverage
- **Kagi Search**: High-quality search results with minimal
  advertising influence, focused on authoritative sources

### 🤖 AI Response Tools

- **Perplexity AI**: Advanced response generation combining real-time
  web search with GPT-4 Omni and Claude 3
- **Kagi FastGPT**: Quick AI-generated answers with citations (900ms
  typical response time)

### 📄 Content Processing Tools

- **Jina AI Reader**: Clean content extraction with image captioning
  and PDF support
- **Kagi Universal Summarizer**: Content summarization for pages,
  videos, and podcasts

### 🔄 Enhancement Tools

- **Kagi Enrichment API**: Supplementary content from specialized
  indexes (Teclis, TinyGem)
- **Jina AI Grounding**: Real-time fact verification against web
  knowledge

## Flexible API Key Requirements

MCP Omnisearch is designed to work with the API keys you have
available. You don't need to have keys for all providers - the server
will automatically detect which API keys are available and only enable
those providers.

For example:

- If you only have a Tavily and Perplexity API key, only those
  providers will be available
- If you don't have a Kagi API key, Kagi-based services won't be
  available, but all other providers will work normally
- The server will log which providers are available based on the API
  keys you've configured

This flexibility makes it easy to get started with just one or two
providers and add more as needed.

## Configuration

This server requires configuration through your MCP client. Here are
examples for different environments:

### Cline Configuration

Add this to your Cline MCP settings:

```json
{
	"mcpServers": {
		"mcp-omnisearch": {
			"command": "node",
			"args": ["/path/to/mcp-omnisearch/dist/index.js"],
			"env": {
				"TAVILY_API_KEY": "your-tavily-key",
				"PERPLEXITY_API_KEY": "your-perplexity-key",
				"KAGI_API_KEY": "your-kagi-key",
				"JINA_AI_API_KEY": "your-jina-key",
				"BRAVE_API_KEY": "your-brave-key"
			},
			"disabled": false,
			"autoApprove": []
		}
	}
}
```

### Claude Desktop with WSL Configuration

For WSL environments, add this to your Claude Desktop configuration:

```json
{
	"mcpServers": {
		"mcp-omnisearch": {
			"command": "wsl.exe",
			"args": [
				"bash",
				"-c",
				"TAVILY_API_KEY=key1 PERPLEXITY_API_KEY=key2 KAGI_API_KEY=key3 JINA_AI_API_KEY=key4 BRAVE_API_KEY=key5 node /path/to/mcp-omnisearch/dist/index.js"
			]
		}
	}
}
```

### Environment Variables

The server uses API keys for each provider. **You don't need keys for
all providers** - only the providers corresponding to your available
API keys will be activated:

- `TAVILY_API_KEY`: For Tavily Search
- `PERPLEXITY_API_KEY`: For Perplexity AI
- `KAGI_API_KEY`: For Kagi services (FastGPT, Summarizer, Enrichment)
- `JINA_AI_API_KEY`: For Jina AI services (Reader, Grounding)
- `BRAVE_API_KEY`: For Brave Search

You can start with just one or two API keys and add more later as
needed. The server will log which providers are available on startup.

## API

The server implements MCP Tools organized by category:

### Search Tools

#### search_tavily

Search the web using Tavily Search API. Best for factual queries
requiring reliable sources and citations.

Parameters:

- `query` (string, required): Search query

Example:

```json
{
	"query": "latest developments in quantum computing"
}
```

#### search_brave

Privacy-focused web search with good coverage of technical topics.

Parameters:

- `query` (string, required): Search query

Example:

```json
{
	"query": "rust programming language features"
}
```

#### search_kagi

High-quality search results with minimal advertising influence. Best
for finding authoritative sources and research materials.

Parameters:

- `query` (string, required): Search query
- `language` (string, optional): Language filter (e.g., "en")
- `no_cache` (boolean, optional): Bypass cache for fresh results

Example:

```json
{
	"query": "latest research in machine learning",
	"language": "en"
}
```

### AI Response Tools

#### ai_perplexity

AI-powered response generation with real-time web search integration.

Parameters:

- `query` (string, required): Question or topic for AI response

Example:

```json
{
	"query": "Explain the differences between REST and GraphQL"
}
```

#### ai_kagi_fastgpt

Quick AI-generated answers with citations.

Parameters:

- `query` (string, required): Question for quick AI response

Example:

```json
{
	"query": "What are the main features of TypeScript?"
}
```

### Content Processing Tools

#### process_jina_reader

Convert URLs to clean, LLM-friendly text with image captioning.

Parameters:

- `url` (string, required): URL to process

Example:

```json
{
	"url": "https://example.com/article"
}
```

#### process_kagi_summarizer

Summarize content from URLs.

Parameters:

- `url` (string, required): URL to summarize

Example:

```json
{
	"url": "https://example.com/long-article"
}
```

### Enhancement Tools

#### enhance_kagi_enrichment

Get supplementary content from specialized indexes.

Parameters:

- `query` (string, required): Query for enrichment

Example:

```json
{
	"query": "emerging web technologies"
}
```

#### enhance_jina_grounding

Verify statements against web knowledge.

Parameters:

- `statement` (string, required): Statement to verify

Example:

```json
{
	"statement": "TypeScript adds static typing to JavaScript"
}
```

## Development

### Setup

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Build the project:

```bash
pnpm run build
```

4. Run in development mode:

```bash
pnpm run dev
```

### Publishing

1. Update version in package.json
2. Build the project:

```bash
pnpm run build
```

3. Publish to npm:

```bash
pnpm publish
```

## Troubleshooting

### API Keys and Access

Each provider requires its own API key and may have different access
requirements:

- **Tavily**: Requires an API key from their developer portal
- **Perplexity**: API access through their developer program
- **Kagi**: Some features limited to Business (Team) plan users
- **Jina AI**: API key required for all services
- **Brave**: API key from their developer portal

### Rate Limits

Each provider has its own rate limits. The server will handle rate
limit errors gracefully and return appropriate error messages.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built on:

- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Tavily Search](https://tavily.com)
- [Perplexity AI](https://perplexity.ai)
- [Kagi Search](https://kagi.com)
- [Jina AI](https://jina.ai)
- [Brave Search](https://search.brave.com)
