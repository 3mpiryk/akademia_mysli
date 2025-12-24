import React from 'react';
import { useLocation } from 'react-router-dom';
import { ClinicalAssistant } from '../components/ClinicalAssistant';

type GuardianSummary = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
};

type PatientSummary = {
  id: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  mrn?: string | null;
  mrn_number: number;
  record_code: string;
  status: string;
  tags?: Record<string, unknown> | null;
  guardian: GuardianSummary;
};

type ChildContact = {
  address_line?: string | null;
  city?: string | null;
  postal_code?: string | null;
  school_name?: string | null;
  class_name?: string | null;
  registration_notes?: string | null;
};

type GuardianContact = {
  channel: string;
  value: string;
  is_primary: boolean;
  is_verified: boolean;
};

type EmergencyContact = {
  full_name: string;
  relation?: string | null;
  phone: string;
};

type Consent = {
  consent_type: string;
  granted_at: string;
  revoked_at?: string | null;
  notes?: string | null;
};

type AuthorizedPerson = {
  full_name: string;
  relation?: string | null;
  phone?: string | null;
  email?: string | null;
  scope?: string | null;
  is_active: boolean;
};

type PatientDetails = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string | null;
  pesel?: string | null;
  mrn?: string | null;
  mrn_number: number;
  record_code: string;
  status: string;
  child_version: number;
  guardian_version: number;
  guardian_address_line?: string | null;
  guardian_city?: string | null;
  guardian_postal_code?: string | null;
  guardian_preferred_contact_channel?: string | null;
  guardian: GuardianSummary;
  child_contact?: ChildContact | null;
  guardian_contacts: GuardianContact[];
  emergency_contacts: EmergencyContact[];
  consents: Consent[];
  authorized_people: AuthorizedPerson[];
};

type PatientEditForm = {
  child: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    pesel: string;
    mrn: string;
    status: string;
  };
  guardian: {
    full_name: string;
    email: string;
    phone: string;
    address_line: string;
    city: string;
    postal_code: string;
    preferred_contact_channel: string;
  };
  child_contact: {
    address_line: string;
    city: string;
    postal_code: string;
    school_name: string;
    class_name: string;
    registration_notes: string;
  };
};

type AppointmentItem = {
  id: string;
  doctor_id: string;
  service_id: string;
  status: string;
  start_at: string;
  end_at: string;
};

type EncounterItem = {
  id: string;
  appointment_id?: string | null;
  doctor_id: string;
  status: string;
  started_at?: string | null;
  ended_at?: string | null;
  created_at: string;
};

type PrescriptionItem = {
  id: string;
  appointment_id?: string | null;
  doctor_id: string;
  child_id: string;
  code: string;
  issued_at: string;
  expires_at?: string | null;
};

type InvoiceItem = {
  id: string;
  appointment_id?: string | null;
  guardian_id: string;
  number: string;
  status: string;
  issued_at: string;
  due_at?: string | null;
  paid_at?: string | null;
  total_amount: number;
  currency: string;
};

type AttachmentItem = {
  id: string;
  child_id?: string | null;
  encounter_id?: string | null;
  note_id?: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

type PatientSearchResult = {
  id: string;
  full_name: string;
  date_of_birth: string;
  mrn_number: number;
  record_code: string;
  guardian_name?: string | null;
};

type DoctorAppointment = {
  id: string;
  child_id: string;
  child_name: string;
  record_code: string;
  service_id: string;
  service_name: string;
  status: string;
  start_at: string;
  end_at: string;
};

type RecordData = {
  summary: PatientSummary | null;
  details: PatientDetails | null;
  appointments: AppointmentItem[];
  encounters: EncounterItem[];
  prescriptions: PrescriptionItem[];
  invoices: InvoiceItem[];
  attachments: AttachmentItem[];
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const [datePart] = value.split('T');
  return datePart;
};

const trimOrNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const isUuid = (value: string) => {
  const trimmed = value.trim();
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed)
    || /^[0-9a-fA-F]{32}$/.test(trimmed);
};

const decodeRoleFromToken = (token: string) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
    const decoded = JSON.parse(atob(padded));
    return typeof decoded.role === 'string' ? decoded.role : null;
  } catch (err) {
    return null;
  }
};

const initialData: RecordData = {
  summary: null,
  details: null,
  appointments: [],
  encounters: [],
  prescriptions: [],
  invoices: [],
  attachments: [],
};

export const PatientRecord: React.FC = () => {
  const location = useLocation();
  const [apiBase, setApiBase] = React.useState(() => localStorage.getItem('am_api_base') || 'http://localhost:8001');
  const [token, setToken] = React.useState(() => localStorage.getItem('am_token') || '');
  const authHeader = React.useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);
  const [childId, setChildId] = React.useState('');
  const [lastChildId, setLastChildId] = React.useState(() => localStorage.getItem('am_child_id') || '');
  const [email, setEmail] = React.useState('demo.lekarz@akademia-mysli.local');
  const [password, setPassword] = React.useState('demo123');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<RecordData>(initialData);
  const [editMode, setEditMode] = React.useState(false);
  const [editForm, setEditForm] = React.useState<PatientEditForm | null>(null);
  const [editNotice, setEditNotice] = React.useState<string | null>(null);
  const [editSaving, setEditSaving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<PatientSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [doctorAppointments, setDoctorAppointments] = React.useState<DoctorAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = React.useState(false);
  const [appointmentsError, setAppointmentsError] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem('am_api_base', apiBase);
  }, [apiBase]);

  React.useEffect(() => {
    localStorage.setItem('am_token', token);
  }, [token]);

  React.useEffect(() => {
    setUserRole(decodeRoleFromToken(token));
  }, [token]);

  React.useEffect(() => {
    if (!searchQuery.trim() || !token) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(
          `${apiBase}/med/patients/search?query=${encodeURIComponent(searchQuery.trim())}`,
          { headers: authHeader, signal: controller.signal }
        );
        if (!response.ok) {
          setSearchResults([]);
          return;
        }
        const payload = await response.json();
        setSearchResults(payload);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [apiBase, authHeader, searchQuery, token]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const record = params.get('record');
    if (!record) {
      return;
    }
    setChildId(record);
    if (token) {
      loadRecord(record);
    }
  }, [location.search, token]);

  React.useEffect(() => {
    if (!childId.trim()) {
      setData(initialData);
      setError(null);
    }
  }, [childId]);

  React.useEffect(() => {
    if (!data.details || editMode) {
      return;
    }
    setEditForm({
      child: {
        first_name: data.details.first_name,
        last_name: data.details.last_name,
        date_of_birth: toDateInputValue(data.details.date_of_birth),
        gender: data.details.gender || '',
        pesel: data.details.pesel || '',
        mrn: data.details.mrn || '',
        status: data.details.status || '',
      },
      guardian: {
        full_name: data.details.guardian.full_name,
        email: data.details.guardian.email || '',
        phone: data.details.guardian.phone || '',
        address_line: data.details.guardian_address_line || '',
        city: data.details.guardian_city || '',
        postal_code: data.details.guardian_postal_code || '',
        preferred_contact_channel: data.details.guardian_preferred_contact_channel || '',
      },
      child_contact: {
        address_line: data.details.child_contact?.address_line || '',
        city: data.details.child_contact?.city || '',
        postal_code: data.details.child_contact?.postal_code || '',
        school_name: data.details.child_contact?.school_name || '',
        class_name: data.details.child_contact?.class_name || '',
        registration_notes: data.details.child_contact?.registration_notes || '',
      },
    });
  }, [data.details, editMode]);

  const login = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/auth/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Niepoprawne dane logowania');
      }
      const payload = await response.json();
      setToken(payload.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zalogować');
    } finally {
      setLoading(false);
    }
  };

  const loadRecord = async (overrideId?: string) => {
    const inputValue = overrideId ?? childId;
    if (typeof inputValue !== 'string') {
      setError('Nieprawidłowy kod kartoteki.');
      return;
    }
    if (!inputValue) {
      setError('Podaj kod kartoteki lub identyfikator dziecka.');
      return;
    }
    if (!token) {
      setError('Zaloguj się, aby pobrać dane.');
      return;
    }
    setError(null);
    setLoading(true);
    const basePath = '/med/patients';
    try {
      let resolvedId = inputValue.trim();
      if (!isUuid(resolvedId)) {
        const lookupResponse = await fetch(
          `${apiBase}/med/patients/lookup?code=${encodeURIComponent(resolvedId)}`,
          { headers: authHeader }
        );
        if (!lookupResponse.ok) {
          const payload = await lookupResponse.json().catch(() => ({}));
          throw new Error(payload.detail || 'Nie znaleziono kartoteki o podanym kodzie.');
        }
        const lookupPayload = await lookupResponse.json();
        resolvedId = lookupPayload.id;
      }

      const [summary, details, appointments, encounters, prescriptions, invoices, attachments] = await Promise.all([
        fetch(`${apiBase}${basePath}/${resolvedId}/summary`, { headers: authHeader }).then(r => r.json()),
        fetch(`${apiBase}${basePath}/${resolvedId}/details`, { headers: authHeader }).then(r => r.json()),
        fetch(`${apiBase}${basePath}/${resolvedId}/appointments`, { headers: authHeader }).then(r => r.json()),
        fetch(`${apiBase}${basePath}/${resolvedId}/encounters`, { headers: authHeader }).then(r => r.json()),
        fetch(`${apiBase}${basePath}/${resolvedId}/prescriptions`, { headers: authHeader }).then(r => r.json()),
        fetch(`${apiBase}${basePath}/${resolvedId}/invoices`, { headers: authHeader }).then(r => r.json()),
        fetch(`${apiBase}${basePath}/${resolvedId}/attachments`, { headers: authHeader }).then(r => r.json()),
      ]);
      setData({
        summary,
        details,
        appointments,
        encounters,
        prescriptions,
        invoices,
        attachments,
      });
      const storedId = inputValue.trim() || resolvedId;
      localStorage.setItem('am_child_id', storedId);
      setLastChildId(storedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się pobrać danych');
    } finally {
      setLoading(false);
    }
  };

  const downloadAttachment = async (attachmentId: string, filename: string) => {
    const path = `/med/attachments/${attachmentId}/download`;
    const response = await fetch(`${apiBase}${path}`, { headers: authHeader });
    if (!response.ok) {
      setError('Nie udało się pobrać załącznika.');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveEdits = async () => {
    if (!data.details || !editForm) {
      return;
    }
    if (!token) {
      setEditNotice('Zaloguj się, aby zapisać zmiany.');
      return;
    }
    if (!editForm.child.first_name.trim() || !editForm.child.last_name.trim() || !editForm.child.date_of_birth) {
      setEditNotice('Uzupełnij wymagane pola dziecka.');
      return;
    }
    if (!editForm.guardian.full_name.trim()) {
      setEditNotice('Uzupełnij imię i nazwisko opiekuna.');
      return;
    }
    setEditNotice(null);
    setEditSaving(true);
    try {
      const payload = {
        child: {
          first_name: editForm.child.first_name.trim(),
          last_name: editForm.child.last_name.trim(),
          date_of_birth: editForm.child.date_of_birth,
          gender: editForm.child.gender || null,
          pesel: trimOrNull(editForm.child.pesel),
          mrn: trimOrNull(editForm.child.mrn),
          status: editForm.child.status || null,
          version: data.details.child_version,
        },
        guardian: {
          full_name: editForm.guardian.full_name.trim(),
          email: trimOrNull(editForm.guardian.email),
          phone: trimOrNull(editForm.guardian.phone),
          address_line: trimOrNull(editForm.guardian.address_line),
          city: trimOrNull(editForm.guardian.city),
          postal_code: trimOrNull(editForm.guardian.postal_code),
          preferred_contact_channel: editForm.guardian.preferred_contact_channel || null,
          version: data.details.guardian_version,
        },
        child_contact: {
          address_line: trimOrNull(editForm.child_contact.address_line),
          city: trimOrNull(editForm.child_contact.city),
          postal_code: trimOrNull(editForm.child_contact.postal_code),
          school_name: trimOrNull(editForm.child_contact.school_name),
          class_name: trimOrNull(editForm.child_contact.class_name),
          registration_notes: trimOrNull(editForm.child_contact.registration_notes),
        },
      };

      const response = await fetch(`${apiBase}/med/patients/${data.details.id}/details`, {
        method: 'PATCH',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}));
        throw new Error(payloadError.detail || 'Nie udało się zapisać zmian.');
      }
      const updatedDetails: PatientDetails = await response.json();
      setData((prev) => ({
        ...prev,
        details: updatedDetails,
        summary: prev.summary
          ? {
              ...prev.summary,
              full_name: `${updatedDetails.first_name} ${updatedDetails.last_name}`,
              status: updatedDetails.status,
              mrn: updatedDetails.mrn || prev.summary.mrn,
              guardian: {
                ...prev.summary.guardian,
                full_name: updatedDetails.guardian.full_name,
                email: updatedDetails.guardian.email,
                phone: updatedDetails.guardian.phone,
              },
            }
          : prev.summary,
      }));
      setEditMode(false);
      setEditNotice('Zapisano zmiany.');
    } catch (err) {
      setEditNotice(err instanceof Error ? err.message : 'Nie udało się zapisać zmian.');
    } finally {
      setEditSaving(false);
    }
  };

  const isStaffLoggedIn = Boolean(token);
  const isClinician = userRole === 'DOCTOR' || userRole === 'THERAPIST';

  const fetchDoctorAppointments = React.useCallback(
    async (signal?: AbortSignal) => {
      if (!isStaffLoggedIn || !isClinician) {
        setDoctorAppointments([]);
        setAppointmentsError(null);
        setAppointmentsLoading(false);
        return;
      }
      setAppointmentsLoading(true);
      setAppointmentsError(null);
      try {
        const response = await fetch(`${apiBase}/med/doctor/appointments`, {
          headers: authHeader,
          signal,
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.detail || 'Nie udało się pobrać wizyt lekarza.');
        }
        const payload = await response.json();
        setDoctorAppointments(payload);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setAppointmentsError(err instanceof Error ? err.message : 'Nie udało się pobrać wizyt lekarza.');
      } finally {
        setAppointmentsLoading(false);
      }
    },
    [apiBase, authHeader, isClinician, isStaffLoggedIn],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    fetchDoctorAppointments(controller.signal);
    return () => controller.abort();
  }, [fetchDoctorAppointments]);

  const openFromAppointment = (recordCode: string) => {
    setChildId(recordCode);
    setSearchQuery('');
    setSearchResults([]);
    loadRecord(recordCode);
  };

  const sortedAppointments = React.useMemo(() => (
    [...doctorAppointments].sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    )
  ), [doctorAppointments]);

  const todayAppointments = React.useMemo(() => {
    const today = new Date().toDateString();
    return doctorAppointments.filter((appt) => new Date(appt.start_at).toDateString() === today).length;
  }, [doctorAppointments]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-sm uppercase tracking-widest text-primary-600 font-semibold">Kartoteka pacjenta</span>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Podgląd kartoteki (demo)</h1>
          <p className="text-slate-600 max-w-2xl">
            Połącz się z API, zaloguj się jako personel i pobierz dane kartoteki dziecka.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Połączenie z API</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Adres API
                <input
                  value={apiBase}
                  onChange={(event) => setApiBase(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Hasło
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={login}
                disabled={loading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                Zaloguj i pobierz token
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('demo.lekarz@akademia-mysli.local');
                  setPassword('demo123');
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Ustaw konto lekarza
              </button>
            </div>
            {isStaffLoggedIn && (
              <div className="mt-3 text-xs text-emerald-600">
                Zalogowano jako: {userRole || 'personel'}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Identyfikator pacjenta</h2>
            <label className="text-sm text-slate-600">
              Kod kartoteki lub ID dziecka
              <input
                value={childId}
                onChange={(event) => setChildId(event.target.value)}
                placeholder="np. AM-000001 lub e6546acb-bdc2-4816-8529-8a3ee89db983"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </label>
            <div className="mt-1 text-xs text-slate-500">
              Kod kartoteki znajdziesz w podsumowaniu pacjenta lub w wynikach wyszukiwania.
            </div>
            {lastChildId && (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Ostatnio użyte: {lastChildId}</span>
                <button
                  type="button"
                  onClick={() => setChildId(lastChildId)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Wstaw
                </button>
              </div>
            )}
            {isStaffLoggedIn && (
              <div className="mt-4">
                <label className="text-sm text-slate-600">
                  Szybkie wyszukiwanie pacjenta
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="np. Kowalska, Ola"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  />
                </label>
                {searchLoading && (
                  <div className="mt-2 text-xs text-slate-500">Szukam...</div>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white text-sm">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => {
                          setChildId(result.record_code);
                          setSearchQuery('');
                          setSearchResults([]);
                          loadRecord(result.record_code);
                        }}
                        className="w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50 last:border-b-0"
                      >
                        <div className="font-semibold text-slate-800">{result.full_name}</div>
                        <div className="text-xs text-slate-500">
                          Kod: {result.record_code} • {formatDate(result.date_of_birth)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => loadRecord()}
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Pobierz kartotekę
            </button>
            <div className="mt-4 text-xs text-slate-500 break-words">
              Token: {token ? `${token.slice(0, 22)}...` : 'brak'}
            </div>
          </div>
        </div>

        {isClinician && (
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Twoje wizyty</h2>
                  <p className="text-xs text-slate-500">Kliknij, aby otworzyć kartotekę pacjenta.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchDoctorAppointments()}
                  disabled={appointmentsLoading}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  {appointmentsLoading ? 'Odświeżam...' : 'Odśwież'}
                </button>
              </div>

              {appointmentsError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {appointmentsError}
                </div>
              )}

              <div className="space-y-3 text-sm text-slate-700">
                {appointmentsLoading && (
                  <div className="text-sm text-slate-500">Pobieranie wizyt...</div>
                )}
                {!appointmentsLoading && sortedAppointments.length === 0 && (
                  <div className="text-sm text-slate-500">Brak wizyt do wyświetlenia.</div>
                )}
                {!appointmentsLoading && sortedAppointments.map((appt) => (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => openFromAppointment(appt.record_code)}
                    className="w-full rounded-xl border border-slate-100 px-4 py-3 text-left hover:border-primary-200 hover:bg-primary-50 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900">{appt.child_name}</div>
                        <div className="text-xs text-slate-500">
                          {formatDate(appt.start_at)} · {appt.service_name}
                        </div>
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-primary-600">
                        {appt.status}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Kod kartoteki: {appt.record_code}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Szybki skrót</h3>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Wizyty dziś</span>
                  <span className="font-semibold">{todayAppointments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Wszystkie wizyty</span>
                  <span className="font-semibold">{doctorAppointments.length}</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Dane odświeżysz przyciskiem w panelu wizyt.
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Ładowanie danych...
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Podsumowanie</h2>
            {data.summary ? (
              <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-700">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-400">Pacjent</div>
                  <div className="text-lg font-semibold text-slate-900">{data.summary.full_name}</div>
                  <div>Wiek: {data.summary.age} lat</div>
                  <div>Data ur.: {formatDate(data.summary.date_of_birth)}</div>
                  <div>Status: {data.summary.status}</div>
                  <div>Kod kartoteki: {data.summary.record_code}</div>
                  <div>MRN: {data.summary.mrn || '-'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-400">Opiekun</div>
                  <div className="text-lg font-semibold text-slate-900">{data.summary.guardian.full_name}</div>
                  <div>Email: {data.summary.guardian.email || '-'}</div>
                  <div>Telefon: {data.summary.guardian.phone || '-'}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Brak danych do wyświetlenia.</div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tagi / status</h2>
            <div className="text-sm text-slate-600">
              {(data.summary?.tags && Object.keys(data.summary.tags).length > 0)
                ? Object.keys(data.summary.tags).join(', ')
                : 'Brak tagów'}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Dane i kontakty</h2>
                {isStaffLoggedIn && data.details && (
                  <p className="text-xs text-slate-500">Edycja dostępna dla personelu medycznego.</p>
                )}
              </div>
              {isStaffLoggedIn && data.details && (
                <button
                  type="button"
                  onClick={() => {
                    setEditNotice(null);
                    setEditMode((prev) => !prev);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {editMode ? 'Anuluj edycję' : 'Edytuj dane'}
                </button>
              )}
            </div>
            {editNotice && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {editNotice}
              </div>
            )}
            {data.details ? (
              editMode && editForm ? (
                <div className="space-y-6 text-sm text-slate-700">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Dziecko</div>
                      <label className="text-sm text-slate-600">
                        Imię *
                        <input
                          value={editForm.child.first_name}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, child: { ...prev.child, first_name: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Nazwisko *
                        <input
                          value={editForm.child.last_name}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, child: { ...prev.child, last_name: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Data urodzenia *
                        <input
                          type="date"
                          value={editForm.child.date_of_birth}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, child: { ...prev.child, date_of_birth: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Płeć
                        <select
                          value={editForm.child.gender}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, child: { ...prev.child, gender: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        >
                          <option value="">Nie podano</option>
                          <option value="FEMALE">Kobieta</option>
                          <option value="MALE">Mężczyzna</option>
                          <option value="OTHER">Inna</option>
                          <option value="UNKNOWN">Nieznana</option>
                        </select>
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        PESEL
                        <input
                          value={editForm.child.pesel}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, child: { ...prev.child, pesel: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Status
                        <select
                          value={editForm.child.status}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, child: { ...prev.child, status: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        >
                          <option value="">Wybierz</option>
                          <option value="ACTIVE">Aktywny</option>
                          <option value="ARCHIVED">Zarchiwizowany</option>
                        </select>
                      </label>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Opiekun</div>
                      <label className="text-sm text-slate-600">
                        Imię i nazwisko *
                        <input
                          value={editForm.guardian.full_name}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, guardian: { ...prev.guardian, full_name: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Email
                        <input
                          value={editForm.guardian.email}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, guardian: { ...prev.guardian, email: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Telefon
                        <input
                          value={editForm.guardian.phone}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, guardian: { ...prev.guardian, phone: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Preferowany kontakt
                        <select
                          value={editForm.guardian.preferred_contact_channel}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    guardian: { ...prev.guardian, preferred_contact_channel: event.target.value },
                                  }
                                : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        >
                          <option value="">Nie ustawiono</option>
                          <option value="EMAIL">Email</option>
                          <option value="SMS">SMS</option>
                          <option value="PHONE">Telefon</option>
                        </select>
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        MRN
                        <input
                          value={editForm.child.mrn}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, child: { ...prev.child, mrn: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Adres opiekuna</div>
                      <label className="text-sm text-slate-600">
                        Ulica i numer
                        <input
                          value={editForm.guardian.address_line}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, guardian: { ...prev.guardian, address_line: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Miasto
                        <input
                          value={editForm.guardian.city}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, guardian: { ...prev.guardian, city: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Kod pocztowy
                        <input
                          value={editForm.guardian.postal_code}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, guardian: { ...prev.guardian, postal_code: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Adres i szkoła dziecka</div>
                      <label className="text-sm text-slate-600">
                        Ulica i numer
                        <input
                          value={editForm.child_contact.address_line}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev
                                ? { ...prev, child_contact: { ...prev.child_contact, address_line: event.target.value } }
                                : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Miasto
                        <input
                          value={editForm.child_contact.city}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, child_contact: { ...prev.child_contact, city: event.target.value } } : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Kod pocztowy
                        <input
                          value={editForm.child_contact.postal_code}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev
                                ? { ...prev, child_contact: { ...prev.child_contact, postal_code: event.target.value } }
                                : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Szkoła
                        <input
                          value={editForm.child_contact.school_name}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev
                                ? { ...prev, child_contact: { ...prev.child_contact, school_name: event.target.value } }
                                : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                      <label className="mt-3 block text-sm text-slate-600">
                        Klasa
                        <input
                          value={editForm.child_contact.class_name}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev
                                ? { ...prev, child_contact: { ...prev.child_contact, class_name: event.target.value } }
                                : prev
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                        />
                      </label>
                    </div>
                  </div>

                  <label className="text-sm text-slate-600">
                    Uwagi rejestracji
                    <textarea
                      value={editForm.child_contact.registration_notes}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                child_contact: { ...prev.child_contact, registration_notes: event.target.value },
                              }
                            : prev
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                      rows={3}
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={saveEdits}
                      disabled={editSaving}
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                      {editSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setEditNotice(null);
                      }}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-700">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-400">Dziecko</div>
                    <div>Imię: {data.details.first_name}</div>
                    <div>Nazwisko: {data.details.last_name}</div>
                    <div>Płeć: {data.details.gender || '-'}</div>
                    <div>PESEL: {data.details.pesel || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-400">Adres</div>
                    <div>{data.details.child_contact?.address_line || '-'}</div>
                    <div>{data.details.child_contact?.postal_code || ''} {data.details.child_contact?.city || ''}</div>
                    <div>Szkoła: {data.details.child_contact?.school_name || '-'}</div>
                    <div>Klasa: {data.details.child_contact?.class_name || '-'}</div>
                  </div>
                </div>
              )
            ) : (
              <div className="text-sm text-slate-500">Brak danych.</div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Zgody</h2>
            <div className="space-y-2 text-sm text-slate-600">
              {data.details?.consents?.length ? (
                data.details.consents.map((consent) => (
                  <div key={`${consent.consent_type}-${consent.granted_at}`} className="flex justify-between">
                    <span>{consent.consent_type}</span>
                    <span>{formatDate(consent.granted_at)}</span>
                  </div>
                ))
              ) : (
                <div>Brak zgód.</div>
              )}
            </div>
          </div>
        </div>

        {isStaffLoggedIn && (
          <div className="mt-8">
            <ClinicalAssistant
              patientName={data.details ? `${data.details.first_name} ${data.details.last_name}` : undefined}
              patientAge={data.summary?.age}
              token={token}
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2 mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Wizyty</h2>
            <div className="space-y-3 text-sm text-slate-600">
              {data.appointments.length ? data.appointments.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <div className="font-semibold text-slate-800">{formatDate(item.start_at)}</div>
                  <div>Status: {item.status}</div>
                  <div>Doctor ID: {item.doctor_id}</div>
                </div>
              )) : <div>Brak wizyt.</div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Encounters</h2>
            <div className="space-y-3 text-sm text-slate-600">
              {data.encounters.length ? data.encounters.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <div className="font-semibold text-slate-800">{formatDate(item.created_at)}</div>
                  <div>Status: {item.status}</div>
                  <div>Doctor ID: {item.doctor_id}</div>
                </div>
              )) : <div>Brak encounterów.</div>}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recepty</h2>
            <div className="space-y-3 text-sm text-slate-600">
              {data.prescriptions.length ? data.prescriptions.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <div className="font-semibold text-slate-800">Kod: {item.code}</div>
                  <div>Wystawiono: {formatDate(item.issued_at)}</div>
                  <div>Ważność: {formatDate(item.expires_at)}</div>
                </div>
              )) : <div>Brak recept.</div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Faktury</h2>
            <div className="space-y-3 text-sm text-slate-600">
              {data.invoices.length ? data.invoices.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <div className="font-semibold text-slate-800">{item.number}</div>
                  <div>Status: {item.status}</div>
                  <div>Kwota: {item.total_amount} {item.currency}</div>
                </div>
              )) : <div>Brak faktur.</div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Załączniki</h2>
            <div className="space-y-3 text-sm text-slate-600">
              {data.attachments.length ? data.attachments.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <div className="font-semibold text-slate-800">{item.file_name}</div>
                  <div>Dodano: {formatDate(item.created_at)}</div>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(item.id, item.file_name)}
                    className="mt-2 inline-flex items-center rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Pobierz
                  </button>
                </div>
              )) : <div>Brak załączników.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
