import { use_mcp_tool } from '@modelcontextprotocol/sdk/tools';

export const handle_perplexity_request = async (args: { query: string }) => {
  return use_mcp_tool({
    server_name: 'mcp-perplexity-search',
    tool_name: 'chat_completion',
    arguments: {
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant focused on providing accurate information.'
        },
        {
          role: 'user',
          content: args.query
        }
      ],
      format: 'text'
    }
  });
};
