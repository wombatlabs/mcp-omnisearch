import { use_mcp_tool } from '@modelcontextprotocol/sdk/tools';

export const handle_jina_reader_request = async (args: { url: string }) => {
  return use_mcp_tool({
    server_name: 'mcp-jinaai-reader',
    tool_name: 'read_url',
    arguments: {
      url: args.url,
      format: 'json',
      with_generated_alt: true,
      with_links_summary: true
    }
  });
};
