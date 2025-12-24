import React from 'react';
import { useNavigate } from 'react-router-dom';

type PatientSearchResult = {
  id: string;
  full_name: string;
  date_of_birth: string;
  mrn_number: number;
  record_code: string;
  guardian_name?: string | null;
};

type AdminDoctorForm = {
  email: string;
  specialization: string;
  role: 'DOCTOR' | 'THERAPIST';
  phone: string;
  license_number: string;
};

type AdminDoctorResult = {
  user_id: string;
  doctor_id: string;
  email: string;
  role: string;
  specialization: string;
  temporary_password: string;
};

type DoctorListItem = {
  user_id: string;
  doctor_id: string;
  email: string;
  phone?: string | null;
  role: string;
  specialization: string;
  is_active: boolean;
};

type AdminPatientForm = {
  guardian_full_name: string;
  guardian_email: string;
  guardian_phone: string;
  guardian_address_line: string;
  guardian_city: string;
  guardian_postal_code: string;
  guardian_preferred_contact_channel: '' | 'EMAIL' | 'SMS' | 'PHONE';
  child_first_name: string;
  child_last_name: string;
  child_date_of_birth: string;
  child_gender: '' | 'FEMALE' | 'MALE' | 'OTHER' | 'UNKNOWN';
  child_pesel: string;
  child_address_line: string;
  child_city: string;
  child_postal_code: string;
  child_school_name: string;
  child_class_name: string;
  consent_rodo: boolean;
  consent_guardian: boolean;
};

type AdminPatientResult = {
  user_id: string;
  guardian_id: string;
  child_id: string;
  record_code: string;
  temporary_password: string;
};

type PatientListItem = {
  user_id: string;
  guardian_id: string;
  child_id: string;
  record_code: string;
  child_name: string;
  date_of_birth: string;
  status: string;
  guardian_name: string;
  guardian_email?: string | null;
  guardian_phone?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pl-PL');
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

const trimOrNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [apiBase, setApiBase] = React.useState(() => localStorage.getItem('am_api_base') || 'http://localhost:8001');
  const [token, setToken] = React.useState(() => localStorage.getItem('am_token') || '');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  const authHeader = React.useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  const [doctorForm, setDoctorForm] = React.useState<AdminDoctorForm>({
    email: '',
    specialization: '',
    role: 'DOCTOR',
    phone: '',
    license_number: '',
  });
  const [doctorResult, setDoctorResult] = React.useState<AdminDoctorResult | null>(null);
  const [doctorNotice, setDoctorNotice] = React.useState<string | null>(null);
  const [doctorError, setDoctorError] = React.useState<string | null>(null);
  const [doctorLoading, setDoctorLoading] = React.useState(false);

  const [patientForm, setPatientForm] = React.useState<AdminPatientForm>({
    guardian_full_name: '',
    guardian_email: '',
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
    consent_rodo: true,
    consent_guardian: true,
  });
  const [patientResult, setPatientResult] = React.useState<AdminPatientResult | null>(null);
  const [patientNotice, setPatientNotice] = React.useState<string | null>(null);
  const [patientError, setPatientError] = React.useState<string | null>(null);
  const [patientLoading, setPatientLoading] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<PatientSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [doctorList, setDoctorList] = React.useState<DoctorListItem[]>([]);
  const [patientList, setPatientList] = React.useState<PatientListItem[]>([]);
  const [listLoading, setListLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const [doctorQuery, setDoctorQuery] = React.useState('');
  const [doctorRoleFilter, setDoctorRoleFilter] = React.useState<'ALL' | 'DOCTOR' | 'THERAPIST'>('ALL');
  const [doctorStatusFilter, setDoctorStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [patientQuery, setPatientQuery] = React.useState('');
  const [patientStatusFilter, setPatientStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [resetResult, setResetResult] = React.useState<{
    user_id: string;
    email: string;
    role: string;
    temporary_password: string;
  } | null>(null);
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [resetLoadingId, setResetLoadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem('am_api_base', apiBase);
  }, [apiBase]);

  React.useEffect(() => {
    localStorage.setItem('am_token', token);
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

  const fetchLists = React.useCallback(async (signal?: AbortSignal) => {
    if (userRole !== 'ADMIN') {
      setDoctorList([]);
      setPatientList([]);
      setListLoading(false);
      setListError(null);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const [doctorsResponse, patientsResponse] = await Promise.all([
        fetch(`${apiBase}/admin/doctors`, { headers: authHeader, signal }),
        fetch(`${apiBase}/admin/patients`, { headers: authHeader, signal }),
      ]);
      if (!doctorsResponse.ok || !patientsResponse.ok) {
        const payload = await doctorsResponse.json().catch(() => ({}));
        throw new Error(payload.detail || 'Nie udało się pobrać list administratora.');
      }
      const doctorsPayload = await doctorsResponse.json();
      const patientsPayload = await patientsResponse.json();
      setDoctorList(doctorsPayload);
      setPatientList(patientsPayload);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setListError(err instanceof Error ? err.message : 'Nie udało się pobrać list.');
    } finally {
      setListLoading(false);
    }
  }, [apiBase, authHeader, userRole]);

  React.useEffect(() => {
    const controller = new AbortController();
    fetchLists(controller.signal);
    return () => controller.abort();
  }, [fetchLists]);

  const login = async () => {
    setLoginError(null);
    setLoginLoading(true);
    setToken('');
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
      const nextToken = payload.access_token;
      const role = decodeRoleFromToken(nextToken);
      if (role !== 'ADMIN') {
        throw new Error('To konto nie ma uprawnień administratora.');
      }
      setToken(nextToken);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Nie udało się zalogować');
    } finally {
      setLoginLoading(false);
    }
  };

  const createDoctor = async () => {
    if (userRole !== 'ADMIN') {
      setDoctorError('Brak uprawnień administratora.');
      return;
    }
    if (!doctorForm.email.trim() || !doctorForm.specialization.trim()) {
      setDoctorError('Uzupełnij email i specjalizację.');
      return;
    }
    setDoctorError(null);
    setDoctorNotice(null);
    setDoctorLoading(true);
    try {
      const payload = {
        email: doctorForm.email.trim(),
        specialization: doctorForm.specialization.trim(),
        role: doctorForm.role,
        phone: trimOrNull(doctorForm.phone),
        license_number: trimOrNull(doctorForm.license_number),
      };
      const response = await fetch(`${apiBase}/admin/doctors`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}));
        throw new Error(payloadError.detail || 'Nie udało się utworzyć konta lekarza.');
      }
      const result: AdminDoctorResult = await response.json();
      setDoctorResult(result);
      setDoctorNotice('Utworzono konto lekarza. Przekaż hasło lekarzowi.');
      setDoctorForm({
        email: '',
        specialization: '',
        role: 'DOCTOR',
        phone: '',
        license_number: '',
      });
    } catch (err) {
      setDoctorError(err instanceof Error ? err.message : 'Nie udało się utworzyć konta lekarza.');
    } finally {
      setDoctorLoading(false);
    }
  };

  const createPatient = async () => {
    if (userRole !== 'ADMIN') {
      setPatientError('Brak uprawnień administratora.');
      return;
    }
    if (!patientForm.guardian_full_name.trim() || !patientForm.guardian_email.trim()) {
      setPatientError('Uzupełnij dane opiekuna.');
      return;
    }
    if (!patientForm.child_first_name.trim() || !patientForm.child_last_name.trim() || !patientForm.child_date_of_birth) {
      setPatientError('Uzupełnij dane dziecka.');
      return;
    }
    setPatientError(null);
    setPatientNotice(null);
    setPatientLoading(true);
    try {
      const payload = {
        guardian_full_name: patientForm.guardian_full_name.trim(),
        guardian_email: patientForm.guardian_email.trim(),
        guardian_phone: trimOrNull(patientForm.guardian_phone),
        guardian_address_line: trimOrNull(patientForm.guardian_address_line),
        guardian_city: trimOrNull(patientForm.guardian_city),
        guardian_postal_code: trimOrNull(patientForm.guardian_postal_code),
        guardian_preferred_contact_channel: patientForm.guardian_preferred_contact_channel || null,
        child_first_name: patientForm.child_first_name.trim(),
        child_last_name: patientForm.child_last_name.trim(),
        child_date_of_birth: patientForm.child_date_of_birth,
        child_gender: patientForm.child_gender || null,
        child_pesel: trimOrNull(patientForm.child_pesel),
        child_address_line: trimOrNull(patientForm.child_address_line),
        child_city: trimOrNull(patientForm.child_city),
        child_postal_code: trimOrNull(patientForm.child_postal_code),
        child_school_name: trimOrNull(patientForm.child_school_name),
        child_class_name: trimOrNull(patientForm.child_class_name),
        consent_rodo: patientForm.consent_rodo,
        consent_guardian: patientForm.consent_guardian,
      };
      const response = await fetch(`${apiBase}/admin/patients`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}));
        throw new Error(payloadError.detail || 'Nie udało się utworzyć pacjenta.');
      }
      const result: AdminPatientResult = await response.json();
      setPatientResult(result);
      setPatientNotice('Utworzono konto pacjenta. Przekaż dane logowania opiekunowi.');
      setPatientForm({
        guardian_full_name: '',
        guardian_email: '',
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
        consent_rodo: true,
        consent_guardian: true,
      });
    } catch (err) {
      setPatientError(err instanceof Error ? err.message : 'Nie udało się utworzyć pacjenta.');
    } finally {
      setPatientLoading(false);
    }
  };

  const resetPassword = async (userId: string) => {
    if (userRole !== 'ADMIN') {
      setResetError('Brak uprawnień administratora.');
      return;
    }
    setResetError(null);
    setResetResult(null);
    setResetLoadingId(userId);
    try {
      const response = await fetch(`${apiBase}/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          ...authHeader,
        },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Nie udało się zresetować hasła.');
      }
      const payload = await response.json();
      setResetResult(payload);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Nie udało się zresetować hasła.');
    } finally {
      setResetLoadingId(null);
    }
  };

  const openRecord = (recordCode: string) => {
    navigate(`/akademia-mysli-panel-lekarza?record=${encodeURIComponent(recordCode)}`);
  };

  const copyToClipboard = async (text: string, setNotice: (value: string) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Skopiowano do schowka.');
    } catch (err) {
      setNotice('Nie udało się skopiować.');
    }
  };

  const filteredDoctors = React.useMemo(() => {
    const query = doctorQuery.trim().toLowerCase();
    return doctorList.filter((doctor) => {
      if (doctorRoleFilter !== 'ALL' && doctor.role !== doctorRoleFilter) {
        return false;
      }
      if (doctorStatusFilter !== 'ALL') {
        const isActive = doctor.is_active ? 'ACTIVE' : 'INACTIVE';
        if (isActive !== doctorStatusFilter) {
          return false;
        }
      }
      if (!query) {
        return true;
      }
      const haystack = [
        doctor.email,
        doctor.specialization,
        doctor.phone || '',
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [doctorList, doctorQuery, doctorRoleFilter, doctorStatusFilter]);

  const filteredPatients = React.useMemo(() => {
    const query = patientQuery.trim().toLowerCase();
    return patientList.filter((patient) => {
      if (patientStatusFilter !== 'ALL' && patient.status !== patientStatusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        patient.child_name,
        patient.guardian_name,
        patient.record_code,
        patient.guardian_email || '',
        patient.guardian_phone || '',
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [patientList, patientQuery, patientStatusFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <span className="text-sm uppercase tracking-widest text-primary-600 font-semibold">Panel administratora</span>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Zarządzanie kontami i kartoteką</h1>
          <p className="text-slate-600 max-w-2xl">
            Administrator ma dostęp do wszystkich danych oraz może tworzyć konta lekarzy i pacjentów.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Logowanie administratora</h2>
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
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                disabled={loginLoading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {loginLoading ? 'Loguję...' : 'Zaloguj'}
              </button>
            </div>
            {loginError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {loginError}
              </div>
            )}
            {token && userRole === 'ADMIN' && (
              <div className="mt-3 text-xs text-emerald-600">
                Zalogowano jako: {userRole || 'personel'}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Szybkie wyszukiwanie</h2>
            <label className="text-sm text-slate-600">
              Wyszukaj pacjenta
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
                    onClick={() => openRecord(result.record_code)}
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
            <div className="mt-4 text-xs text-slate-500">
              Kliknij wynik, aby otworzyć kartotekę.
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tworzenie konta lekarza</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Email *
                <input
                  value={doctorForm.email}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                  placeholder="lekarz@akademia-mysli.pl"
                />
              </label>
              <label className="text-sm text-slate-600">
                Specjalizacja *
                <input
                  value={doctorForm.specialization}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, specialization: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Rola
                <select
                  value={doctorForm.role}
                  onChange={(event) =>
                    setDoctorForm((prev) => ({
                      ...prev,
                      role: event.target.value === 'THERAPIST' ? 'THERAPIST' : 'DOCTOR',
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                >
                  <option value="DOCTOR">Lekarz</option>
                  <option value="THERAPIST">Terapeuta</option>
                </select>
              </label>
              <label className="text-sm text-slate-600">
                Telefon (opcjonalnie)
                <input
                  value={doctorForm.phone}
                  onChange={(event) => setDoctorForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm text-slate-600">
              Numer PWZ (opcjonalnie)
              <input
                value={doctorForm.license_number}
                onChange={(event) => setDoctorForm((prev) => ({ ...prev, license_number: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </label>
            {doctorError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {doctorError}
              </div>
            )}
            {doctorNotice && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {doctorNotice}
              </div>
            )}
            <button
              type="button"
              onClick={createDoctor}
              disabled={doctorLoading}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {doctorLoading ? 'Tworzenie...' : 'Utwórz konto lekarza'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Nowe konto lekarza</h3>
            {doctorResult ? (
              <div className="space-y-2 text-sm text-slate-700">
                <div>Email: <span className="font-semibold">{doctorResult.email}</span></div>
                <div>Rola: {doctorResult.role}</div>
                <div>Specjalizacja: {doctorResult.specialization}</div>
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-500 uppercase tracking-widest">Hasło startowe</div>
                  <div className="font-mono text-slate-900 text-base">{doctorResult.temporary_password}</div>
                </div>
                <button
                  type="button"
                  onClick={() => doctorResult && copyToClipboard(doctorResult.temporary_password, setDoctorNotice)}
                  className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Kopiuj hasło
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Brak nowych kont do wyświetlenia.</div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Nowy pacjent (z ulicy)</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Opiekun – imię i nazwisko *
                <input
                  value={patientForm.guardian_full_name}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, guardian_full_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Email opiekuna *
                <input
                  value={patientForm.guardian_email}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, guardian_email: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Telefon
                <input
                  value={patientForm.guardian_phone}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, guardian_phone: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Preferowany kontakt
                <select
                  value={patientForm.guardian_preferred_contact_channel}
                  onChange={(event) =>
                    setPatientForm((prev) => ({
                      ...prev,
                      guardian_preferred_contact_channel: event.target.value as AdminPatientForm['guardian_preferred_contact_channel'],
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                >
                  <option value="">Nie ustawiono</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="PHONE">Telefon</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-600">
                Ulica i numer
                <input
                  value={patientForm.guardian_address_line}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, guardian_address_line: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Miasto
                <input
                  value={patientForm.guardian_city}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, guardian_city: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Kod pocztowy
                <input
                  value={patientForm.guardian_postal_code}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, guardian_postal_code: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Dziecko – imię *
                <input
                  value={patientForm.child_first_name}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, child_first_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Dziecko – nazwisko *
                <input
                  value={patientForm.child_last_name}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, child_last_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Data urodzenia *
                <input
                  type="date"
                  value={patientForm.child_date_of_birth}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, child_date_of_birth: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Płeć
                <select
                  value={patientForm.child_gender}
                  onChange={(event) =>
                    setPatientForm((prev) => ({ ...prev, child_gender: event.target.value as AdminPatientForm['child_gender'] }))
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
            </div>
            <label className="mt-4 block text-sm text-slate-600">
              PESEL (opcjonalnie)
              <input
                value={patientForm.child_pesel}
                onChange={(event) => setPatientForm((prev) => ({ ...prev, child_pesel: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-600">
                Adres dziecka
                <input
                  value={patientForm.child_address_line}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, child_address_line: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Miasto
                <input
                  value={patientForm.child_city}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, child_city: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Kod pocztowy
                <input
                  value={patientForm.child_postal_code}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, child_postal_code: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                Szkoła
                <input
                  value={patientForm.child_school_name}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, child_school_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="text-sm text-slate-600">
                Klasa
                <input
                  value={patientForm.child_class_name}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, child_class_name: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={patientForm.consent_rodo}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, consent_rodo: event.target.checked }))}
                />
                Zgoda RODO
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={patientForm.consent_guardian}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, consent_guardian: event.target.checked }))}
                />
                Zgoda opiekuna
              </label>
            </div>

            {patientError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {patientError}
              </div>
            )}
            {patientNotice && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {patientNotice}
              </div>
            )}

            <button
              type="button"
              onClick={createPatient}
              disabled={patientLoading}
              className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {patientLoading ? 'Tworzenie...' : 'Utwórz konto pacjenta'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Nowy pacjent</h3>
            {patientResult ? (
              <div className="space-y-3 text-sm text-slate-700">
                <div>Kod kartoteki: <span className="font-semibold">{patientResult.record_code}</span></div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-500 uppercase tracking-widest">Hasło startowe opiekuna</div>
                  <div className="font-mono text-slate-900 text-base">{patientResult.temporary_password}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(patientResult.temporary_password, setPatientNotice)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Kopiuj hasło
                </button>
                <button
                  type="button"
                  onClick={() => openRecord(patientResult.record_code)}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Otwórz kartotekę
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Brak nowych pacjentów do wyświetlenia.</div>
            )}
          </div>
        </div>

        <div className="mt-10 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lista lekarzy</h2>
              <p className="text-xs text-slate-500">Personel medyczny i dostęp do resetu haseł.</p>
            </div>
            <button
              type="button"
              onClick={() => fetchLists()}
              disabled={listLoading}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              {listLoading ? 'Odświeżam...' : 'Odśwież listę'}
            </button>
          </div>

          {listError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {listError}
            </div>
          )}
          {resetError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {resetError}
            </div>
          )}
          {resetResult && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Zresetowano hasło: {resetResult.email} ({resetResult.role}). Nowe hasło:{" "}
              <span className="font-mono">{resetResult.temporary_password}</span>
            </div>
          )}

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <label className="text-xs text-slate-500 uppercase tracking-widest">
              Szukaj
              <input
                value={doctorQuery}
                onChange={(event) => setDoctorQuery(event.target.value)}
                placeholder="email, specjalizacja, telefon"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="text-xs text-slate-500 uppercase tracking-widest">
              Rola
              <select
                value={doctorRoleFilter}
                onChange={(event) => setDoctorRoleFilter(event.target.value as typeof doctorRoleFilter)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                <option value="ALL">Wszyscy</option>
                <option value="DOCTOR">Lekarz</option>
                <option value="THERAPIST">Terapeuta</option>
              </select>
            </label>
            <label className="text-xs text-slate-500 uppercase tracking-widest">
              Status
              <select
                value={doctorStatusFilter}
                onChange={(event) => setDoctorStatusFilter(event.target.value as typeof doctorStatusFilter)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                <option value="ALL">Wszystkie</option>
                <option value="ACTIVE">Aktywne</option>
                <option value="INACTIVE">Nieaktywne</option>
              </select>
            </label>
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            {listLoading && <div className="text-sm text-slate-500">Ładowanie...</div>}
            {!listLoading && filteredDoctors.length === 0 && (
              <div className="text-sm text-slate-500">Brak lekarzy do wyświetlenia.</div>
            )}
            {!listLoading && filteredDoctors.map((doctor) => (
              <div key={doctor.doctor_id} className="rounded-lg border border-slate-100 px-3 py-2">
                <div className="font-semibold text-slate-900">{doctor.email}</div>
                <div className="text-xs text-slate-500">
                  {doctor.specialization} • {doctor.role}
                </div>
                <div className="text-xs text-slate-500">
                  Telefon: {doctor.phone || '-'} • Status: {doctor.is_active ? 'Aktywny' : 'Nieaktywny'}
                </div>
                <button
                  type="button"
                  onClick={() => resetPassword(doctor.user_id)}
                  disabled={resetLoadingId === doctor.user_id}
                  className="mt-2 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  {resetLoadingId === doctor.user_id ? 'Resetuję...' : 'Reset hasła'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lista pacjentów</h2>
              <p className="text-xs text-slate-500">Pacjenci z możliwością szybkiego przejścia do kartoteki.</p>
            </div>
            <button
              type="button"
              onClick={() => fetchLists()}
              disabled={listLoading}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              {listLoading ? 'Odświeżam...' : 'Odśwież listę'}
            </button>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs text-slate-500 uppercase tracking-widest">
              Szukaj
              <input
                value={patientQuery}
                onChange={(event) => setPatientQuery(event.target.value)}
                placeholder="pacjent, opiekun, kod"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="text-xs text-slate-500 uppercase tracking-widest">
              Status
              <select
                value={patientStatusFilter}
                onChange={(event) => setPatientStatusFilter(event.target.value as typeof patientStatusFilter)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                <option value="ALL">Wszystkie</option>
                <option value="ACTIVE">Aktywne</option>
                <option value="ARCHIVED">Zarchiwizowane</option>
              </select>
            </label>
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            {listLoading && <div className="text-sm text-slate-500">Ładowanie...</div>}
            {!listLoading && filteredPatients.length === 0 && (
              <div className="text-sm text-slate-500">Brak pacjentów do wyświetlenia.</div>
            )}
            {!listLoading && filteredPatients.map((patient) => (
              <div key={patient.child_id} className="rounded-lg border border-slate-100 px-3 py-2">
                <button
                  type="button"
                  onClick={() => openRecord(patient.record_code)}
                  className="w-full text-left hover:text-primary-600"
                >
                  <div className="font-semibold text-slate-900">{patient.child_name}</div>
                  <div className="text-xs text-slate-500">
                    Kod: {patient.record_code} • Ur.: {formatDate(patient.date_of_birth)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Opiekun: {patient.guardian_name} • {patient.guardian_phone || patient.guardian_email || '-'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => resetPassword(patient.user_id)}
                  disabled={resetLoadingId === patient.user_id}
                  className="mt-2 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  {resetLoadingId === patient.user_id ? 'Resetuję...' : 'Reset hasła'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
