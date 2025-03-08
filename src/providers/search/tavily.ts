import { use_mcp_tool } from '@modelcontextprotocol/sdk/tools';

export const handle_tavily_request = async (args: { query: string }) => {
  return use_mcp_tool({
    server_name: 'mcp-tavily-search',
    tool_name: 'search',
    arguments: {
      query: args.query
    }
  });
};
