import { use_mcp_tool } from '@modelcontextprotocol/sdk/tools';

export const handle_jina_grounding_request = async (args: { statement: string }) => {
  // First get relevant search results
  const searchResults = await use_mcp_tool({
    server_name: 'mcp-jinaai-search',
    tool_name: 'search',
    arguments: {
      query: args.statement,
      format: 'text',
      no_cache: false
    }
  });

  // Then use the reader to extract clean content
  return use_mcp_tool({
    server_name: 'mcp-jinaai-reader',
    tool_name: 'read_url',
    arguments: {
      url: searchResults.url, // This is a placeholder - we'll need to handle the actual search results structure
      format: 'json',
      with_generated_alt: true
    }
  });
};
