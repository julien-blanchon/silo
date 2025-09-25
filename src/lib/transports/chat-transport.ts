import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { z } from 'zod';
import type { ChatTransport, UIMessage, UIMessageChunk, ChatRequestOptions } from 'ai';
import { dev } from '$app/environment';

// Development API key - replace with your own or use environment variables in production
const DEV_OPENAI_API_KEY = 'sk-or-...';


const openai = createOpenAI({
  apiKey: DEV_OPENAI_API_KEY,
  // Use proxy only in development mode, direct API in production
  baseURL: dev ? '/proxy/openai/v1' : undefined,
});

export class CustomChatTransport implements ChatTransport<UIMessage> {
  async sendMessages({
    trigger,
    chatId,
    messageId,
    messages,
    abortSignal,
    headers,
    body,
    metadata
  }: {
    trigger: 'submit-message' | 'regenerate-message';
    chatId: string;
    messageId: string | undefined;
    messages: UIMessage[];
    abortSignal: AbortSignal | undefined;
  } & ChatRequestOptions): Promise<ReadableStream<UIMessageChunk>> {
    
    console.log('💬 Chat Transport sendMessages called with:', { trigger, messages: messages.length });
    
    try {
      const result = streamText({
        model: openai('gpt-4o'),
        messages: convertToModelMessages(messages),
        abortSignal,
        stopWhen: stepCountIs(5), // Allow up to 5 tool steps for regular chat
        system: 'You are a helpful AI assistant. You can analyze images, answer questions, and use tools to help users.',
        tools: {
          weather: tool({
            description: 'Get the current weather in a specific location',
            inputSchema: z.object({
              location: z.string().describe('The location to get the weather for'),
            }),
            execute: async ({ location }) => {
              // Simulate API call with more realistic data
              const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'partly cloudy'];
              const condition = conditions[Math.floor(Math.random() * conditions.length)];
              const temperature = Math.round(Math.random() * (90 - 32) + 32);
              const humidity = Math.round(Math.random() * 100);
              
              return {
                location,
                temperature,
                condition,
                humidity,
                unit: 'fahrenheit'
              };
            },
          }),
          convertFahrenheitToCelsius: tool({
            description: 'Convert a temperature from fahrenheit to celsius',
            inputSchema: z.object({
              temperature: z
                .number()
                .describe('The temperature in fahrenheit to convert'),
            }),
            execute: async ({ temperature }) => {
              const celsius = Math.round((temperature - 32) * (5 / 9));
              return {
                fahrenheit: temperature,
                celsius,
              };
            },
          }),
          calculator: tool({
            description: 'Perform basic mathematical calculations',
            inputSchema: z.object({
              expression: z.string().describe('The mathematical expression to evaluate (e.g., "2 + 3 * 4")'),
            }),
            execute: async ({ expression }) => {
              try {
                // Simple safe evaluation for basic math
                const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
                const result = Function('"use strict"; return (' + sanitized + ')')();
                return {
                  expression,
                  result: Number(result),
                };
              } catch (error) {
                return {
                  expression,
                  error: 'Invalid mathematical expression',
                };
              }
            },
          }),
          getCurrentTime: tool({
            description: 'Get the current date and time',
            inputSchema: z.object({
              timezone: z.string().optional().describe('Optional timezone (e.g., "America/New_York")'),
            }),
            execute: async ({ timezone }) => {
              const now = new Date();
              const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short',
              };
              
              if (timezone) {
                options.timeZone = timezone;
              }
              
              return {
                timestamp: now.toISOString(),
                formatted: now.toLocaleString('en-US', options),
                timezone: timezone || 'local',
              };
            },
          }),
        },
      });

      // Return the UI message stream directly
      return result.toUIMessageStream();
    } catch (error) {
      console.error('💬 Chat Transport error:', error);
      throw error;
    }
  }

  async reconnectToStream({
    chatId,
    headers,
    body,
    metadata
  }: {
    chatId: string;
  } & ChatRequestOptions): Promise<ReadableStream<UIMessageChunk> | null> {
    console.log('💬 Chat Transport reconnectToStream called for chatId:', chatId);
    // For this implementation, we don't support reconnection
    return null;
  }
}
