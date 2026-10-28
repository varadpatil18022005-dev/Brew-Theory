import { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Coffee, Eye, EyeOff, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import CafeApp from './CafeApp.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function api(path, payload) {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'Something went wrong. Please try again.');
  return result;
}

function App() {
  const [view, setView] = useState(sessionStorage.getItem('coffeeToken') ? 'signed-in' : 'login');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [registration, setRegistration] = useState({ name: '', email: '', password: '' });
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = window.setTimeout(() => setResendSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const showNotice = (type, text) => setNotice({ type, text });

  async function handleRequestCode(event) {
    event.preventDefault();
    setBusy(true);
    setNotice({ type: '', text: '' });
    try {
      const result = await api('/auth/request-code', registration);
      setEmail(registration.email.trim().toLowerCase());
      setResendSeconds(60);
      setView('verify');
      showNotice('success', result.message);
    } catch (error) {
      showNotice('error', error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResendCode() {
    setBusy(true);
    try {
      const result = await api('/auth/request-code', registration);
      setResendSeconds(60);
      showNotice('success', result.message);
    } catch (error) {
      showNotice('error', error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    setBusy(true);
    setNotice({ type: '', text: '' });
    try {
      const result = await api('/auth/verify-code', { email, code });
      showNotice('success', result.message);
      setTimeout(() => {
        setView('login');
        showNotice('success', 'Your email is verified. Log in to continue.');
      }, 800);
    } catch (error) {
      showNotice('error', error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setNotice({ type: '', text: '' });
    const form = new FormData(event.currentTarget);
    try {
      const result = await api('/auth/login', {
        email: String(form.get('email')).trim().toLowerCase(),
        password: form.get('password'),
      });
      sessionStorage.setItem('coffeeToken', result.token);
      sessionStorage.setItem('coffeeName', result.user.name);
      sessionStorage.setItem('coffeeEmail', result.user.email);
      setCustomerName(result.user.name);
      setView('signed-in');
    } catch (error) {
      showNotice('error', error.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('coffeeToken');
    sessionStorage.removeItem('coffeeName');
    sessionStorage.removeItem('coffeeEmail');
    setView('login');
    showNotice('', '');
  }

  if (view === 'signed-in') {
    const name = customerName || sessionStorage.getItem('coffeeName') || 'there';
    return <CafeApp name={name} email={sessionStorage.getItem('coffeeEmail') || ''} token={sessionStorage.getItem('coffeeToken')} onLogout={logout} />;
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel" aria-label="Brew Theory welcome">
        <div className="brand-topline"><a className="wordmark" href="#welcome"><span className="brand-icon"><Coffee size={23} /></span><span className="wordmark-name">Brew Theory</span></a><span className="brand-location">EST. WITH LOVE · EVERY DAY</span></div>
        <div className="brand-story">
          <div className="steam-cup" aria-hidden="true"><span className="steam steam-one" /><span className="steam steam-two" /><span className="steam steam-three" /><Coffee className="cup-icon" strokeWidth={0.85} /></div>
          <span className="eyebrow brand-eyebrow">SLOW MORNINGS, GOOD COFFEE</span>
          <h1>A little warmth<br />in every <em>cup.</em></h1>
          <p>Thoughtfully brewed coffee and a cozy place to make yourself at home.</p>
        </div>
        <div className="brand-footer"><span>Freshly brewed, just for you.</span><span className="footer-dots"><i /><i /><i /></span></div>
      </section>

      <section className="form-panel" id="welcome">
        <div className="mobile-brand"><Coffee size={21} /> <span className="mobile-brand-name">Brew Theory</span></div>
        <div className="form-wrap">
          {view === 'login' && <>
            <div className="form-kicker"><span className="eyebrow">YOUR TABLE IS WAITING</span><span className="kicker-line" /></div>
            <h2>Welcome back</h2>
            <p className="form-description">Sign in to continue to Brew Theory.</p>
            {notice.text && <div className={`notice ${notice.type}`} role="status">{notice.text}</div>}
            <form className="auth-form" onSubmit={handleLogin}>
              <label htmlFor="login-email">Email address</label>
              <div className="input-wrap"><Mail size={18} /><input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
              <div className="label-row"><label htmlFor="login-password">Password</label></div>
              <div className="input-wrap"><ShieldCheck size={18} /><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required /><button className="icon-button" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              <button className="submit-button" type="submit" disabled={busy}>{busy ? 'Signing in…' : <>Sign in <ArrowRight size={18} /></>}</button>
            </form>
            <p className="switch-copy">New to Brew Theory? <button className="inline-link" onClick={() => { setView('register'); showNotice('', ''); }}>Create an account</button></p>
          </>}

          {view === 'register' && <>
            <button className="back-button" onClick={() => { setView('login'); showNotice('', ''); }}><ArrowLeft size={16} /> Back to sign in</button>
            <div className="form-kicker"><span className="eyebrow">MAKE YOURSELF AT HOME</span><span className="kicker-line" /></div>
            <h2>Create account</h2>
            <p className="form-description">Join us for your next favorite cup.</p>
            {notice.text && <div className={`notice ${notice.type}`} role="status">{notice.text}</div>}
            <form className="auth-form" onSubmit={handleRequestCode}>
              <label htmlFor="register-name">Your name</label>
              <div className="input-wrap"><input id="register-name" value={registration.name} onChange={(e) => setRegistration({ ...registration, name: e.target.value })} autoComplete="name" placeholder="What should we call you?" maxLength="80" required /></div>
              <label htmlFor="register-email">Email address</label>
              <div className="input-wrap"><Mail size={18} /><input id="register-email" type="email" value={registration.email} onChange={(e) => setRegistration({ ...registration, email: e.target.value })} autoComplete="email" placeholder="you@example.com" required /></div>
              <label htmlFor="register-password">Create a password</label>
              <div className="input-wrap"><ShieldCheck size={18} /><input id="register-password" type={showPassword ? 'text' : 'password'} value={registration.password} onChange={(e) => setRegistration({ ...registration, password: e.target.value })} autoComplete="new-password" minLength="8" maxLength="72" placeholder="At least 8 characters" required /><button className="icon-button" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
              <button className="submit-button" type="submit" disabled={busy}>{busy ? 'Sending code…' : <>Continue with email <ArrowRight size={18} /></>}</button>
            </form>
            <p className="switch-copy">Already have an account? <button className="inline-link" onClick={() => { setView('login'); showNotice('', ''); }}>Sign in</button></p>
          </>}

          {view === 'verify' && <>
            <button className="back-button" onClick={() => { setView('register'); showNotice('', ''); }}><ArrowLeft size={16} /> Back to details</button>
            <div className="verify-icon"><Mail size={21} /></div>
            <div className="form-kicker"><span className="eyebrow">ONE QUICK CHECK</span><span className="kicker-line" /></div>
            <h2>Check your inbox</h2>
            <p className="form-description">We sent a 6-digit verification code to <strong>{email}</strong>. It expires in 10 minutes.</p>
            {notice.text && <div className={`notice ${notice.type}`} role="status">{notice.text}</div>}
            <form className="auth-form" onSubmit={handleVerifyCode}>
              <label htmlFor="verification-code">Verification code</label>
              <input className="code-input" id="verification-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength="6" required />
              <button className="submit-button" type="submit" disabled={busy || code.length !== 6}>{busy ? 'Verifying…' : <>Verify email <ArrowRight size={18} /></>}</button>
            </form>
            <p className="resend-copy">Didn’t get the email? {resendSeconds > 0 ? <span>Resend in {resendSeconds}s</span> : <button className="inline-link" disabled={busy} onClick={handleResendCode}>Send a new code</button>}</p>
          </>}
        </div>
        <footer className="form-footer"><span>© 2026 Brew Theory</span><span>Made for the love of coffee</span></footer>
      </section>
    </main>
  );
}

export default App;
