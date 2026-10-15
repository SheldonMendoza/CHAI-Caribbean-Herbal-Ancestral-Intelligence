/** Site header: brand, persistent nav, global search, AI entry point, mobile menu. */
import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Button, Input } from './ui';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/plants', label: 'Plant Encyclopedia' },
  { to: '/research', label: 'Caribbean AI Research' },
  { to: '/traditional-knowledge', label: 'Traditional Knowledge' },
  { to: '/evidence', label: 'Scientific Evidence' },
  { to: '/community', label: 'Community' },
  { to: '/about', label: 'About' },
  { to: '/account', label: 'Account' },
];

function SearchForm({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const current = new URLSearchParams(location.search).get('q') ?? '';
  const [value, setValue] = useState(current);
  return (
    <form
      className="header-search"
      role="search"
      aria-label="Site search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/plants?q=${encodeURIComponent(value.trim())}`);
        onNavigate?.();
      }}
    >
      <label className="sr-only" htmlFor="site-search">
        Search the plant encyclopedia
      </label>
      <Input
        id="site-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search plants…"
        aria-label="Search the plant encyclopedia"
      />
    </form>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="header-inner">
        <Link to="/" aria-label="CHAI home" style={{ textDecoration: 'none' }} onClick={close}>
          <Logo />
        </Link>

        <nav className="main-nav" aria-label="Primary">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
              {n.label}
            </NavLink>
          ))}
        </nav>

        <SearchForm />

        <span className="header-ai">
          <Button to="/research" variant="accent" size="sm">
            AI Research
          </Button>
        </span>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
            {open ? (
              <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            ) : (
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div id="mobile-menu" className={`mobile-panel ${open ? 'open' : ''}`}>
        <nav aria-label="Mobile">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className="nav-link"
              onClick={close}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <SearchForm onNavigate={close} />
        <Button to="/research" variant="accent" size="sm">
          AI Research
        </Button>
      </div>
    </header>
  );
}
