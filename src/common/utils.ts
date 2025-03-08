import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types';
import { ProviderResponse } from './types';

export const create_error_response = (message: string): ProviderResponse => ({
  content: [
    {
      type: 'text',
      text: message
    }
  ],
  isError: true
});

export const handle_provider_error = (error: unknown): ProviderResponse => {
  if (error instanceof McpError) {
    return create_error_response(error.message);
  }
  
  if (error instanceof Error) {
    return create_error_response(error.message);
  }
  
  return create_error_response('An unknown error occurred');
};

export const create_success_response = (text: string): ProviderResponse => ({
  content: [
    {
      type: 'text',
      text
    }
  ]
});
