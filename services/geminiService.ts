import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Jesteś wirtualnym asystentem przychodni "Akademia Myśli", placówki medycznej dla dzieci i młodzieży.
Twoim celem jest pomoc rodzicom i pacjentom w nawigacji po systemie, wyjaśnianie usług oraz wsparcie w procesie rejestracji.

Kluczowe informacje:
- Oferujemy: Psychiatrię, Psychoterapię, Seksuologię, Neurologię, Felinoterapię i Dogoterapię.
- Placówka jest przyjazna dzieciom, empatyczna i profesjonalna.
- Nie udzielasz konkretnych porad medycznych ani diagnoz. Zawsze sugeruj konsultację z lekarzem.
- Jesteś uprzejmy, cierpliwy i używasz języka dostosowanego do charakteru placówki (opiekuńczy, ale profesjonalny).

Jeśli użytkownik pyta o cennik lub wolne terminy, skieruj go do zakładki "Rejestracja" lub "Usługi".
`;

export const sendMessageToGemini = async (history: string[], message: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We construct a simple chat simulation using generateContent for this demo
    // ideally strictly using Chat API, but stateless single request is often safer for simple frontend demos without persistent backend session.
    // However, sticking to guidelines, let's use a simple generation with history context manually prepended if needed, 
    // or just direct response since we don't have a persistent backend to store the chat object session reliably across page reloads in this mock.
    
    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "Przepraszam, nie mogę teraz odpowiedzieć. Proszę spróbować później.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Wystąpił problem z połączeniem z asystentem. Proszę spróbować później.";
  }
};