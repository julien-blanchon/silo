import type { UIMessage, LanguageModelUsage, UIDataTypes } from 'ai';
import type { UITools } from '../tools';

// Custom metadata type for usage tracking
export type ComputerUsageMetadata = {
  stepUsage?: LanguageModelUsage;
  cumulativeUsage?: LanguageModelUsage;
};

// Custom UIMessage type with usage metadata
export type ComputerUIMessage = UIMessage<ComputerUsageMetadata, UIDataTypes, UITools>;
