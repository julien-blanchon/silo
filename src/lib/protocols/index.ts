import { createToolMiddleware } from '@ai-sdk-tool/parser';
import type { LanguageModelV2Content, LanguageModelV2FunctionTool, LanguageModelV2ToolCall, LanguageModelV2ToolResultPart } from "@ai-sdk/provider";
import { generateId } from "@ai-sdk/provider-utils";

// Simple UI-TARS protocol that handles <function=name> format
const uiTarsProtocol = () => ({
  formatTools({ tools, toolSystemPromptTemplate }: { tools: LanguageModelV2FunctionTool[]; toolSystemPromptTemplate: (tools: string) => string }) {
    const toolsDescription = tools.map(tool => {
      const parameters = tool.inputSchema?.properties || {};
      const required = tool.inputSchema?.required || [];
      
      let paramDesc = '';
      for (const [paramName, paramSchema] of Object.entries(parameters)) {
        const isRequired = required.includes(paramName);
        const type = (paramSchema as any)?.type || 'string';
        const description = (paramSchema as any)?.description || '';
        paramDesc += `  - ${paramName} (${type}${isRequired ? ', required' : ', optional'}): ${description}\n`;
      }
      
      return `${tool.name}: ${tool.description || ''}\nParameters:\n${paramDesc}`;
    }).join('\n\n');

    return toolSystemPromptTemplate(toolsDescription);
  },

  formatToolCall(toolCall: LanguageModelV2ToolCall): string {
    let args: Record<string, any> = {};
    const inputValue = 'input' in toolCall ? toolCall.input : undefined;

    if (typeof inputValue === "string") {
      try {
        args = JSON.parse(inputValue);
      } catch {
        args = { value: inputValue };
      }
    } else if (inputValue && typeof inputValue === 'object') {
      args = inputValue as Record<string, any>;
    }

    let result = `<function=${toolCall.toolName}>\n`;
    for (const [key, value] of Object.entries(args)) {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      result += `<parameter=${key}>${valueStr}</parameter>\n`;
    }
    result += `</function>`;
    return result;
  },

  formatToolResponse(toolResult: LanguageModelV2ToolResultPart): string {
    const output = typeof toolResult.output === 'string' 
      ? toolResult.output 
      : JSON.stringify(toolResult.output);
    return `<function_response=${toolResult.toolName}>\n${output}\n</function_response>`;
  },

  parseGeneratedText({ text, tools, options }: { text: string; tools: LanguageModelV2FunctionTool[]; options?: { onError?: (message: string, metadata?: Record<string, unknown>) => void } }): LanguageModelV2Content[] {
    const toolNames = tools.map(t => t.name).filter(Boolean) as string[];
    if (toolNames.length === 0) {
      return [{ type: "text", text }];
    }

    // Find <function=name>...</function> patterns
    const functionPattern = /<function=([^>]+)>\s*(.*?)\s*<\/function>/gs;
    const toolCalls: Array<{ toolName: string; startIndex: number; endIndex: number; content: string }> = [];
    
    let match;
    while ((match = functionPattern.exec(text)) !== null) {
      const extractedName = match[1].replace(/^['"]|['"]$/g, ''); // Remove quotes
      const content = match[2];
      
      // Map to known tool names
      let toolName = extractedName;
      let adjustedContent = content;
      
      if (toolNames.includes(extractedName)) {
        toolName = extractedName;
      } else if (toolNames.includes('computer')) {
        // Map common actions to computer tool
        const computerActions = ['screenshot', 'left_click', 'right_click', 'scroll', 'type', 'key', 'mouse_move', 'double_click', 'triple_click', 'middle_click', 'hold_key', 'cursor_position', 'left_mouse_down', 'left_mouse_up', 'left_click_drag', 'wait'];
        if (computerActions.includes(extractedName)) {
          toolName = 'computer';
          // Add action parameter if not already present
          if (!content.includes('<parameter=action>')) {
            adjustedContent = `<parameter=action>${extractedName}</parameter>\n${content}`;
          }
        }
      }
      
      toolCalls.push({
        toolName,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        content: adjustedContent
      });
    }

    // Build result with text and tool calls
    const result: LanguageModelV2Content[] = [];
    let currentIndex = 0;

    for (const toolCall of toolCalls.sort((a, b) => a.startIndex - b.startIndex)) {
      // Add text before this tool call
      if (toolCall.startIndex > currentIndex) {
        const textSegment = text.substring(currentIndex, toolCall.startIndex);
        if (textSegment.trim()) {
          result.push({ type: "text", text: textSegment });
        }
      }

      // Parse parameters
      const params: Record<string, any> = {};
      const paramPattern = /<parameter=([^>]+)>\s*(.*?)\s*<\/parameter>/gs;
      let paramMatch;
      
      while ((paramMatch = paramPattern.exec(toolCall.content)) !== null) {
        const paramName = paramMatch[1].replace(/^['"]|['"]$/g, '');
        const paramValue = paramMatch[2].trim();
        
        if (paramName && paramName !== 'parameters' && paramName !== 'parameter') {
          try {
            params[paramName] = JSON.parse(paramValue);
          } catch {
            params[paramName] = paramValue;
          }
        }
      }

      result.push({
        type: "tool-call",
        toolCallId: generateId(),
        toolName: toolCall.toolName,
        input: JSON.stringify(params),
      });

      currentIndex = toolCall.endIndex;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText.trim()) {
        result.push({ type: "text", text: remainingText });
      }
    }

    return result;
  },

  createStreamParser({ tools, options }: { tools: LanguageModelV2FunctionTool[]; options?: { onError?: (message: string, metadata?: Record<string, unknown>) => void } }) {
    // For streaming, we'll use a simple buffer-based approach
    let buffer = "";
    let currentTextId: string | null = null;

    return new TransformStream({
      transform(chunk, controller) {
        if (chunk.type !== "text-delta") {
          controller.enqueue(chunk);
          return;
        }

        buffer += chunk.delta;

        // Try to parse complete function calls
        const functionPattern = /<function=([^>]+)>\s*(.*?)\s*<\/function>/gs;
        let lastEnd = 0;
        let match;

        while ((match = functionPattern.exec(buffer)) !== null) {
          // Emit text before this function call
          const textBefore = buffer.substring(lastEnd, match.index);
          if (textBefore) {
            if (!currentTextId) {
              currentTextId = generateId();
              controller.enqueue({ type: "text-start", id: currentTextId });
            }
            controller.enqueue({ type: "text-delta", id: currentTextId, delta: textBefore });
          }

          // Close current text if open
          if (currentTextId) {
            controller.enqueue({ type: "text-end", id: currentTextId });
            currentTextId = null;
          }

          // Parse and emit the function call
          const toolName = match[1].replace(/^['"]|['"]$/g, '');
          const content = match[2];
          
          const params: Record<string, any> = {};
          const paramPattern = /<parameter=([^>]+)>\s*(.*?)\s*<\/parameter>/gs;
          let paramMatch;
          
          while ((paramMatch = paramPattern.exec(content)) !== null) {
            const paramName = paramMatch[1].replace(/^['"]|['"]$/g, '');
            const paramValue = paramMatch[2].trim();
            
            if (paramName && paramName !== 'parameters') {
              try {
                params[paramName] = JSON.parse(paramValue);
              } catch {
                params[paramName] = paramValue;
              }
            }
          }

          controller.enqueue({
            type: "tool-call",
            toolCallId: generateId(),
            toolName: toolName,
            input: JSON.stringify(params),
          });

          lastEnd = match.index + match[0].length;
        }

        // Keep remaining buffer for next chunk
        buffer = buffer.substring(lastEnd);
      },

      flush(controller) {
        if (buffer && currentTextId) {
          controller.enqueue({ type: "text-delta", id: currentTextId, delta: buffer });
          controller.enqueue({ type: "text-end", id: currentTextId });
        }
      }
    });
  },

  extractToolCallSegments({ text, tools }: { text: string; tools: LanguageModelV2FunctionTool[] }) {
    const functionPattern = /<function=([^>]+)>\s*(.*?)\s*<\/function>/gs;
    const segments: string[] = [];
    let match;
    
    while ((match = functionPattern.exec(text)) !== null) {
      segments.push(match[0]);
    }
    
    return segments;
  }
});

/**
 * UI-TARS middleware using a custom protocol that handles <function=name> syntax
 */
export const uiTarsToolMiddleware = createToolMiddleware({
  protocol: uiTarsProtocol,
  toolSystemPromptTemplate(tools: string) {
    return `You have access to callable functions (tools).
Tool list/context:
${tools}

===============================
UI-TARS FUNCTION CALLING FORMAT
===============================
You MUST use the EXACT format below for ALL function calls:

<function=tool_name>
<parameter=parameter_name>value</parameter>
<parameter=another_parameter>value</parameter>
</function>

===============================
CRITICAL SYNTAX RULES
===============================
1. Start with <function=TOOL_NAME> (use the exact tool name from the list above)
2. Each parameter MUST be <parameter=PARAM_NAME>VALUE</parameter>
3. End with </function>
4. NO quotes around tool names or parameter names
5. NO extra spaces or characters
6. NO JSON format - only use this XML-like format

===============================
CORRECT EXAMPLES
===============================
Screenshot:
<function=computer>
<parameter=action>screenshot</parameter>
</function>

Click at coordinates:
<function=computer>
<parameter=action>left_click</parameter>
<parameter=coordinate>[100, 200]</parameter>
</function>

Type text:
<function=computer>
<parameter=action>type</parameter>
<parameter=text>Hello World</parameter>
</function>

Scroll:
<function=computer>
<parameter=action>scroll</parameter>
<parameter=coordinate>[500, 400]</parameter>
<parameter=scroll_direction>down</parameter>
<parameter=scroll_amount>3</parameter>
</function>

===============================
WRONG FORMATS (DO NOT USE)
===============================
❌ <function=function='screenshot'> (no quotes or extra text)
❌ <parameter=parameters> (must use actual parameter name)
❌ JSON format like {"action": "screenshot"}
❌ Any format other than the exact XML-like format above

===============================
EXECUTION RULES
===============================
- Use ONLY the tool names listed above
- Include ALL required parameters for each tool
- If you don't know a parameter value, ask the user
- After calling a function, STOP and wait for the result
- Do NOT add extra text before or after function calls`;
  },
});
