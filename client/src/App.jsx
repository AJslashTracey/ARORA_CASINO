/* Apple-style casino landing page */
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import auroraLogoDark from './assets/aurora_white_text.png'
import auroraLogoLight from './assets/white_mode_logo.png'
import WinsStrip from './WinsStrip'
import SignUp from './SignUp'
import SignIn from './SignIn'
import VerifyEmail from './VerifyEmail'
import pfp from './assets/PFP.png'
import Footer from './Footer'
import SupportPage from './support'
import ClassicSlotsPage from './slots'
import RoulettePage from './Roulette'
import ErrorBoundary from './components/ErrorBoundary'
import OptimizedImage from './components/OptimizedImage'
import { GameCardSkeleton } from './components/Loading'
import StatisticsPage from './statistics.jsx';
import Terms from './Terms';
import Privacy from './privacy';
import ResponsibleGaming from './ ResponsibleGaming';
import { apiRequest } from './utils/api';
import Promotions from './promotions';

// Game card images
import imgRoulette from './assets/cRoulette.png'
import imgClassicSlots from './assets/cClassicslots.png'

function VerificationBanner({ userEmail }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendVerification = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await apiRequest('/resend-verification', {
        method: 'POST',
        body: { email: userEmail },
      });

      setMessage('✓ Verification email sent! Check your inbox.');

    } catch (err) {
      setMessage('✗ ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">⚠️</span>
            <span className="text-yellow-200">
              Please verify your email to play games.
            </span>
          </div>
          <div className="flex items-center gap-3">
            {message && <span className="text-xs text-yellow-200">{message}</span>}
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="text-xs px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded border border-yellow-500/30 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Resend Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Navbar({ user, onLogout, isDarkMode, onToggleTheme, navigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const audioRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const logoSrc = isDarkMode ? auroraLogoDark : auroraLogoLight

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[rgb(var(--bg)/0.8)] backdrop-blur' : 'bg-transparent'
    }`}>
      <audio ref={audioRef} loop>
        <source src="https://www.soundjay.com/misc/sounds/casino-ambience.mp3" type="audio/mpeg" />
      </audio>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center px-4 py-4">
          <Link to="/">
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center gap-3"
          >
            <OptimizedImage src={logoSrc} alt="Aurora" className="h-[60px] w-[120px]" />
          </motion.div>
          </Link>
          <ul className="hidden items-center gap-6 text-sm/6 text-soft mx-auto md:flex">
            <li><Link className="link" to="/games">Games</Link></li>
            <li><Link className="link" to="/support">Support</Link></li>
          </ul>
          <div className="hidden items-center gap-2 mr-4 md:flex">
            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <OptimizedImage src={pfp} alt="Profile" className="w-full h-full object-cover" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[rgb(var(--bg))] rounded-md shadow-lg py-1 ring-1 ring-[rgb(var(--fg)/0.1)]">
                    <div className="px-4 py-2 text-sm text-soft border-b border-[rgb(var(--fg)/0.1)]">
                      Welcome, {user.username}!
                    </div>
                    <button
                      onClick={onToggleTheme}
                      className="flex w-full items-center justify-between px-4 py-2 text-sm text-soft hover:bg-[rgb(var(--fg)/0.05)] cursor-pointer"
                    >
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                      <span className="text-xs text-softer">{isDarkMode ? 'Off' : 'On'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-soft hover:bg-[rgb(var(--fg)/0.05)] cursor-pointer border-t border-[rgb(var(--fg)/0.1)]"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/signin" className="btn-ghost">Sign in</Link>
                <Link to="/signup" className="btn-primary">Join now</Link>
              </>
            )}
          </div>
          <button 
            className="md:hidden btn-ghost px-3 py-2 cursor-pointer"
            onClick={() => navigate('/statistics')}
          >
            Statistics
          </button>
        </nav>
      </div>
    </header>
  )
}




function Hero() {
  return (
    <section className="relative border-b border-[rgb(var(--fg)/0.1)]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h1 className="text-pretty text-5xl font-bold tracking-tight sm:text-6xl leading-tight">
            Gamble with style.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-soft leading-relaxed">
            Fast-paced tables, smooth slots. Made for players.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/games" className="btn-primary">
              Play Instantly
            </Link>
            <Link to="/promotions" className="btn-ghost">View promotions</Link>
          </div>
          <div className="mt-6 flex items-center gap-4 text-xs text-softer">
            <span>18+ | Please play responsibly</span>
            <span className="h-px w-8 bg-[rgb(var(--fg)/0.2)]"></span>
            <span>SSL Secured</span>
          </div>
        </div>
        <div className="relative">
          <div className="mx-auto aspect-square w-full max-w-xl flex items-center justify-center">
            <div className="text-6xl">🎰</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    { title: 'Instant payouts', desc: 'Withdraw to your bank in minutes, not days.' },
    { title: 'Live dealers', desc: 'Real people, real tables, no bots.' },
    { title: 'Fair & licensed', desc: 'Audited RNG and full SSL protection.' },
    { title: 'All devices', desc: 'Play on desktop, tablet, or phone.' },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-[rgb(var(--fg)/0.1)]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="p-6 border border-[rgb(var(--fg)/0.1)] rounded-lg">
            <h3 className="text-base font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-softer">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Games() {
  const [loading, setLoading] = useState(true);
  const games = [
    { name: 'European Roulette', tag: 'Live', image: imgRoulette, link: '/roulette' },
    { name: 'Classic Slots', tag: 'Popular', image: imgClassicSlots, link: '/slots' },
  ]

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="games" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-[rgb(var(--fg)/0.1)]">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Featured games</h2>
        <a href="#" className="text-sm link">See all</a>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => <GameCardSkeleton key={i} />)
        ) : (
          games.map((g) => (
            <div key={g.name} className="group overflow-hidden rounded-lg border border-[rgb(var(--fg)/0.1)] hover:border-[rgb(var(--fg)/0.2)] transition-colors">
              <div className="relative aspect-video bg-[rgb(var(--fg)/0.05)] flex items-center justify-center overflow-hidden">
                <img 
                  src={g.image} 
                  alt={g.name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-[rgb(var(--fg)/0.1)]">
                <div>
                  <h3 className="text-sm font-semibold">{g.name}</h3>
                  <span className="text-xs text-softer inline-block mt-1 px-2 py-0.5 bg-[rgb(var(--fg)/0.08)] rounded text-[rgb(var(--fg)/0.8)]">{g.tag}</span>
                </div>
                {g.link ? (
                  <Link to={g.link} className="btn-primary px-4 py-2 text-xs flex items-center justify-center">
                    Play
                  </Link>
                ) : (
                  <button className="btn-primary px-4 py-2 text-xs opacity-60 cursor-not-allowed">Soon</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function Testimonials() {
  const quotes = [
    { q: 'Cashed out in 10 minutes. No waiting.', a: '— Marcus' },
    { q: 'Finally a casino that doesn\'t feel like a scam.', a: '— Sarah' },
    { q: 'Live dealers are legit. Great quality.', a: '— James' },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-[rgb(var(--fg)/0.1)]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quotes.map((c) => (
          <figure key={c.q} className="p-6 border border-[rgb(var(--fg)/0.1)] rounded-lg">
            <blockquote className="text-sm text-soft">"{c.q}"</blockquote>
            <figcaption className="mt-3 text-xs text-softer">{c.a}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-lg p-8 sm:p-12 border border-[rgb(var(--fg)/0.1)] bg-[rgb(var(--fg)/0.02)]">
        <h3 className="text-2xl font-semibold tracking-tight">Ready to play?</h3>
        <p className="mt-3 max-w-xl text-sm text-soft">Join now, get a 100% match on your first deposit up to $500. No strings attached.</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="btn-primary">Sign up now</button>
          <button className="btn-ghost">Learn more</button>
        </div>
      </div>
    </section>
  )
}

/* Function for the new routing site "Games"*/

function GamesPage() {
  const games = [
    {
      name: 'European Roulette',
      tag: 'Live',
      image: imgRoulette,
      link: '/roulette',
    },
    {
      name: 'Classic Slots',
      tag: 'Popular',
      image: imgClassicSlots,
      link: '/slots',
    },
  ];

  return (
    <>
      <section className="border-b border-[rgb(var(--fg)/0.1)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight">Games</h1>
          <p className="mt-2 text-softer">
            Choose your games. Roulette or Slots.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {games.map((g) => (
            <motion.div
              key={g.name}
              className="group overflow-hidden rounded-xl border border-[rgb(var(--fg)/0.1)] hover:border-purple-500/50 transition-all duration-300 bg-gradient-to-b from-[rgb(var(--fg)/0.03)] to-transparent"
              whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15)' }}
            >
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={g.image}
                  alt={g.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="flex items-center justify-between px-4 py-4 border-t border-[rgb(var(--fg)/0.1)]">
                <div>
                  <h3 className="text-base font-semibold">{g.name}</h3>
                  <span className="text-xs inline-block mt-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                    {g.tag}
                  </span>
                </div>

                <Link
                  to={g.link}
                  className="btn-primary px-5 py-2 text-sm"
                >
                  Play
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
}

/* Protected Route Component - redirects to sign-in if not logged in */
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}

/* rendering */

function AppContent() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for user in localStorage on initial render
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Check for theme preference (default to dark)
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme ? savedTheme === 'dark' : true; // Default to dark
    setIsDarkMode(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
    document.documentElement.classList.toggle('light', !prefersDark);
    
    setIsLoading(false);
  }, []);

  const handleToggleTheme = () => {
    const newIsDark = !isDarkMode;
    setIsDarkMode(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newIsDark);
    document.documentElement.classList.toggle('light', !newIsDark);
  };

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  // Show nothing while checking auth status to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--fg))]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <Navbar user={user} onLogout={handleLogout} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} navigate={navigate} />
      {user && !user.email_verified && <VerificationBanner userEmail={user.email} />}
      <Routes>
        <Route path="/" element={
          <>
            <WinsStrip />
            <Hero />
            <Features />
            <Testimonials />
            <CTA />
            <Footer />
          </>
        } />
        <Route path="/games" element={
          <ProtectedRoute user={user}>
            <GamesPage />
          </ProtectedRoute>
        } />
        <Route path="/slots" element={
          <ProtectedRoute user={user}>
            <ClassicSlotsPage />
          </ProtectedRoute>
        } />
        <Route path="/roulette" element={
          <ProtectedRoute user={user}>
            <RoulettePage />
          </ProtectedRoute>
        } />
        
        <Route path="/statistics" element={
          <ProtectedRoute user={user}>
            <StatisticsPage user={user} />
          </ProtectedRoute>
        } />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/responsible-gaming" element={<ResponsibleGaming />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/signup" element={<SignUp onSignUp={handleLogin} />} />
        <Route path="/signin" element={<SignIn onSignIn={handleLogin} />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

