import React from 'react';
import OpenAIService from '../services/openaiService';

type ClinicalAssistantProps = {
  patientName?: string;
  patientAge?: number;
  token: string;
};

const buildDefaultContext = (patientName?: string, patientAge?: number) => {
  const parts: string[] = [];
  if (patientName) {
    parts.push(`Pacjent: ${patientName}`);
  }
  if (patientAge !== undefined) {
    parts.push(`Wiek: ${patientAge} lat`);
  }
  return parts.join(' | ');
};

export const ClinicalAssistant: React.FC<ClinicalAssistantProps> = ({ patientName, patientAge, token }) => {
  const [note, setNote] = React.useState('');
  const [context, setContext] = React.useState('');
  const [response, setResponse] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedNotice, setSavedNotice] = React.useState<string | null>(null);

  const hasSuggestions = response.trim().length > 0;

  React.useEffect(() => {
    if (context.trim()) {
      return;
    }
    setContext(buildDefaultContext(patientName, patientAge));
  }, [patientName, patientAge, context]);

  const handleSuggest = async () => {
    if (!note.trim()) {
      setError('Wpisz treść notatki, aby otrzymać podpowiedzi.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const suggestion = await OpenAIService.sendClinicalSuggestion(note, context, token);
      setResponse(suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Asystent AI jest chwilowo niedostępny.');
    } finally {
      setLoading(false);
    }
  };

  const insertSuggestions = () => {
    if (!hasSuggestions) {
      return;
    }
    setSavedNotice(null);
    setNote((prev) => (prev ? `${prev}\n\n${response}` : response));
  };

  const saveNote = () => {
    if (!note.trim()) {
      setSavedNotice('Brak treści notatki do zapisania.');
      return;
    }
    setSavedNotice('Zapisano w notatce roboczej (lokalnie).');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Asystent AI dla lekarza</h2>
          <p className="text-xs text-slate-500">
            Podpowiedzi do dokumentacji. Bez diagnoz i bez treści wrażliwych w promptach.
          </p>
        </div>
        <span className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-600">Beta</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm text-slate-600">
          Kontekst wizyty (opcjonalnie)
          <input
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="np. Pacjent: Ola Kowalska | Wiek: 10 lat"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          />
        </label>
        <div className="text-xs text-slate-500 flex items-center">
          Wskazówka: wpisuj ogólnie, bez danych wrażliwych.
        </div>
      </div>

      <label className="mt-4 block text-sm text-slate-600">
        Notatka wizyty (robocza)
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Napisz krótki opis wizyty, obserwacje, pytania do doprecyzowania..."
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          rows={5}
        />
      </label>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {savedNotice && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {savedNotice}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSuggest}
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? 'Generuję...' : 'Podpowiedz'}
        </button>
        <button
          type="button"
          onClick={insertSuggestions}
          disabled={!hasSuggestions}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          Wstaw do notatki
        </button>
        <button
          type="button"
          onClick={saveNote}
          className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Zapisz
        </button>
        <button
          type="button"
          onClick={() => {
            setNote('');
            setResponse('');
            setError(null);
            setSavedNotice(null);
          }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Wyczyść
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 whitespace-pre-wrap min-h-[120px]">
        {response || 'Tutaj pojawią się podpowiedzi dotyczące notatki klinicznej.'}
      </div>
    </div>
  );
};
