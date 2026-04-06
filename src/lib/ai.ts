import OpenAI from 'openai';

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.AI_MODEL || 'openai/gpt-3.5-turbo';

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://localhost:3000', // Optional, for OpenRouter analytics
    'X-Title': 'WhatsApp AI Agent', // Optional, for OpenRouter analytics
  },
});

export async function getAIResponse(messages: { role: 'user' | 'assistant' | 'system', content: string }[]) {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
    });

    return response.choices[0].message.content || 'I am sorry, I could not generate a response.';
  } catch (error) {
    console.error('AI API Error:', error);
    throw new Error('Failed to get AI response');
  }
}
