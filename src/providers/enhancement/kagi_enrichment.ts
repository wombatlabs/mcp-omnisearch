import { use_mcp_tool } from '@modelcontextprotocol/sdk/tools';

export const handle_kagi_enrichment_request = async (args: { query: string }) => {
  return use_mcp_tool({
    server_name: 'mcp-kagi-search',
    tool_name: 'search',
    arguments: {
      query: args.query,
      language: 'en',
      no_cache: false
    }
  });
};
