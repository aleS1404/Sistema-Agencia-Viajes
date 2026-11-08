import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Compass,
  CreditCard,
  HeartHandshake,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  MessageSquareWarning,
  PackageSearch,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { API_URL, ApiError, api } from './api';
import type { AdminDashboard, AssistantResponse, Booking, Complaint, Policy, Profile, Provider, Role, Service, User } from './types';

type Notice = { type: 'success' | 'error'; message: string } | null;

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('agencia_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

function money(value: number | string | undefined) {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(value || 0));
}

function dateLabel(value?: string) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(new Date(value));
}

function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  if (!notice) return null;
  return (
    <div className={`notice notice-${notice.type}`} role="status">
      {notice.type === 'success' ? <CheckCircle2 size={19} /> : <MessageSquareWarning size={19} />}
      <span>{notice.message}</span>
      <button className="icon-btn" onClick={onClose} aria-label="Cerrar aviso"><X size={17} /></button>
    </div>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setLoading(true);
    setNotice(null);
    try {
      const result = mode === 'login'
        ? await api.login(String(values.email), String(values.password))
        : await api.register({
            email: String(values.email),
            password: String(values.password),
            firstName: String(values.firstName),
            lastName: String(values.lastName),
            phone: String(values.phone || ''),
            role: values.accountType === 'provider' ? 'PROVIDER' : 'CUSTOMER',
            providerTradeName: values.accountType === 'provider' ? String(values.providerTradeName || '') : undefined,
          });
      onAuthenticated(result.accessToken, result.user);
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <div className="brand brand-light"><span className="brand-mark"><Compass /></span><span>AndesGo</span></div>
        <div className="story-copy">
          <span className="eyebrow">La Paz · Bolivia</span>
          <h1>Viajes con contexto, no con complicaciones.</h1>
          <p>Explora experiencias, organiza tu itinerario y recibe recomendaciones según tus intereses y presupuesto.</p>
          <div className="story-stats">
            <div><strong>100%</strong><span>Datos de demostración</span></div>
            <div><strong>4 roles</strong><span>Acceso protegido</span></div>
            <div><strong>21</strong><span>Casos de uso</span></div>
          </div>
        </div>
        <p className="prototype-note">Prototipo académico. No procesa pagos ni reservas reales.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand"><span className="brand-mark"><Compass /></span>AndesGo</div>
          <span className="eyebrow">{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</span>
          <h2>{mode === 'login' ? 'Ingresa al sistema' : 'Empieza a planificar'}</h2>
          <p className="muted">{mode === 'login' ? 'Usa tus credenciales para continuar.' : 'Elige una cuenta de viajero o proveedor.'}</p>
          <NoticeBar notice={notice} onClose={() => setNotice(null)} />
          <form onSubmit={submit} className="form-stack">
            {mode === 'register' && (
              <>
                <div className="form-grid two">
                  <label>Nombre<input name="firstName" required autoComplete="given-name" /></label>
                  <label>Apellido<input name="lastName" required autoComplete="family-name" /></label>
                </div>
                <label>Tipo de cuenta
                  <select name="accountType" defaultValue="customer" onChange={(e) => {
                    const field = e.currentTarget.form?.querySelector<HTMLElement>('[data-provider-name]');
                    if (field) field.hidden = e.target.value !== 'provider';
                  }}>
                    <option value="customer">Cliente / Viajero</option>
                    <option value="provider">Proveedor turístico</option>
                  </select>
                </label>
                <label data-provider-name hidden>Nombre comercial<input name="providerTradeName" placeholder="Ej. Andes Experiencias" /></label>
                <label>Teléfono<input name="phone" autoComplete="tel" /></label>
              </>
            )}
            <label>Correo electrónico<input name="email" type="email" required autoComplete="email" placeholder="nombre@correo.com" /></label>
            <label>Contraseña<input name="password" type="password" minLength={8} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? <LoaderCircle className="spin" size={18} /> : mode === 'login' ? <LogIn size={18} /> : <Plus size={18} />}
              {loading ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>
          <button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setNotice(null); }}>
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Ingresa'}
          </button>
          <small className="api-label">API: {API_URL}</small>
        </div>
      </section>
    </main>
  );
}

type NavItem = { to: string; label: string; icon: ReactNode; roles?: Role[] };

const navItems: NavItem[] = [
  { to: '/', label: 'Inicio', icon: <LayoutDashboard size={19} /> },
  { to: '/catalogo', label: 'Explorar', icon: <PackageSearch size={19} />, roles: ['CUSTOMER', 'ADMIN'] },
  { to: '/recomendaciones', label: 'Para ti', icon: <Sparkles size={19} />, roles: ['CUSTOMER'] },
  { to: '/reservas', label: 'Mis reservas', icon: <CalendarDays size={19} />, roles: ['CUSTOMER'] },
  { to: '/postventa', label: 'Ayuda y solicitudes', icon: <HeartHandshake size={19} />, roles: ['CUSTOMER'] },
  { to: '/perfil', label: 'Mi perfil', icon: <UserRound size={19} />, roles: ['CUSTOMER', 'PROVIDER', 'SUPPORT', 'ADMIN'] },
  { to: '/proveedor', label: 'Mis servicios', icon: <Store size={19} />, roles: ['PROVIDER'] },
  { to: '/soporte', label: 'Bandeja de atención', icon: <MessageSquareWarning size={19} />, roles: ['SUPPORT'] },
  { to: '/admin/usuarios', label: 'Usuarios', icon: <UsersRound size={19} />, roles: ['ADMIN'] },
  { to: '/admin/catalogo', label: 'Catálogo', icon: <ClipboardList size={19} />, roles: ['ADMIN'] },
  { to: '/admin/politicas', label: 'Políticas', icon: <Settings2 size={19} />, roles: ['ADMIN'] },
  { to: '/admin/reportes', label: 'Dashboard', icon: <BarChart3 size={19} />, roles: ['ADMIN'] },
  { to: '/admin/asistente', label: 'Asistente IA', icon: <Bot size={19} />, roles: ['ADMIN'] },
];

const roleLabel: Record<Role, string> = {
  ADMIN: 'Administrador', CUSTOMER: 'Cliente', SUPPORT: 'Atención al cliente', PROVIDER: 'Proveedor turístico',
};

function AppShell({ user, onLogout, children }: { user: User; onLogout: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const allowed = navItems.filter((item) => !item.roles || item.roles.includes(user.role));
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Compass /></span><span>AndesGo</span></div>
        <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X /></button>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {allowed.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setOpen(false)}>
              {item.icon}<span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{user.firstName?.[0]}{user.lastName?.[0]}</span>
            <span><strong>{user.firstName} {user.lastName}</strong><small>{roleLabel[user.role]}</small></span>
          </div>
          <button className="logout-btn" onClick={onLogout}><LogOut size={18} /> Salir</button>
        </div>
      </aside>
      {open && <button className="overlay" onClick={() => setOpen(false)} aria-label="Cerrar menú" />}
      <div className="app-main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu /></button>
          <div><strong>Sistema de gestión turística</strong><small>Prototipo académico · datos sintéticos</small></div>
          <span className="role-badge"><ShieldCheck size={15} /> {roleLabel[user.role]}</span>
        </header>
        <div className="page-wrap">{children}</div>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

function LoadingState({ label = 'Cargando información…' }: { label?: string }) {
  return <div className="state-card"><LoaderCircle className="spin" /><p>{label}</p></div>;
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="state-card empty">{icon}<h3>{title}</h3><p>{text}</p></div>;
}

function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return <div className="state-card error"><MessageSquareWarning /><h3>No pudimos cargar esta sección</h3><p>{error}</p>{retry && <button className="btn btn-secondary" onClick={retry}>Reintentar</button>}</div>;
}

function StatusPill({ value }: { value?: unknown }) {
  const label = typeof value === 'string' && value.trim() ? value : 'sin estado';
  const normalized = label.toLowerCase();
  const positive = ['active', 'available', 'approved', 'confirmed', 'completed', 'resolved'].includes(normalized);
  const warning = ['pending', 'draft', 'in_progress', 'open', 'requested'].includes(normalized);
  return <span className={`status-pill ${positive ? 'positive' : warning ? 'warning' : 'neutral'}`}>{label.replaceAll('_', ' ')}</span>;
}

function useRemote<T>(load: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(() => {
    setLoading(true); setError('');
    load().then(setData).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  useEffect(() => refresh(), [refresh]);
  return { data, setData, loading, error, refresh };
}

function HomePage({ user }: { user: User }) {
  const navigate = useNavigate();
  const content: Record<Role, { title: string; text: string; actions: Array<[string, string]> }> = {
    CUSTOMER: { title: `Hola, ${user.firstName}. ¿A dónde vamos?`, text: 'Encuentra servicios que coincidan con tu forma de viajar.', actions: [['Explorar catálogo', '/catalogo'], ['Ver recomendaciones', '/recomendaciones']] },
    ADMIN: { title: 'Control del sistema', text: 'Gestiona usuarios, catálogo, políticas e indicadores desde un solo lugar.', actions: [['Ver reportes', '/admin/reportes'], ['Gestionar usuarios', '/admin/usuarios']] },
    SUPPORT: { title: 'Bandeja de atención', text: 'Prioriza solicitudes abiertas y deja cada resolución documentada.', actions: [['Abrir bandeja', '/soporte']] },
    PROVIDER: { title: `Bienvenido, ${user.firstName}`, text: 'Mantén actualizada la información de tus servicios turísticos.', actions: [['Gestionar servicios', '/proveedor']] },
  };
  const current = content[user.role];
  return (
    <>
      <section className="hero-card">
        <div><span className="eyebrow">Panel principal</span><h1>{current.title}</h1><p>{current.text}</p><div className="button-row">{current.actions.map(([label, route]) => <button key={route} className="btn btn-primary" onClick={() => navigate(route)}>{label}<ChevronRight size={17} /></button>)}</div></div>
        <div className="hero-illustration"><span>LP</span><Compass /></div>
      </section>
      <section className="quick-grid">
        <article className="quick-card"><BookOpen /><div><strong>21 casos de uso</strong><p>Flujos trazables desde acceso hasta reportes.</p></div></article>
        <article className="quick-card"><ShieldCheck /><div><strong>Acceso por roles</strong><p>Cada operación valida identidad y permisos.</p></div></article>
        <article className="quick-card"><Sparkles /><div><strong>Recomendación explicable</strong><p>Intereses, presupuesto y duración visibles.</p></div></article>
      </section>
    </>
  );
}

const destinationPhotos: Record<string, { file: string; source: string }> = {
  'la-paz': { file: '/destinations/la-paz.jpg', source: 'https://commons.wikimedia.org/wiki/File:Illimani_La_Paz.jpg' },
  copacabana: { file: '/destinations/copacabana.jpg', source: 'https://commons.wikimedia.org/wiki/File:Copacabana_Titicaca.jpg' },
  coroico: { file: '/destinations/coroico.jpg', source: 'https://commons.wikimedia.org/wiki/File:Coroico_vista_parcial_(La_Paz_-_Bolivia).jpg' },
};

function ServiceCard({ service, selected, onCompare, onReserve }: { service: Service; selected?: boolean; onCompare?: () => void; onReserve?: () => void }) {
  const city = service.destination?.city || 'Bolivia';
  const imageKey = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/(^-|-$)/g, '');
  const photo = destinationPhotos[imageKey];
  return (
    <article className={`service-card ${selected ? 'selected' : ''}`}>
      <div className="service-image">
        <img src={photo?.file || '/destinations/default.svg'} alt={`Vista turística de ${city}`} loading="lazy" />
        <span>{city}</span><Compass />
        {photo && <a className="service-credit" href={photo.source} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Foto y licencia</a>}
      </div>
      <div className="service-body">
        <div className="service-meta"><span>{service.category?.name || 'Servicio'}</span><StatusPill value={service.status} /></div>
        <h3>{service.name}</h3><p>{service.description}</p>
        <div className="service-facts"><span><CalendarDays size={16} /> {service.durationDays} día(s)</span><span><UsersRound size={16} /> {service.capacity} cupos</span></div>
        {service.explanation?.length ? <div className="match-reasons"><Sparkles size={16} /> {service.explanation.join(' · ')}</div> : null}
        <div className="service-footer"><div><small>Desde</small><strong>{money(service.priceBob)}</strong></div><div className="button-row compact">{onCompare && <button className="btn btn-ghost" onClick={onCompare}>{selected ? 'Quitar' : 'Comparar'}</button>}{onReserve && <button className="btn btn-primary" onClick={onReserve}>Reservar</button>}</div></div>
      </div>
    </article>
  );
}

function CatalogPage() {
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selected, setSelected] = useState<Service[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const navigate = useNavigate();
  const buildQuery = () => {
    const params = new URLSearchParams(); if (query) params.set('search', query); if (maxPrice) params.set('maxPrice', maxPrice);
    return params.toString() ? `?${params}` : '';
  };
  const remote = useRemote(() => api.services(buildQuery()), [query, maxPrice]);
  function toggle(service: Service) { setSelected((current) => current.some((s) => s.id === service.id) ? current.filter((s) => s.id !== service.id) : current.length < 3 ? [...current, service] : current); }
  async function reserve(service: Service) {
    try {
      const date = new Date(); date.setDate(date.getDate() + 7);
      await api.createBooking({ items: [{ serviceId: service.id, quantity: 1, serviceDate: date.toISOString().slice(0, 10) }] });
      setNotice({ type: 'success', message: 'Reserva creada. Puedes completar el pago desde Mis reservas.' });
    } catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); }
  }
  return (
    <>
      <PageHeader eyebrow="Catálogo" title="Explora La Paz a tu manera" description="Busca, compara y reserva servicios turísticos de demostración." action={<button className="btn btn-secondary" onClick={() => navigate('/recomendaciones')}><Sparkles size={17} /> Recomendaciones</button>} />
      <NoticeBar notice={notice} onClose={() => setNotice(null)} />
      <section className="filter-bar"><label className="search-field"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar destino o experiencia" aria-label="Buscar servicios" /></label><label>Precio máximo<input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="BOB" /></label></section>
      {selected.length > 0 && <section className="compare-panel"><div><strong>Comparación ({selected.length}/3)</strong><p>Selecciona hasta tres servicios.</p></div><div className="compare-items">{selected.map((s) => <div key={s.id}><strong>{s.name}</strong><span>{money(s.priceBob)} · {s.durationDays} día(s)</span></div>)}</div><button className="icon-btn" onClick={() => setSelected([])}><X /></button></section>}
      {remote.loading ? <LoadingState /> : remote.error ? <ErrorState error={remote.error} retry={remote.refresh} /> : !remote.data?.length ? <EmptyState icon={<PackageSearch />} title="No encontramos servicios" text="Prueba con otro término o un presupuesto mayor." /> : <section className="card-grid">{remote.data.map((service) => <ServiceCard key={service.id} service={service} selected={selected.some((s) => s.id === service.id)} onCompare={() => toggle(service)} onReserve={() => reserve(service)} />)}</section>}
    </>
  );
}

function RecommendationsPage() {
  const remote = useRemote(api.recommendations, []);
  const [notice, setNotice] = useState<Notice>(null);
  async function reserve(service: Service) {
    const date = new Date(); date.setDate(date.getDate() + 7);
    try { await api.createBooking({ items: [{ serviceId: service.id, quantity: 1, serviceDate: date.toISOString().slice(0, 10) }] }); setNotice({ type: 'success', message: 'Reserva creada desde tu recomendación.' }); }
    catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); }
  }
  return <><PageHeader eyebrow="Inteligencia aplicada" title="Recomendado para ti" description="Resultados explicables según tus intereses, presupuesto y días disponibles." /><NoticeBar notice={notice} onClose={() => setNotice(null)} />{remote.loading ? <LoadingState label="Calculando coincidencias…" /> : remote.error ? <ErrorState error={remote.error} retry={remote.refresh} /> : !remote.data?.length ? <EmptyState icon={<Sparkles />} title="Aún no hay coincidencias" text="Completa tus preferencias para recibir recomendaciones." /> : <section className="card-grid">{remote.data.map((service) => <ServiceCard key={service.id} service={service} onReserve={() => reserve(service)} />)}</section>}</>;
}

function BookingsPage() {
  const remote = useRemote(api.bookings, []);
  const [notice, setNotice] = useState<Notice>(null);
  async function pay(booking: Booking) {
    try { await api.pay(booking.id, { method: 'card_simulated', amount: Number(booking.totalAmount) }); setNotice({ type: 'success', message: `Pago simulado aprobado para ${booking.code}.` }); remote.refresh(); }
    catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); }
  }
  return <><PageHeader eyebrow="Operación" title="Reservas e itinerarios" description="Consulta el detalle, estado y pagos de tus viajes." /><NoticeBar notice={notice} onClose={() => setNotice(null)} />{remote.loading ? <LoadingState /> : remote.error ? <ErrorState error={remote.error} retry={remote.refresh} /> : !remote.data?.length ? <EmptyState icon={<CalendarDays />} title="Todavía no tienes reservas" text="Explora el catálogo y reserva tu primera experiencia." /> : <section className="list-stack">{remote.data.map((booking) => <article className="booking-card" key={booking.id}><div className="booking-code"><span><CalendarDays /></span><div><small>Reserva</small><strong>{booking.code}</strong></div></div><div><small>Fecha</small><strong>{dateLabel(booking.bookedAt)}</strong></div><div><small>Total</small><strong>{money(booking.totalAmount)}</strong></div><StatusPill value={booking.status} /><div className="booking-actions">{booking.status === 'pending' && <button className="btn btn-primary" onClick={() => pay(booking)}><CreditCard size={17} /> Pagar</button>}<details><summary>Ver itinerario</summary><div className="itinerary">{booking.items?.length ? booking.items.map((item) => <div key={item.id}><strong>{item.service?.name || `Servicio #${item.serviceId}`}</strong><span>{dateLabel(item.serviceDate)} · {item.quantity} persona(s)</span></div>) : <p>El itinerario se mostrará al cargar el detalle.</p>}</div></details></div></article>)}</section>}</>;
}

function PostSalePage() {
  const bookings = useRemote(api.bookings, []);
  const complaints = useRemote(api.complaints, []);
  const [notice, setNotice] = useState<Notice>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget));
    try { await api.createComplaint({ bookingId: body.bookingId ? Number(body.bookingId) : undefined, subject: String(body.subject), description: String(body.description) }); setNotice({ type: 'success', message: 'Reclamo registrado correctamente.' }); event.currentTarget.reset(); complaints.refresh(); }
    catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); }
  }
  async function request(kind: 'cancel' | 'refund', booking: Booking) {
    const reason = window.prompt(`Motivo de ${kind === 'cancel' ? 'cancelación' : 'reembolso'}:`); if (!reason) return;
    try { kind === 'cancel' ? await api.cancel(booking.id, reason) : await api.requestRefund(booking.id, reason); setNotice({ type: 'success', message: 'Solicitud registrada para revisión.' }); }
    catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); }
  }
  return <><PageHeader eyebrow="Postventa" title="Ayuda y solicitudes" description="Gestiona cancelaciones, reembolsos y reclamos con trazabilidad." /><NoticeBar notice={notice} onClose={() => setNotice(null)} /><div className="split-layout"><section className="panel"><div className="panel-title"><div><h2>Solicitudes sobre reservas</h2><p>El personal de atención revisará cada caso.</p></div></div>{bookings.loading ? <LoadingState /> : bookings.data?.length ? <div className="mini-list">{bookings.data.map((b) => <div key={b.id}><span><strong>{b.code}</strong><small>{money(b.totalAmount)} · {b.status}</small></span><span className="button-row compact"><button className="btn btn-ghost" onClick={() => request('cancel', b)}>Cancelar</button><button className="btn btn-ghost" onClick={() => request('refund', b)}>Reembolso</button></span></div>)}</div> : <p className="muted">No hay reservas disponibles.</p>}</section><section className="panel"><h2>Registrar reclamo</h2><form className="form-stack" onSubmit={submit}><label>Reserva relacionada<select name="bookingId"><option value="">Sin reserva</option>{bookings.data?.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}</select></label><label>Asunto<input name="subject" required /></label><label>Descripción<textarea name="description" rows={4} required /></label><button className="btn btn-primary"><MessageSquareWarning size={17} /> Enviar reclamo</button></form></section></div><section className="panel section-space"><h2>Mis reclamos</h2>{complaints.loading ? <LoadingState /> : complaints.data?.length ? <div className="table-wrap"><table><thead><tr><th>Código</th><th>Asunto</th><th>Estado</th><th>Resolución</th></tr></thead><tbody>{complaints.data.map((c) => <tr key={c.id}><td>{c.code}</td><td>{c.subject}</td><td><StatusPill value={c.status} /></td><td>{c.resolution || 'Pendiente'}</td></tr>)}</tbody></table></div> : <p className="muted">No registraste reclamos.</p>}</section></>;
}

function ProfilePage({ user, setUser }: { user: User; setUser: (user: User) => void }) {
  const profile = useRemote(api.profile, []);
  const interests = useRemote(api.interests, []);
  const [notice, setNotice] = useState<Notice>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const interestIds = form.getAll('interests').map(Number);
    try {
      const updatedUser = await api.updateMe({ firstName: String(form.get('firstName')), lastName: String(form.get('lastName')), phone: String(form.get('phone') || '') });
      await api.updateProfile({ maxBudgetBob: Number(form.get('maxBudgetBob') || 0), availableDays: Number(form.get('availableDays') || 1), notes: String(form.get('notes') || ''), interestIds });
      setUser(updatedUser); localStorage.setItem('agencia_user', JSON.stringify(updatedUser)); setNotice({ type: 'success', message: 'Perfil actualizado.' }); profile.refresh();
    } catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); }
  }
  return <><PageHeader eyebrow="Cuenta" title="Perfil y preferencias" description="Mantén tus datos actualizados para personalizar la experiencia." /><NoticeBar notice={notice} onClose={() => setNotice(null)} />{profile.loading ? <LoadingState /> : profile.error ? <ErrorState error={profile.error} retry={profile.refresh} /> : <section className="panel form-panel"><form className="form-stack" onSubmit={submit}><div className="form-grid two"><label>Nombre<input name="firstName" defaultValue={user.firstName} required /></label><label>Apellido<input name="lastName" defaultValue={user.lastName} required /></label></div><div className="form-grid two"><label>Teléfono<input name="phone" defaultValue={user.phone || ''} /></label><label>Correo<input value={user.email} disabled /></label></div>{user.role === 'CUSTOMER' && <><div className="form-grid two"><label>Presupuesto máximo (BOB)<input name="maxBudgetBob" type="number" min="0" defaultValue={profile.data?.maxBudgetBob || ''} /></label><label>Días disponibles<input name="availableDays" type="number" min="1" defaultValue={profile.data?.availableDays || ''} /></label></div><fieldset><legend>Intereses</legend><div className="check-grid">{interests.data?.map((interest) => <label className="check-card" key={interest.id}><input type="checkbox" name="interests" value={interest.id} defaultChecked={profile.data?.interests.some((i) => i.id === interest.id)} /><span>{interest.name}</span></label>)}</div></fieldset><label>Notas para personalizar<textarea name="notes" rows={3} defaultValue={profile.data?.notes || ''} /></label></>}<button className="btn btn-primary"><CheckCircle2 size={17} /> Guardar cambios</button></form></section>}</>;
}

function UsersPage() {
  const remote = useRemote(api.users, []); const [notice, setNotice] = useState<Notice>(null);
  async function update(user: User, body: Partial<Pick<User, 'status' | 'role'>>) { try { await api.updateUser(user.id, body); setNotice({ type: 'success', message: 'Usuario actualizado.' }); remote.refresh(); } catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); } }
  return <><PageHeader eyebrow="Administración" title="Usuarios y accesos" description="Gestiona estados y roles autorizados del sistema." /><NoticeBar notice={notice} onClose={() => setNotice(null)} />{remote.loading ? <LoadingState /> : remote.error ? <ErrorState error={remote.error} retry={remote.refresh} /> : <div className="table-wrap panel"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{remote.data?.map((u) => <tr key={u.id}><td><strong>{u.firstName} {u.lastName}</strong><small>{u.email}</small></td><td><select value={u.role} onChange={(e) => update(u, { role: e.target.value as Role })}>{(['ADMIN', 'CUSTOMER', 'SUPPORT', 'PROVIDER'] as Role[]).map((role) => <option key={role}>{role}</option>)}</select></td><td><StatusPill value={u.status} /></td><td><button className="btn btn-ghost" onClick={() => update(u, { status: u.status === 'active' ? 'blocked' : 'active' })}>{u.status === 'active' ? 'Bloquear' : 'Activar'}</button></td></tr>)}</tbody></table></div>}</>;
}

function CatalogAdminPage({ providerMode = false }: { providerMode?: boolean }) {
  const services = useRemote(() => api.services(providerMode ? '?mine=true' : ''), [providerMode]);
  const providers = useRemote(api.providers, []); const [notice, setNotice] = useState<Notice>(null); const [showForm, setShowForm] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const f = Object.fromEntries(new FormData(event.currentTarget)); try { await api.createService({ name: String(f.name), code: String(f.code), description: String(f.description), durationDays: Number(f.durationDays), priceBob: Number(f.priceBob), capacity: Number(f.capacity), status: providerMode ? 'draft' : 'available', ...(f.providerId ? { providerId: Number(f.providerId) } : {}) } as Partial<Service>); setNotice({ type: 'success', message: providerMode ? 'Servicio enviado como borrador para validación.' : 'Servicio creado.' }); setShowForm(false); services.refresh(); } catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); } }
  return <><PageHeader eyebrow={providerMode ? 'Portal de proveedor' : 'Administración'} title={providerMode ? 'Mis servicios turísticos' : 'Catálogo y proveedores'} description={providerMode ? 'Publica borradores y mantén actualizada tu oferta.' : 'Controla la oferta disponible y sus responsables.'} action={<button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={17} /> Nuevo servicio</button>} /><NoticeBar notice={notice} onClose={() => setNotice(null)} />{showForm && <section className="panel section-space"><h2>Registrar servicio</h2><form className="form-stack" onSubmit={submit}><div className="form-grid two"><label>Código<input name="code" required placeholder="SRV-003" /></label><label>Nombre<input name="name" required /></label></div><label>Descripción<textarea name="description" rows={3} required /></label><div className="form-grid three"><label>Duración (días)<input type="number" name="durationDays" min="1" required /></label><label>Precio BOB<input type="number" name="priceBob" min="0" required /></label><label>Capacidad<input type="number" name="capacity" min="1" required /></label></div>{!providerMode && <label>Proveedor<select name="providerId"><option value="">Seleccionar</option>{providers.data?.map((p) => <option key={p.id} value={p.id}>{p.tradeName}</option>)}</select></label>}<button className="btn btn-primary">Guardar servicio</button></form></section>}{services.loading ? <LoadingState /> : services.error ? <ErrorState error={services.error} retry={services.refresh} /> : !services.data?.length ? <EmptyState icon={<Store />} title="No hay servicios" text="Registra el primero para comenzar." /> : <div className="table-wrap panel"><table><thead><tr><th>Servicio</th><th>Precio</th><th>Duración</th><th>Estado</th></tr></thead><tbody>{services.data.map((s) => <tr key={s.id}><td><strong>{s.name}</strong><small>{s.code}</small></td><td>{money(s.priceBob)}</td><td>{s.durationDays} día(s)</td><td><StatusPill value={s.status} /></td></tr>)}</tbody></table></div>}</>;
}

function SupportPage() {
  const remote = useRemote(api.complaints, []);
  const cancellations = useRemote(api.supportCancellations, []);
  const [notice, setNotice] = useState<Notice>(null);
  async function resolve(complaint: Complaint) { const resolution = window.prompt('Describe la resolución:'); if (!resolution) return; try { await api.updateComplaint(complaint.id, { status: 'resolved', resolution }); setNotice({ type: 'success', message: 'Caso resuelto y documentado.' }); remote.refresh(); } catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); } }
  async function decideCancellation(item: Record<string, unknown>, status: 'approved' | 'rejected') {
    try {
      await api.resolveCancellation(Number(item.id), status);
      if (status === 'approved' && Number(item.totalAmount) > 0 && String(item.reason).toLowerCase().includes('reembolso')) {
        await api.approveRefund(Number(item.id), Number(item.totalAmount));
      }
      setNotice({ type: 'success', message: status === 'approved' ? 'Solicitud aprobada y procesada.' : 'Solicitud rechazada.' });
      cancellations.refresh();
    } catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); }
  }
  return <><PageHeader eyebrow="Atención al cliente" title="Bandeja de casos" description="Atiende cancelaciones, reembolsos y reclamos con trazabilidad." /><NoticeBar notice={notice} onClose={() => setNotice(null)} />
    <section className="panel"><h2>Cancelaciones y reembolsos</h2>{cancellations.loading ? <LoadingState /> : cancellations.error ? <ErrorState error={cancellations.error} retry={cancellations.refresh} /> : !cancellations.data?.length ? <p className="muted">No hay solicitudes pendientes.</p> : <div className="table-wrap"><table><thead><tr><th>Reserva</th><th>Cliente</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{cancellations.data.map((item) => <tr key={Number(item.id)}><td>{String(item.bookingCode)}</td><td>{String(item.customer)}</td><td>{String(item.reason)}</td><td><StatusPill value={String(item.status)} /></td><td><span className="button-row compact">{item.status === 'requested' && <><button className="btn btn-primary" onClick={() => decideCancellation(item, 'approved')}>Aprobar</button><button className="btn btn-ghost" onClick={() => decideCancellation(item, 'rejected')}>Rechazar</button></>}</span></td></tr>)}</tbody></table></div>}</section>
    <section className="section-space"><h2>Reclamos</h2>{remote.loading ? <LoadingState /> : remote.error ? <ErrorState error={remote.error} retry={remote.refresh} /> : !remote.data?.length ? <EmptyState icon={<HeartHandshake />} title="Bandeja al día" text="No hay reclamos pendientes." /> : <div className="case-grid">{remote.data.map((c) => <article className="case-card" key={c.id}><div><span className="eyebrow">{c.code}</span><h3>{c.subject}</h3><p>{c.description}</p></div><div className="case-meta"><StatusPill value={c.status} /><span>{dateLabel(c.createdAt)}</span></div>{c.status !== 'resolved' && c.status !== 'closed' && <button className="btn btn-primary" onClick={() => resolve(c)}>Resolver caso</button>}{c.resolution && <div className="resolution"><strong>Resolución</strong><p>{c.resolution}</p></div>}</article>)}</div>}</section></>;
}

function PoliciesPage() {
  const remote = useRemote(api.policies, []); const [notice, setNotice] = useState<Notice>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const f = Object.fromEntries(new FormData(event.currentTarget)); try { await api.createPolicy({ name: String(f.name), description: String(f.description), cancellationHours: Number(f.cancellationHours), refundPercentage: Number(f.refundPercentage), active: true }); setNotice({ type: 'success', message: 'Política creada.' }); event.currentTarget.reset(); remote.refresh(); } catch (e) { setNotice({ type: 'error', message: errorMessage(e) }); } }
  return <><PageHeader eyebrow="Administración" title="Políticas comerciales" description="Configura reglas demostrativas de cancelación y reembolso." /><NoticeBar notice={notice} onClose={() => setNotice(null)} /><div className="split-layout"><section className="panel"><h2>Nueva política</h2><form className="form-stack" onSubmit={submit}><label>Nombre<input name="name" required /></label><label>Descripción<textarea name="description" rows={3} required /></label><div className="form-grid two"><label>Anticipación mínima (horas)<input name="cancellationHours" type="number" min="0" required /></label><label>Reembolso máximo (%)<input name="refundPercentage" type="number" min="0" max="100" required /></label></div><button className="btn btn-primary">Guardar política</button></form></section><section className="panel"><h2>Políticas registradas</h2>{remote.loading ? <LoadingState /> : remote.data?.length ? <div className="mini-list">{remote.data.map((p) => <div key={p.id}><span><strong>{p.name}</strong><small>{p.cancellationHours} h · {p.refundPercentage}%</small></span><StatusPill value={p.active ? 'active' : 'disabled'} /></div>)}</div> : <p className="muted">No hay políticas configuradas.</p>}</section></div></>;
}

function ForecastChart({ dashboard }: { dashboard: AdminDashboard }) {
  const history = dashboard.forecast.history.slice(-14);
  const future = dashboard.forecast.points;
  const values = [...history.map((point) => point.bookings), ...future.map((point) => point.bookings)];
  const maximum = Math.max(1, ...values);
  const width = 760; const height = 230; const padding = 28;
  const point = (value: number, index: number) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, values.length - 1);
    const y = height - padding - (value / maximum) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const historyPoints = history.map((item, index) => point(item.bookings, index)).join(' ');
  const forecastValues = history.length ? [history[history.length - 1].bookings, ...future.map((item) => item.bookings)] : future.map((item) => item.bookings);
  const forecastPoints = forecastValues.map((value, index) => point(value, Math.max(0, history.length - 1) + index)).join(' ');
  return <div className="forecast-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Histórico y proyección de reservas"><line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-axis" /><polyline points={historyPoints} className="chart-history" /><polyline points={forecastPoints} className="chart-forecast" /></svg><div className="chart-legend"><span><i className="legend-history" /> Histórico</span><span><i className="legend-forecast" /> Proyección</span></div></div>;
}

function ReportsPage() {
  const today = new Date(); const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 29);
  const initial = { dateFrom: monthAgo.toISOString().slice(0, 10), dateTo: today.toISOString().slice(0, 10), destinationId: '', status: '', forecastDays: '7' };
  const [draft, setDraft] = useState(initial); const [filters, setFilters] = useState(initial);
  const destinations = useRemote(api.destinations, []);
  const query = useMemo(() => { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); }); return `?${params}`; }, [filters]);
  const remote = useRemote<AdminDashboard>(() => api.dashboard(query), [query]);
  const data = remote.data;
  const metrics: Array<[string, string | number, ReactNode]> = data ? [
    ['Reservas', data.kpis.bookings, <CalendarDays />], ['Confirmadas', data.kpis.confirmedBookings, <CheckCircle2 />], ['Ingresos aprobados', money(data.kpis.revenueBob), <CircleDollarSign />], ['Ticket promedio', money(data.kpis.averageTicketBob), <TrendingUp />], ['Cancelaciones', data.kpis.cancellations, <X />], ['Reclamos abiertos', data.kpis.openComplaints, <MessageSquareWarning />], ['Servicios activos', data.kpis.activeServices, <Store />], ['Usuarios activos', data.kpis.activeUsers, <UsersRound />],
  ] : [];
  const topMax = Math.max(1, ...(data?.topServices.map((item) => item.bookings) || [1]));
  const statusMax = Math.max(1, ...(data?.bookingStatus.map((item) => item.total) || [1]));
  return <><PageHeader eyebrow="Inteligencia administrativa" title="Dashboard predictivo" description="Indicadores, alertas y estimaciones explicables calculadas con los datos sintéticos del prototipo." />
    <form className="dashboard-filters panel" onSubmit={(event) => { event.preventDefault(); setFilters(draft); }}><label>Desde<input type="date" value={draft.dateFrom} onChange={(event) => setDraft({ ...draft, dateFrom: event.target.value })} /></label><label>Hasta<input type="date" value={draft.dateTo} onChange={(event) => setDraft({ ...draft, dateTo: event.target.value })} /></label><label>Destino<select value={draft.destinationId} onChange={(event) => setDraft({ ...draft, destinationId: event.target.value })}><option value="">Todos</option>{destinations.data?.map((item) => <option value={item.id} key={item.id}>{item.city}</option>)}</select></label><label>Estado<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option value="">Todos</option><option value="pending">Pendiente</option><option value="confirmed">Confirmada</option><option value="completed">Completada</option><option value="cancelled">Cancelada</option></select></label><label>Proyección<select value={draft.forecastDays} onChange={(event) => setDraft({ ...draft, forecastDays: event.target.value })}><option value="7">7 días</option><option value="14">14 días</option><option value="30">30 días</option></select></label><button className="btn btn-primary">Aplicar filtros</button></form>
    {remote.loading ? <LoadingState label="Calculando indicadores…" /> : remote.error ? <ErrorState error={remote.error} retry={remote.refresh} /> : data && <><section className="metric-grid dashboard-metrics">{metrics.map(([label, value, icon]) => <article className="metric-card" key={label}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>)}</section>
      <div className="dashboard-main section-space"><section className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">Modelo: {data.forecast.model}</span><h2>Demanda proyectada</h2></div><span className="confidence">{data.forecast.confidence}% confianza orientativa</span></div><ForecastChart dashboard={data} /><div className="forecast-summary"><div><small>Tendencia</small><strong>{data.forecast.trend}</strong></div><div><small>Reservas proyectadas</small><strong>{data.forecast.projectedBookings}</strong></div><div><small>Ingreso proyectado</small><strong>{money(data.forecast.projectedRevenueBob)}</strong></div></div><p className="model-note">{data.forecast.disclaimer}</p></section><aside className="panel"><h2>Alertas operativas</h2><div className="alert-list">{data.alerts.length ? data.alerts.map((alert, index) => <div className={`alert-item ${alert.severity}`} key={`${alert.title}-${index}`}><AlertTriangle size={18} /><span>{alert.title}</span></div>) : <p className="muted">No existen alertas para el periodo.</p>}</div></aside></div>
      <div className="split-layout section-space"><section className="panel"><h2>Servicios más reservados</h2><div className="bar-list">{data.topServices.map((item) => <div key={item.id}><div><strong>{item.name}</strong><span>{item.bookings}</span></div><span className="bar-track"><span style={{ width: `${(item.bookings / topMax) * 100}%` }} /></span></div>)}</div></section><section className="panel"><h2>Reservas por estado</h2><div className="bar-list">{data.bookingStatus.map((item) => <div key={item.status}><div><strong>{item.status.replaceAll('_', ' ')}</strong><span>{item.total}</span></div><span className="bar-track"><span style={{ width: `${(item.total / statusMax) * 100}%` }} /></span></div>)}</div></section></div>
      <section className="panel section-space"><div className="panel-title"><div><span className="eyebrow">Indicador preventivo</span><h2>Riesgo de cancelación</h2></div><small>Reglas ponderadas y factores visibles</small></div><div className="table-wrap"><table><thead><tr><th>Reserva</th><th>Cliente</th><th>Importe</th><th>Puntaje</th><th>Nivel</th><th>Factores</th></tr></thead><tbody>{data.cancellationRisks.map((risk) => <tr key={risk.id}><td><strong>{risk.code}</strong><small>{risk.status}</small></td><td>{risk.customer}</td><td>{money(risk.totalAmount)}</td><td><strong>{risk.score}/100</strong></td><td><span className={`risk-pill risk-${risk.level}`}>{risk.level}</span></td><td>{risk.factors.join(' · ')}</td></tr>)}</tbody></table></div>{!data.cancellationRisks.length && <p className="muted">No hay reservas activas para evaluar.</p>}</section>
    </>}</>;
}

type ChatMessage = { role: 'user' | 'assistant'; text: string; response?: AssistantResponse };

function AdminAssistantPage() {
  const navigate = useNavigate(); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false); const [notice, setNotice] = useState<Notice>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', text: 'Hola. Puedo consultar reservas, ingresos, usuarios, reclamos, destinos y riesgos con datos actuales del sistema.' }]);
  const prompts = ['¿Cuántas reservas están confirmadas?', '¿Cuál es el servicio más reservado?', '¿Cuántos reclamos están abiertos?', '¿Hay reservas con riesgo alto?'];
  async function ask(text: string) { const clean = text.trim(); if (!clean || loading) return; setMessages((current) => [...current, { role: 'user', text: clean }]); setMessage(''); setLoading(true); setNotice(null); try { const response = await api.assistant(clean); setMessages((current) => [...current, { role: 'assistant', text: response.answer, response }]); } catch (error) { setNotice({ type: 'error', message: errorMessage(error) }); } finally { setLoading(false); } }
  return <><PageHeader eyebrow="Consulta administrativa" title="Asistente de datos" description="Interpreta preguntas frecuentes mediante intenciones y responde con información viva de la base de datos." /><NoticeBar notice={notice} onClose={() => setNotice(null)} /><div className="assistant-layout"><section className="panel chat-panel"><div className="chat-messages" aria-live="polite">{messages.map((item, index) => <div className={`chat-bubble ${item.role}`} key={index}><span>{item.role === 'assistant' ? <Bot size={18} /> : <UserRound size={18} />}</span><div><p>{item.text}</p>{item.response?.actions.map((action) => <button className="btn btn-ghost" key={action.route} onClick={() => navigate(action.route)}>{action.label}<ChevronRight size={16} /></button>)}</div></div>)}{loading && <div className="chat-bubble assistant"><span><Bot size={18} /></span><div><p>Consultando los datos…</p></div></div>}</div><form className="assistant-form" onSubmit={(event) => { event.preventDefault(); void ask(message); }}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ej.: ¿Cuántos reclamos están abiertos?" maxLength={300} /><button className="btn btn-primary" disabled={loading || !message.trim()} aria-label="Enviar consulta"><Send size={18} /> Enviar</button></form></section><aside className="panel assistant-help"><Activity /><h2>Consultas sugeridas</h2><p className="muted">Las respuestas son explicables y no usan servicios externos.</p><div className="quick-prompts">{prompts.map((prompt) => <button className="btn btn-ghost" onClick={() => void ask(prompt)} key={prompt}>{prompt}</button>)}</div><div className="model-note"><strong>Alcance:</strong> asistente académico basado en reglas de intención. No reemplaza una decisión humana.</div></aside></div></>;
}

function NotAllowed() { return <ErrorState error="Tu rol no tiene permiso para acceder a esta sección." />; }

function ProtectedRole({ user, roles, children }: { user: User; roles: Role[]; children: ReactNode }) { return roles.includes(user.role) ? children : <NotAllowed />; }

export default function App() {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem('agencia_token')));

  useEffect(() => {
    if (!localStorage.getItem('agencia_token')) { setChecking(false); return; }
    api.me().then((fresh) => { setUser(fresh); localStorage.setItem('agencia_user', JSON.stringify(fresh)); }).catch(() => { localStorage.removeItem('agencia_token'); localStorage.removeItem('agencia_user'); setUser(null); }).finally(() => setChecking(false));
  }, []);

  function authenticated(token: string, nextUser: User) { localStorage.setItem('agencia_token', token); localStorage.setItem('agencia_user', JSON.stringify(nextUser)); setUser(nextUser); }
  function logout() { localStorage.removeItem('agencia_token'); localStorage.removeItem('agencia_user'); setUser(null); }
  if (checking) return <div className="fullscreen-loading"><LoaderCircle className="spin" /><span>Validando sesión…</span></div>;
  if (!user) return <AuthScreen onAuthenticated={authenticated} />;

  return <AppShell user={user} onLogout={logout}><Routes>
    <Route path="/" element={<HomePage user={user} />} />
    <Route path="/catalogo" element={<ProtectedRole user={user} roles={['CUSTOMER', 'ADMIN']}><CatalogPage /></ProtectedRole>} />
    <Route path="/recomendaciones" element={<ProtectedRole user={user} roles={['CUSTOMER']}><RecommendationsPage /></ProtectedRole>} />
    <Route path="/reservas" element={<ProtectedRole user={user} roles={['CUSTOMER']}><BookingsPage /></ProtectedRole>} />
    <Route path="/postventa" element={<ProtectedRole user={user} roles={['CUSTOMER']}><PostSalePage /></ProtectedRole>} />
    <Route path="/perfil" element={<ProfilePage user={user} setUser={setUser} />} />
    <Route path="/proveedor" element={<ProtectedRole user={user} roles={['PROVIDER']}><CatalogAdminPage providerMode /></ProtectedRole>} />
    <Route path="/soporte" element={<ProtectedRole user={user} roles={['SUPPORT']}><SupportPage /></ProtectedRole>} />
    <Route path="/admin/usuarios" element={<ProtectedRole user={user} roles={['ADMIN']}><UsersPage /></ProtectedRole>} />
    <Route path="/admin/catalogo" element={<ProtectedRole user={user} roles={['ADMIN']}><CatalogAdminPage /></ProtectedRole>} />
    <Route path="/admin/politicas" element={<ProtectedRole user={user} roles={['ADMIN']}><PoliciesPage /></ProtectedRole>} />
    <Route path="/admin/reportes" element={<ProtectedRole user={user} roles={['ADMIN']}><ReportsPage /></ProtectedRole>} />
    <Route path="/admin/asistente" element={<ProtectedRole user={user} roles={['ADMIN']}><AdminAssistantPage /></ProtectedRole>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AppShell>;
}
