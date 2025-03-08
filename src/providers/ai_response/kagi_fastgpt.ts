import { use_mcp_tool } from '@modelcontextprotocol/sdk/tools';

export const handle_kagi_fastgpt_request = async (args: { query: string }) => {
  return use_mcp_tool({
    server_name: 'mcp-kagi-search',
    tool_name: 'kagi_fastgpt',
    arguments: {
      query: args.query,
      web_search: true
    }
  });
};
