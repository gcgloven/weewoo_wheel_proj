export interface ChatOpts {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** Tool call id — required when role is 'tool'. */
  tool_call_id?: string;
  /** Tool calls emitted by the assistant. */
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatResponse {
  content: string;
  toolCalls: ToolCall[];
}

export async function chat(
  messages: ChatMessage[],
  opts: ChatOpts,
): Promise<string> {
  if (!opts.apiKey) throw new Error('Missing API key. Configure it in options.');
  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
    max_tokens: opts.maxTokens,
  };
  const res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LLM error ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Chat with tool/function calling support.
 * Returns both text content and any tool_calls emitted by the model.
 * Falls back gracefully: if the provider ignores tools, returns content only.
 */
export async function chatWithTools(
  messages: ChatMessage[],
  tools: ToolDef[],
  opts: ChatOpts,
): Promise<ChatResponse> {
  if (!opts.apiKey) throw new Error('Missing API key. Configure it in options.');
  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
    max_tokens: opts.maxTokens,
    tools,
    tool_choice: 'auto',
  };
  const res = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LLM error ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  return {
    content: msg?.content ?? '',
    toolCalls: msg?.tool_calls ?? [],
  };
}
