/** CHAI SPA shell — routing, scroll restoration, route announcements, titles. */
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Plants } from './pages/Plants';
import { PlantDetailPage } from './pages/PlantDetail';
import { Research } from './pages/Research';
import { TraditionalKnowledge } from './pages/TraditionalKnowledge';
import { Evidence } from './pages/Evidence';
import { Community } from './pages/Community';
import { About } from './pages/About';
import { Account } from './pages/Account';
import { NotFound } from './pages/NotFound';

const TITLES: Record<string, string> = {
  '/': 'CHAI — Caribbean Herbal Ancestral Intelligence',
  '/plants': 'Plant Encyclopedia — CHAI',
  '/research': 'Caribbean AI Research — CHAI',
  '/traditional-knowledge': 'Traditional Knowledge — CHAI',
  '/evidence': 'Scientific Evidence — CHAI',
  '/community': 'Community — CHAI',
  '/about': 'About — CHAI',
  '/account': 'Account — CHAI',
};

function ScrollAndTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.title =
      TITLES[pathname] ??
      (pathname.startsWith('/plants/')
        ? `Plant — CHAI`
        : 'Page not found — CHAI');
    // Announce route changes to screen readers.
    const live = document.getElementById('route-announcer');
    if (live) {
      live.textContent = '';
      window.setTimeout(() => {
        live.textContent = document.title;
      }, 60);
    }
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollAndTitle />
      <span id="route-announcer" className="sr-only" role="status" aria-live="polite" />
      <Header />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plants" element={<Plants />} />
          <Route path="/plants/:slug" element={<PlantDetailPage />} />
          <Route path="/research" element={<Research />} />
          <Route path="/traditional-knowledge" element={<TraditionalKnowledge />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/community" element={<Community />} />
          <Route path="/about" element={<About />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
