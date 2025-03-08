import { Server } from '@modelcontextprotocol/sdk/server';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types';
import { handle_perplexity_request } from './perplexity';
import { handle_kagi_fastgpt_request } from './kagi_fastgpt';

export const register_ai_response_tools = (server: Server) => {
  // Tool registration is handled in the main tools.ts file
};

export const handle_ai_response_request = async (name: string, args: any) => {
  switch (name) {
    case 'ai_perplexity':
      return handle_perplexity_request(args);
    case 'ai_kagi_fastgpt':
      return handle_kagi_fastgpt_request(args);
    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown AI response tool: ${name}`
      );
  }
};
