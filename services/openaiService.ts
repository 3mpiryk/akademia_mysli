import { ChatMessage } from '../types';

type ClinicalSuggestionPayload = {
  note: string;
  context?: string;
};

type ClinicalSuggestionResponse = {
  reply: string;
};

type PublicChatPayload = {
  message: string;
  history: { role: 'user' | 'assistant'; text: string }[];
};

type PublicChatResponse = {
  reply: string;
};

class OpenAIService {
  private static getApiBase() {
    return (
      import.meta.env.VITE_API_BASE_URL ||
      localStorage.getItem('am_api_base') ||
      'http://localhost:8001'
    );
  }

  private static buildHistory(messages: ChatMessage[]) {
    return messages.map((msg) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      text: msg.text,
    }));
  }

  static async sendPublicChat(messages: ChatMessage[], message: string): Promise<string> {
    const apiBase = OpenAIService.getApiBase();
    const payload: PublicChatPayload = {
      message,
      history: OpenAIService.buildHistory(messages),
    };

    const response = await fetch(`${apiBase}/ai/public-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.detail || 'Asystent jest chwilowo niedostępny.');
    }

    const data: PublicChatResponse = await response.json();
    return data.reply;
  }

  static async sendClinicalSuggestion(note: string, context: string, token: string): Promise<string> {
    if (!token) {
      throw new Error('Brak tokenu dostępu do asystenta.');
    }
    const apiBase = OpenAIService.getApiBase();
    const payload: ClinicalSuggestionPayload = { note, context };

    const response = await fetch(`${apiBase}/ai/clinical-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.detail || 'Asystent jest chwilowo niedostępny.');
    }

    const data: ClinicalSuggestionResponse = await response.json();
    return data.reply;
  }
}

export default OpenAIService;
