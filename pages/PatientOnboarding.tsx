import React from 'react';
import { useNavigate } from 'react-router-dom';

type OnboardingForm = {
  guardian_full_name: string;
  guardian_phone: string;
  guardian_address_line: string;
  guardian_city: string;
  guardian_postal_code: string;
  guardian_preferred_contact_channel: '' | 'EMAIL' | 'SMS' | 'PHONE';
  child_first_name: string;
  child_last_name: string;
  child_date_of_birth: string;
  child_gender: '' | 'FEMALE' | 'MALE';
  child_pesel: string;
  child_address_line: string;
  child_city: string;
  child_postal_code: string;
  child_school_name: string;
  child_class_name: string;
  consent_rodo: boolean;
  consent_guardian: boolean;
};

type OnboardingResponse = {
  child_id: string;
  record_code: string;
};

const getApiBase = () => (
  import.meta.env.VITE_API_BASE_URL ||
  localStorage.getItem('am_api_base') ||
  'http://localhost:8001'
);

const trimOrNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const PatientOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = React.useState<OnboardingForm>({
    guardian_full_name: '',
    guardian_phone: '',
    guardian_address_line: '',
    guardian_city: '',
    guardian_postal_code: '',
    guardian_preferred_contact_channel: '',
    child_first_name: '',
    child_last_name: '',
    child_date_of_birth: '',
    child_gender: '',
    child_pesel: '',
    child_address_line: '',
    child_city: '',
    child_postal_code: '',
    child_school_name: '',
    child_class_name: '',
    consent_rodo: false,
    consent_guardian: false,
  });
  const [registrationMode, setRegistrationMode] = React.useState<'CHILD' | 'ADULT'>('CHILD');
  const [token] = React.useState(() => localStorage.getItem('am_patient_token') || '');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<OnboardingResponse | null>(null);
  const isAdult = registrationMode === 'ADULT';
  const guardianFullName = isAdult
    ? `${form.child_first_name} ${form.child_last_name}`.trim()
    : form.guardian_full_name;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError('Brak aktywnej sesji rejestracji. Zarejestruj się ponownie.');
      return;
    }
    if (!form.child_first_name.trim() || !form.child_last_name.trim() || !form.child_date_of_birth) {
      setError(isAdult ? 'Uzupełnij imię, nazwisko i datę urodzenia pacjenta.' : 'Uzupełnij imię, nazwisko i datę urodzenia dziecka.');
      return;
    }
    if (!guardianFullName.trim()) {
      setError(isAdult ? 'Uzupełnij imię i nazwisko pacjenta.' : 'Uzupełnij imię i nazwisko opiekuna.');
      return;
    }
    if (!form.consent_rodo || !form.consent_guardian) {
      setError(isAdult ? 'Zaznacz wymagane zgody (RODO i pacjenta).' : 'Zaznacz wymagane zgody (RODO i opiekuna).');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        guardian_full_name: guardianFullName.trim(),
        guardian_phone: trimOrNull(form.guardian_phone),
        guardian_address_line: trimOrNull(form.guardian_address_line),
        guardian_city: trimOrNull(form.guardian_city),
        guardian_postal_code: trimOrNull(form.guardian_postal_code),
        guardian_preferred_contact_channel: form.guardian_preferred_contact_channel || null,
        child_first_name: form.child_first_name.trim(),
        child_last_name: form.child_last_name.trim(),
        child_date_of_birth: form.child_date_of_birth,
        child_gender: form.child_gender || null,
        child_pesel: trimOrNull(form.child_pesel),
        child_address_line: trimOrNull(form.child_address_line),
        child_city: trimOrNull(form.child_city),
        child_postal_code: trimOrNull(form.child_postal_code),
        child_school_name: trimOrNull(form.child_school_name),
        child_class_name: trimOrNull(form.child_class_name),
        consent_rodo: form.consent_rodo,
        consent_guardian: form.consent_guardian,
      };

      const response = await fetch(`${getApiBase()}/patient/onboarding`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}));
        throw new Error(payloadError.detail || 'Nie udało się utworzyć kartoteki.');
      }
      const data: OnboardingResponse = await response.json();
      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się utworzyć kartoteki.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Kartoteka utworzona</h1>
            <p className="text-slate-600 mb-6">
              Dziękujemy. Twoja kartoteka została założona.
            </p>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              Kod kartoteki: <span className="font-semibold">{success.record_code}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-6 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Przejdź do logowania
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <span className="text-sm uppercase tracking-widest text-primary-600 font-semibold">Uzupełnij dane</span>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Rejestracja</h1>
          <p className="text-slate-600 max-w-2xl">
            {isAdult
              ? 'Uzupełnij dane pacjenta, aby dokończyć rejestrację.'
              : 'Uzupełnij dane opiekuna i dziecka, aby dokończyć rejestrację.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Kogo rejestrujesz?</h2>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setRegistrationMode('CHILD')}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  registrationMode === 'CHILD'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Rejestruję dziecko
              </button>
              <button
                type="button"
                onClick={() => setRegistrationMode('ADULT')}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  registrationMode === 'ADULT'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Rejestruję siebie
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {isAdult ? 'Moje dane kontaktowe' : 'Dane opiekuna'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Imię i nazwisko *
                <input
                  value={guardianFullName}
                  onChange={(event) => {
                    if (isAdult) return;
                    setForm((prev) => ({ ...prev, guardian_full_name: event.target.value }));
                  }}
                  readOnly={isAdult}
                  className={`mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 ${isAdult ? 'bg-slate-100' : ''}`}
                />
                {isAdult && (
                  <span className="mt-1 block text-xs text-slate-500">
                    Imię i nazwisko pobieramy z formularza poniżej.
                  </span>
                )}
              </label>
              <label className="text-sm text-slate-600">
                Telefon
                <input
                  value={form.guardian_phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, guardian_phone: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-600">
                Ulica i numer
                <input
                  value={form.guardian_address_line}
                  onChange={(event) => setForm((prev) => ({ ...prev, guardian_address_line: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Miasto
                <input
                  value={form.guardian_city}
                  onChange={(event) => setForm((prev) => ({ ...prev, guardian_city: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Kod pocztowy
                <input
                  value={form.guardian_postal_code}
                  onChange={(event) => setForm((prev) => ({ ...prev, guardian_postal_code: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm text-slate-600">
              Preferowany kontakt
              <select
                value={form.guardian_preferred_contact_channel}
                onChange={(event) => setForm((prev) => ({
                  ...prev,
                  guardian_preferred_contact_channel: event.target.value as OnboardingForm['guardian_preferred_contact_channel'],
                }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              >
                <option value="">Nie ustawiono</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="PHONE">Telefon</option>
              </select>
            </label>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{isAdult ? 'Moje dane' : 'Dane dziecka'}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Imię *
                <input
                  value={form.child_first_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, child_first_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Nazwisko *
                <input
                  value={form.child_last_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, child_last_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Data urodzenia *
                <input
                  type="date"
                  value={form.child_date_of_birth}
                  onChange={(event) => setForm((prev) => ({ ...prev, child_date_of_birth: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Płeć
                <select
                  value={form.child_gender}
                  onChange={(event) => setForm((prev) => ({
                    ...prev,
                    child_gender: event.target.value as OnboardingForm['child_gender'],
                  }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                >
                  <option value="">Nie podano</option>
                  <option value="FEMALE">Kobieta</option>
                  <option value="MALE">Mężczyzna</option>
                </select>
              </label>
            </div>
            <label className="mt-4 block text-sm text-slate-600">
              PESEL (opcjonalnie)
              <input
                value={form.child_pesel}
                onChange={(event) => setForm((prev) => ({ ...prev, child_pesel: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </label>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-600">
                {isAdult ? 'Adres' : 'Adres dziecka'}
                <input
                  value={form.child_address_line}
                  onChange={(event) => setForm((prev) => ({ ...prev, child_address_line: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Miasto
                <input
                  value={form.child_city}
                  onChange={(event) => setForm((prev) => ({ ...prev, child_city: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Kod pocztowy
                <input
                  value={form.child_postal_code}
                  onChange={(event) => setForm((prev) => ({ ...prev, child_postal_code: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Szkoła
                <input
                  value={form.child_school_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, child_school_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Klasa
                <input
                  value={form.child_class_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, child_class_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Zgody</h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.consent_rodo}
                  onChange={(event) => setForm((prev) => ({ ...prev, consent_rodo: event.target.checked }))}
                />
                Zgoda RODO *
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.consent_guardian}
                  onChange={(event) => setForm((prev) => ({ ...prev, consent_guardian: event.target.checked }))}
                />
                {isAdult ? 'Zgoda pacjenta *' : 'Zgoda opiekuna *'}
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Tworzę konto...' : 'Zakończ rejestrację'}
          </button>
        </form>
      </div>
    </div>
  );
};
