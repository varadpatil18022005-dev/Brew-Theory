import { useEffect, useMemo, useState } from 'react';
import './site.css';
import './images.css';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check,
  ChevronDown, Clock3, Coffee, Heart,
  LogOut, Mail, MapPin, MessageCircle, Minus, Phone, Plus, Send, ShoppingBag,
  Sparkles, Star, Users, Utensils, X,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const NAV = [
  { id: 'home', label: 'Home', icon: Coffee },
  { id: 'about', label: 'About us', icon: BookOpen },
  { id: 'menu', label: 'Menu', icon: Utensils },
  { id: 'orders', label: 'Order', icon: ShoppingBag },
  { id: 'tables', label: 'Reserve a table', icon: CalendarDays },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'contact', label: 'Contact us', icon: MessageCircle },
];
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const localDate = (date) => {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
};
const tomorrow = localDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
const menuPhotos = {
  'House Cappuccino': '/images/house-cappuccino.png',
  'Velvet Latte': '/images/velvet-latte.png',
  'Maple Flat White': '/images/maple-flat-white.png',
  'Pour-over of the Day': '/images/pour-over-coffee.png',
  'Brown Sugar Cold Brew': '/images/brown-sugar-cold-brew.png',
  'Iced Mocha': '/images/iced-mocha.png',
  'Citrus Iced Tea': '/images/citrus-iced-tea.png',
  'Butter Croissant': '/images/butter-croissant.png',
  'Cardamom Bun': '/images/cardamom-bun.png',
  'Chocolate Fudge Slice': '/images/chocolate-fudge-slice.png',
  'Avocado Toast': '/images/avocado-toast.png',
  'Cafe Breakfast Plate': '/images/cafe-breakfast-plate.png',
};
const photoForItem = (item) => menuPhotos[item.name] || '/images/hero-coffee.png';

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Could not complete that request.');
  return body;
}

function CafeApp({ name, email, token, onLogout }) {
  const [page, setPage] = useState('home');
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 });
  const [myReview, setMyReview] = useState(null);
  const [cart, setCart] = useState({});
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState('18:00');
  const [guests, setGuests] = useState(2);
  const [note, setNote] = useState('');
  const [availability, setAvailability] = useState([]);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });

  const cartLines = useMemo(() => Object.entries(cart).filter(([, quantity]) => quantity > 0), [cart]);
  const cartCount = cartLines.reduce((sum, [, quantity]) => sum + quantity, 0);
  const cartTotal = cartLines.reduce((sum, [id, quantity]) => sum + (menu.find((item) => item._id === id)?.price || 0) * quantity, 0);

  async function loadMenu() {
    const result = await request('/menu', token);
    setMenu(result.items);
  }
  async function loadOrders() {
    const result = await request('/orders', token);
    setOrders(result.orders);
  }
  async function loadReservations() {
    const result = await request('/reservations', token);
    setReservations(result.reservations);
  }
  async function loadReviews() {
    const [all, mine] = await Promise.all([request('/reviews', token), request('/reviews/mine', token)]);
    setReviews(all.reviews);
    setRatingSummary({ average: all.average, count: all.count });
    setMyReview(mine.review);
    if (mine.review) setReviewForm({ rating: mine.review.rating, comment: mine.review.comment });
  }

  useEffect(() => {
    loadMenu().catch((error) => setMessage({ type: 'error', text: error.message }));
    loadOrders().catch(() => {});
    loadReservations().catch(() => {});
    loadReviews().catch(() => {});
  }, [token]);

  useEffect(() => {
    let active = true;
    setAvailabilityBusy(true);
    request(`/reservations/availability?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`, token)
      .then((result) => { if (active) setAvailability(result.availableTables); })
      .catch(() => { if (active) setAvailability([]); })
      .finally(() => { if (active) setAvailabilityBusy(false); });
    return () => { active = false; };
  }, [date, time, token]);

  const flash = (type, text) => setMessage({ type, text });
  function navigate(destination) {
    setPage(destination);
    setMessage({ type: '', text: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (destination === 'orders') loadOrders().catch((error) => flash('error', error.message));
    if (destination === 'tables') loadReservations().catch((error) => flash('error', error.message));
    if (destination === 'reviews') loadReviews().catch((error) => flash('error', error.message));
  }

  function addToCart(item) {
    setCart((current) => ({ ...current, [item._id]: Math.min((current[item._id] || 0) + 1, 20) }));
    flash('success', `${item.name} added to your order.`);
  }
  function changeQuantity(id, delta) {
    setCart((current) => {
      const quantity = Math.max(0, Math.min((current[id] || 0) + delta, 20));
      const next = { ...current };
      if (quantity === 0) delete next[id]; else next[id] = quantity;
      return next;
    });
  }

  async function submitOrder() {
    if (!cartLines.length) return flash('error', 'Add something from the menu first.');
    setBusy(true);
    try {
      await request('/orders', token, { method: 'POST', body: JSON.stringify({ items: cartLines.map(([menuItemId, quantity]) => ({ menuItemId, quantity })) }) });
      setCart({});
      await loadOrders();
      flash('success', 'Your order is in. We’ll get it started!');
    } catch (error) { flash('error', error.message); }
    finally { setBusy(false); }
  }

  async function submitReservation(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await request('/reservations', token, { method: 'POST', body: JSON.stringify({ date, time, guests: Number(guests), note }) });
      await loadReservations();
      setNote('');
      flash('success', `Table ${result.reservation.tableNumber} is reserved for you.`);
    } catch (error) { flash('error', error.message); }
    finally { setBusy(false); }
  }

  async function cancelReservation(id) {
    try {
      await request(`/reservations/${id}/cancel`, token, { method: 'PATCH' });
      await loadReservations();
      flash('success', 'Your reservation was cancelled.');
    } catch (error) { flash('error', error.message); }
  }

  async function submitReview(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await request('/reviews/mine', token, { method: 'PUT', body: JSON.stringify(reviewForm) });
      await loadReviews();
      flash('success', 'Thanks for sharing a little love.');
    } catch (error) { flash('error', error.message); }
    finally { setBusy(false); }
  }

  async function submitContact(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await request('/contact', token, { method: 'POST', body: JSON.stringify(contactForm) });
      setContactForm({ subject: '', message: '' });
      flash('success', result.message);
    } catch (error) { flash('error', error.message); }
    finally { setBusy(false); }
  }

  const title = NAV.find((item) => item.id === page)?.label;

  return (
    <div className="cafe-app">
      <div className="announcement"><Sparkles size={13} /> A cozy corner, a better day <span>·</span> Open daily, 9 am – 9 pm</div>
      <header className="site-header">
        <a className="site-logo" href="#home" onClick={(e) => { e.preventDefault(); navigate('home'); }}><span className="site-logo-icon"><Coffee size={21} /></span><span className="site-brand-name">Brew Theory<small>COFFEE · KITCHEN</small></span></a>
        <nav className="site-nav" aria-label="Main navigation">
          {NAV.map((item) => <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => navigate(item.id)}>{item.label}{item.id === 'orders' && cartCount > 0 && <span className="nav-count">{cartCount}</span>}</button>)}
        </nav>
        <div className="account-tools"><button className="cart-shortcut" aria-label={`Order, ${cartCount} items`} onClick={() => navigate('orders')}><ShoppingBag size={18} />{cartCount > 0 && <span>{cartCount}</span>}</button><div className="account-greeting"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><span className="account-name">Hi, {name.split(' ')[0]}</span></div><button className="logout-button" onClick={onLogout} aria-label="Log out" title="Log out"><LogOut size={17} /></button></div>
      </header>

      {message.text && <div className={`site-notice ${message.type}`} role="status"><span>{message.text}</span><button onClick={() => setMessage({ type: '', text: '' })} aria-label="Dismiss"><X size={16} /></button></div>}

      <main className="site-main" key={page}>
        {page === 'home' && <>
          <section className="home-hero">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <div className="hero-copy"><span className="eyebrow light-eyebrow"><i /> YOUR NEIGHBOURHOOD CAFE</span><h1>Make room for<br />a little <em>good.</em></h1><p>Thoughtful coffee, good food, and a seat saved just for you.</p><div className="hero-buttons"><button className="gold-button" onClick={() => navigate('menu')}>Explore the menu <ArrowRight size={17} /></button><button className="light-link" onClick={() => navigate('tables')}>Book a table <ArrowUpRight size={16} /></button></div><div className="hero-rating"><span className="mini-stars">★★★★★</span><span>{ratingSummary.count ? `${ratingSummary.average} · ${ratingSummary.count} guest reviews` : 'Made with care, every day'}</span></div></div>
            <div className="hero-art"><img src="/images/hero-coffee.png" alt="A cappuccino at a sunlit neighborhood cafe" /></div>
            <div className="hero-bottom"><span>Small batch · Big comfort</span><span><ArrowDownRight size={15} /> Scroll to explore</span></div>
          </section>
          <section className="welcome-strip"><span className="eyebrow">A GOOD DAY STARTS SOMEWHERE</span><h2>Come as you are.<br /><em>Stay for the coffee.</em></h2><p>From the first pour in the morning to a slow afternoon catch-up, we’ve got your favorite corner ready.</p><button className="underlined-link" onClick={() => navigate('about')}>A little about us <ArrowRight size={16} /></button></section>
          <section className="featured-menu"><div className="section-heading"><div><span className="eyebrow">FROM OUR COUNTER</span><h2>A few house favourites</h2></div><button className="underlined-link" onClick={() => navigate('menu')}>View full menu <ArrowRight size={16} /></button></div><div className="home-menu-grid">{menu.slice(0, 3).map((item) => <MenuCard key={item._id} item={item} onAdd={addToCart} compact />)}</div></section>
          <section className="visit-banner"><div><span className="eyebrow light-eyebrow">SAVE YOURSELF A SEAT</span><h2>Your table is<br />waiting.</h2><p>Bring your people. We’ll handle the coffee.</p></div><button className="gold-button" onClick={() => navigate('tables')}>Reserve a table <ArrowRight size={17} /></button></section>
        </>}

        {page === 'about' && <PageFrame eyebrow="OUR LITTLE CORNER" title={<>Coffee tastes better<br /><em>when shared.</em></>} subtitle="We’re a neighbourhood cafe for slow mornings, long conversations and that one more cup." pageTitle={title}>
          <div className="about-layout"><div className="about-visual"><img src="/images/cafe-interior.png" alt="Warm, welcoming Brew Theory interior" loading="lazy" /><span>GOOD THINGS TAKE A LITTLE TIME</span></div><div className="about-copy"><span className="eyebrow">A PLACE TO PAUSE</span><h3>Good coffee.<br />Kind people.<br /><em>No rush.</em></h3><p>Brew Theory started with a simple idea: make a welcoming place where every cup is made with care and everyone feels like a regular.</p><p>We source thoughtfully, bake in small batches, and believe the best part of a cafe is the time you spend together.</p><div className="about-values"><div><span>01</span><b>Thoughtful sourcing</b></div><div><span>02</span><b>Made fresh, daily</b></div><div><span>03</span><b>Room for everyone</b></div></div></div></div>
          <div className="hours-card"><div><Clock3 /><span><b>Every day, a little slower</b><small>Monday – Sunday · 9:00 am – 9:00 pm</small></span></div><div><MapPin /><span><b>Find your way over</b><small>123 Campsite Avenue · Your neighbourhood</small></span></div></div>
        </PageFrame>}

        {page === 'menu' && <PageFrame eyebrow="BREWED, BAKED, MADE WITH CARE" title={<>Something good<br /><em>is on the menu.</em></>} subtitle="Little rituals, familiar favourites and a few lovely surprises." pageTitle={title}>
          {menu.length === 0 ? <EmptyState text="The menu is loading. Check that the cafe API is connected." /> : <MenuSection menu={menu} onAdd={addToCart} />}
          <div className="menu-checkout-callout"><div><ShoppingBag /><span><b>{cartCount ? `${cartCount} item${cartCount === 1 ? '' : 's'} in your order` : 'Found your favourite?'}</b><small>{cartCount ? `Your current total is ${money(cartTotal)}.` : 'Choose a little something and we’ll get it ready.'}</small></span></div><button className="wine-button" onClick={() => navigate('orders')}>{cartCount ? 'Review order' : 'Start an order'} <ArrowRight size={16} /></button></div>
        </PageFrame>}

        {page === 'orders' && <PageFrame eyebrow="MADE FRESH, JUST FOR YOU" title={<>Your next cup<br /><em>is just a click away.</em></>} subtitle="Choose something from the menu, then we’ll get it started." pageTitle={title}>
          <div className="order-layout"><section className="order-builder"><div className="section-heading order-heading"><div><span className="eyebrow">YOUR BASKET</span><h2>{cartCount ? `${cartCount} delicious choice${cartCount === 1 ? '' : 's'}` : 'Start with a favourite'}</h2></div><button className="text-action" onClick={() => navigate('menu')}>Browse menu <ArrowRight size={15} /></button></div>{cartLines.length ? <div className="cart-lines">{cartLines.map(([id, quantity]) => { const item = menu.find((entry) => entry._id === id); if (!item) return null; return <div className="cart-line" key={id}><img className="cart-line-photo" src={photoForItem(item)} alt="" /><span className="cart-line-name"><b>{item.name}</b><small>{money(item.price)} each</small></span><div className="quantity-control"><button onClick={() => changeQuantity(id, -1)} aria-label="Remove one"><Minus size={14} /></button><b>{quantity}</b><button onClick={() => changeQuantity(id, 1)} aria-label="Add one"><Plus size={14} /></button></div><strong>{money(item.price * quantity)}</strong></div>; })}<div className="cart-total"><span>Order total</span><b>{money(cartTotal)}</b></div><button className="wine-button wide-button" disabled={busy} onClick={submitOrder}>{busy ? 'Placing order…' : <>Place order <ArrowRight size={17} /></>}</button><small className="order-hint">Your order is recorded in your account. Payment can be added in a later step.</small></div> : <div className="empty-cart"><ShoppingBag size={30} /><p>Your basket is taking a little breather.</p><button className="wine-button" onClick={() => navigate('menu')}>Explore the menu <ArrowRight size={16} /></button></div>}</section><div className="order-aside"><img className="order-aside-photo" src="/images/hero-coffee.png" alt="Fresh cappuccino ready at the counter" loading="lazy" /><span className="eyebrow">A LITTLE NOTE</span><h3>Good things,<br /><em>made fresh.</em></h3><p>Every order is prepared with care. For a table reservation, we’ll save you a seat separately.</p><button className="text-action" onClick={() => navigate('tables')}>Reserve a table <ArrowUpRight size={16} /></button></div></div>
          <section className="history-section"><div className="section-heading"><div><span className="eyebrow">YOUR COFFEE TRAIL</span><h2>Recent orders</h2></div></div>{orders.length ? <div className="data-list">{orders.map((order) => <div className="data-row" key={order._id}><span className="data-icon"><ShoppingBag /></span><span className="data-primary"><b>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</b><small>{new Date(order.createdAt).toLocaleString()}</small></span><span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span><strong>{money(order.total)}</strong></div>)}</div> : <p className="muted-copy">Your orders will show up here after your first one.</p>}</section>
        </PageFrame>}

        {page === 'tables' && <PageFrame eyebrow="WE’LL SAVE YOU A SEAT" title={<>A table, a treat,<br /><em>a little time.</em></>} subtitle="Choose your day, pick a time and we’ll find a table that fits your group." pageTitle={title}>
          <div className="reservation-layout"><form className="reservation-form" onSubmit={submitReservation}><div className="section-heading"><div><span className="eyebrow">BOOK YOUR VISIT</span><h2>When should we expect you?</h2></div></div><div className="reservation-fields"><label>Date<input type="date" min={localDate(new Date())} max={localDate(new Date(Date.now() + 90 * 86400000))} value={date} onChange={(e) => setDate(e.target.value)} required /></label><label>Time<select value={time} onChange={(e) => setTime(e.target.value)}>{['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'].map((slot) => <option key={slot} value={slot}>{new Date(`2000-01-01T${slot}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</option>)}</select></label><label>Guests<select value={guests} onChange={(e) => setGuests(e.target.value)}>{Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}</select></label></div><label className="note-label">Anything we should know? <span>Optional</span><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="A birthday, a high chair, a favourite corner…" maxLength="300" rows="3" /></label><div className="availability-note"><Users size={18} /><span>{availabilityBusy ? 'Checking tables…' : availability.length ? `${availability.filter((table) => table.capacity >= Number(guests)).length} table${availability.filter((table) => table.capacity >= Number(guests)).length === 1 ? '' : 's'} fit your group at this time` : 'No suitable tables at this time. Try another slot.'}</span></div><button className="wine-button" disabled={busy || availabilityBusy || !availability.some((table) => table.capacity >= Number(guests))}>{busy ? 'Saving your table…' : <>Reserve my table <ArrowRight size={17} /></>}</button></form><aside className="reservation-aside"><div className="reservation-art"><img src="/images/cafe-interior.png" alt="Comfortable seating inside Brew Theory" loading="lazy" /><span>YOUR PLACE IS HERE</span></div><div className="reservation-hours"><span className="eyebrow">THE LITTLE DETAILS</span><p><Clock3 size={16} /> Reservations are held for 90 minutes.</p><p><Users size={16} /> Tables seat up to 8 guests.</p><p><Check size={16} /> We’ll confirm your table right away.</p></div></aside></div>
          <section className="history-section"><div className="section-heading"><div><span className="eyebrow">SAVED JUST FOR YOU</span><h2>Your reservations</h2></div></div>{reservations.length ? <div className="data-list">{reservations.map((reservation) => <div className="data-row" key={reservation._id}><span className="data-icon"><CalendarDays /></span><span className="data-primary"><b>Table {reservation.tableNumber} · {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}</b><small>{new Date(reservation.startsAt).toLocaleString()}</small></span><span className={`status-pill ${reservation.status.toLowerCase()}`}>{reservation.status}</span>{reservation.status === 'Booked' && new Date(reservation.startsAt) > new Date() && <button className="small-cancel" onClick={() => cancelReservation(reservation._id)}>Cancel</button>}</div>)}</div> : <p className="muted-copy">Your upcoming table reservations will appear here.</p>}</section>
        </PageFrame>}

        {page === 'reviews' && <PageFrame eyebrow="KIND WORDS, SHARED" title={<>Every cup has<br /><em>a story.</em></>} subtitle="Tell us how your visit felt. We read every note, promise." pageTitle={title}>
          <div className="reviews-overview"><div className="rating-big"><strong>{ratingSummary.count ? ratingSummary.average : '—'}</strong><span className="mini-stars">★★★★★</span><small>{ratingSummary.count ? `${ratingSummary.count} guest ${ratingSummary.count === 1 ? 'review' : 'reviews'}` : 'Be the first to leave a note'}</small></div><div className="review-quote"><img src="/images/cafe-interior.png" alt="A welcoming cafe space" loading="lazy" /><div className="review-quote-copy"><span className="quote-mark">“</span><p>It’s the little things that make a place feel like yours.</p><span className="eyebrow">THANK YOU FOR BEING HERE</span></div></div></div><div className="review-content"><form className="review-form" onSubmit={submitReview}><span className="eyebrow">YOUR TURN</span><h2>{myReview ? 'Update your review' : 'Leave a little love'}</h2><p>Your review helps someone else find their new favourite spot.</p><div className="rating-picker" role="radiogroup" aria-label="Your rating">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} aria-label={`${value} stars`} aria-checked={reviewForm.rating >= value} role="radio" onClick={() => setReviewForm({ ...reviewForm, rating: value })}><Star size={23} fill={reviewForm.rating >= value ? 'currentColor' : 'none'} /></button>)}</div><textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="What did you enjoy?" rows="4" maxLength="700" required /><button className="wine-button" disabled={busy}>{busy ? 'Saving…' : <>Share your review <Send size={15} /></>}</button></form><div className="review-list">{reviews.length ? reviews.map((review) => <article className="review-card" key={review._id}><div className="review-card-top"><span className="avatar">{review.customerName?.slice(0, 1).toUpperCase()}</span><div><b>{review.customerName}</b><small>{new Date(review.createdAt).toLocaleDateString()}</small></div><span className="mini-stars">{'★'.repeat(review.rating)}<span className="star-muted">{'★'.repeat(5 - review.rating)}</span></span></div><p>{review.comment}</p></article>) : <div className="empty-review"><Heart size={22} /><p>Be the first to share a coffee-house moment.</p></div>}</div></div>
        </PageFrame>}

        {page === 'contact' && <PageFrame eyebrow="WE’RE RIGHT HERE" title={<>Drop us<br /><em>a little note.</em></>} subtitle="A question, a kind word, a special request? We’d love to hear from you." pageTitle={title}>
          <div className="contact-layout"><div className="contact-details"><img className="contact-photo" src="/images/cafe-interior.png" alt="Brew Theory cafe and pastry counter" loading="lazy" /><span className="eyebrow">COME SAY HELLO</span><h3>There’s always<br />room for one more.</h3><div className="contact-detail"><span><MapPin /></span><div><b>Find the cafe</b><small>123 Campsite Avenue<br />Your neighbourhood</small></div></div><div className="contact-detail"><span><Clock3 /></span><div><b>We’re open daily</b><small>Monday – Sunday<br />9:00 am – 9:00 pm</small></div></div><div className="contact-detail"><span><Mail /></span><div><b>Write us a note</b><small>{email}</small></div></div><div className="contact-detail"><span><Phone /></span><div><b>Give us a ring</b><small>+1 (555) 012-3456</small></div></div></div><form className="contact-form" onSubmit={submitContact}><span className="eyebrow">SEND A MESSAGE</span><h2>We’re listening.</h2><p>Your note is saved to your account, and our team will follow up.</p><label>Subject<input value={contactForm.subject} onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} maxLength="120" placeholder="What’s on your mind?" required /></label><label>Your message<textarea value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} maxLength="2000" rows="5" placeholder="Write a little something…" required /></label><button className="wine-button" disabled={busy}>{busy ? 'Sending…' : <>Send your note <Send size={15} /></>}</button></form></div>
        </PageFrame>}
      </main>
      <footer className="site-footer"><a className="site-logo footer-logo" href="#home" onClick={(e) => { e.preventDefault(); navigate('home'); }}><span className="site-logo-icon"><Coffee size={20} /></span><span className="site-brand-name">Brew Theory<small>COFFEE · KITCHEN</small></span></a><span>Made slowly, served warmly.</span><span>© 2026 Brew Theory</span></footer>
    </div>
  );
}

function PageFrame({ eyebrow, title, subtitle, pageTitle, children }) {
  return <div className="inner-page"><section className="page-hero"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p><div className="page-breadcrumb">Brew Theory <ChevronDown size={13} /> {pageTitle}</div></section><div className="page-content">{children}</div></div>;
}

function MenuSection({ menu, onAdd }) {
  const categories = [...new Set(menu.map((item) => item.category))];
  return <div className="menu-sections">{categories.map((category) => <section className="menu-category" key={category}><div className="category-heading"><span className="category-flourish">✳</span><div><span className="eyebrow">A LITTLE SOMETHING</span><h2>{category}</h2></div><span className="category-line" /></div><div className="menu-grid">{menu.filter((item) => item.category === category).map((item) => <MenuCard key={item._id} item={item} onAdd={onAdd} />)}</div></section>)}</div>;
}

function MenuCard({ item, onAdd, compact = false }) {
  return <article className={`menu-card ${compact ? 'compact' : ''}`}><div className="menu-card-art"><img src={photoForItem(item)} alt={item.name} loading="lazy" /><small>{item.category}</small></div><div className="menu-card-copy"><div className="menu-card-title"><h3>{item.name}</h3><strong>{money(item.price)}</strong></div><p>{item.description}</p><button className="add-button" onClick={() => onAdd(item)}><Plus size={15} /> Add to order</button></div></article>;
}

function EmptyState({ text }) { return <div className="empty-state"><Coffee size={28} /><p>{text}</p></div>; }

export default CafeApp;
