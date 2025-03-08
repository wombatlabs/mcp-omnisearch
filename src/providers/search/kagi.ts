import { use_mcp_tool } from '@modelcontextprotocol/sdk/tools';

interface KagiSearchArgs {
  query: string;
  language?: string;
  no_cache?: boolean;
}

export const handle_kagi_request = async (args: KagiSearchArgs) => {
  return use_mcp_tool({
    server_name: 'mcp-kagi-search',
    tool_name: 'search',
    arguments: {
      query: args.query,
      language: args.language,
      no_cache: args.no_cache
    }
  });
};
