import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, clearSession, getUser, saveSession } from './api';

function Navbar() {
  const user = getUser();
  const navigate = useNavigate();
  return (
    <header className="nav">
      <Link to="/" className="brand">Go<span>Ride</span></Link>
      <nav className="nav-links">
        <Link to="/">Search</Link>
        <Link to="/bookings">My tickets</Link>
        {user ? (
          <>
            <span>{user.name}</span>
            <button className="btn secondary" onClick={() => { clearSession(); navigate('/'); }}>
              Logout
            </button>
          </>
        ) : (
          <Link className="btn" to="/login">Login</Link>
        )}
      </nav>
    </header>
  );
}

function Home() {
  const navigate = useNavigate();
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const [from, setFrom] = useState('Bengaluru');
  const [to, setTo] = useState('Chennai');
  const [date, setDate] = useState(tomorrow);

  function search(e) {
    e.preventDefault();
    navigate(`/results?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`);
  }

  return (
    <div className="wrap">
      <section className="hero">
        <h1>Book intercity buses without the noise.</h1>
        <p>Search routes, pick seats, and confirm in under a minute. Sample MERN app with a 2026-style dark UI.</p>
      </section>
      <form className="card search" onSubmit={search}>
        <div>
          <label>From</label>
          <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Bengaluru" />
        </div>
        <div>
          <label>To</label>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Chennai" />
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className="btn" style={{ alignSelf: 'end' }}>Search buses</button>
      </form>
      <p className="footer-note">Try seeded routes: Bengaluru → Chennai / Hyderabad / Mysuru.</p>
    </div>
  );
}

function Results() {
  const [params] = useSearchParams();
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const date = params.get('date') || '';

  useEffect(() => {
    setLoading(true);
    api.buses({ from, to, date })
      .then(setBuses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to, date]);

  return (
    <div className="wrap">
      <h2>{from} → {to}</h2>
      <p className="meta">{date}</p>
      {loading && <p className="meta">Loading buses…</p>}
      {error && <p className="alert">{error}</p>}
      <div className="list">
        {buses.map((bus) => (
          <article className="card bus" key={bus._id}>
            <div>
              <h3>{bus.operator}</h3>
              <div className="meta">{bus.type} · {bus.duration}</div>
            </div>
            <div>
              <strong>{bus.departureTime}</strong> → {bus.arrivalTime}
            </div>
            <div className="price">₹{bus.price}</div>
            <Link className="btn" to={`/book/${bus._id}`}>Select seats</Link>
          </article>
        ))}
        {!loading && !buses.length && <p className="meta">No buses for this search. Seed data first.</p>}
      </div>
    </div>
  );
}

function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [bus, setBus] = useState(null);
  const [picked, setPicked] = useState([]);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('9876543210');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.bus(id).then(setBus).catch((e) => setMsg(e.message));
  }, [id]);

  function toggle(seat) {
    if (bus.bookedSeats.includes(seat)) return;
    setPicked((prev) => prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]);
  }

  async function confirm() {
    if (!user) return navigate('/login');
    try {
      const booking = await api.book({
        busId: id,
        seats: picked,
        passengerName: name,
        passengerPhone: phone,
      });
      navigate('/bookings', { state: { justBooked: booking._id } });
    } catch (e) {
      setMsg(e.message);
    }
  }

  if (!bus) return <div className="wrap"><p className="meta">{msg || 'Loading…'}</p></div>;

  const seats = Array.from({ length: bus.totalSeats }, (_, i) => i + 1);

  return (
    <div className="wrap">
      <div className="card">
        <h2>{bus.operator}</h2>
        <p className="meta">{bus.from} → {bus.to} · {bus.date} · {bus.departureTime}</p>
        <div className="seats">
          {seats.map((seat) => {
            const taken = bus.bookedSeats.includes(seat);
            const selected = picked.includes(seat);
            return (
              <button
                key={seat}
                className={`seat ${taken ? 'taken' : ''} ${selected ? 'picked' : ''}`}
                onClick={() => toggle(seat)}
                disabled={taken}
              >
                {seat}
              </button>
            );
          })}
        </div>
        <div className="search" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
          <div>
            <label>Passenger</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button className="btn" style={{ alignSelf: 'end' }} disabled={!picked.length} onClick={confirm}>
            Pay ₹{picked.length * bus.price || 0}
          </button>
        </div>
        {msg && <p className="alert">{msg}</p>}
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: 'Traveller', email: 'demo@goride.test', password: 'secret12' });
  const [msg, setMsg] = useState('');

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    try {
      const fn = mode === 'login' ? api.login : api.register;
      const data = await fn(form);
      saveSession(data.token, data.user);
      navigate('/');
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="wrap">
      <form className="card" style={{ maxWidth: 420, margin: '40px auto' }} onSubmit={submit}>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        {mode === 'register' && (
          <div style={{ marginBottom: 12 }}>
            <label>Name</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} />
        </div>
        <button className="btn">{mode === 'login' ? 'Login' : 'Register'}</button>
        <p className="meta" style={{ marginTop: 14 }}>
          <button type="button" className="btn secondary" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Need an account?' : 'Have an account?'}
          </button>
        </p>
        {msg && <p className="alert">{msg}</p>}
      </form>
    </div>
  );
}

function Bookings() {
  const user = getUser();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    api.myBookings().then(setItems).catch((e) => setMsg(e.message));
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="wrap">
      <h2>Your tickets</h2>
      {msg && <p className="alert">{msg}</p>}
      <div className="list">
        {items.map((b) => (
          <article className="card" key={b._id}>
            <h3>{b.bus?.operator} · seats {b.seats.join(', ')}</h3>
            <p className="meta">{b.bus?.from} → {b.bus?.to} · {b.bus?.date} · {b.passengerName}</p>
            <p className="ok">Confirmed · ₹{b.totalAmount}</p>
          </article>
        ))}
        {!items.length && <p className="meta">No bookings yet.</p>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/book/:id" element={<Book />} />
        <Route path="/login" element={<Login />} />
        <Route path="/bookings" element={<Bookings />} />
      </Routes>
    </>
  );
}
