import { Server } from '@modelcontextprotocol/sdk/server';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types';
import { handle_jina_reader_request } from './jina_reader';
import { handle_kagi_summarizer_request } from './kagi_summarizer';

export const register_processing_tools = (server: Server) => {
  // Tool registration is handled in the main tools.ts file
};

export const handle_processing_request = async (name: string, args: any) => {
  switch (name) {
    case 'process_jina_reader':
      return handle_jina_reader_request(args);
    case 'process_kagi_summarizer':
      return handle_kagi_summarizer_request(args);
    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown processing tool: ${name}`
      );
  }
};
