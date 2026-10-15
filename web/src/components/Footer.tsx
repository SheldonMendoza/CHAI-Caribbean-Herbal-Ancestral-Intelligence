/** Site footer: brand, navigation, honest phase note, educational disclaimer. */
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" aria-label="CHAI home" style={{ textDecoration: 'none' }}>
              <Logo dark />
            </Link>
            <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
              Where ancestral wisdom meets artificial intelligence — an educational
              encyclopedia of Caribbean herbal knowledge.
            </p>
          </div>
          <nav aria-label="Footer">
            <h3>Explore</h3>
            <ul className="footer-links">
              <li><Link to="/plants">Plant Encyclopedia</Link></li>
              <li><Link to="/traditional-knowledge">Traditional Knowledge</Link></li>
              <li><Link to="/evidence">Scientific Evidence</Link></li>
              <li><Link to="/research">Caribbean AI Research</Link></li>
            </ul>
          </nav>
          <nav aria-label="Footer secondary">
            <h3>About CHAI</h3>
            <ul className="footer-links">
              <li><Link to="/about">Our mission</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/account">Account</Link></li>
            </ul>
          </nav>
        </div>
        <p className="footer-disclaimer">
          Educational resource only — not medical advice. Always consult a qualified
          health professional before using any herbal remedy. If you have urgent
          symptoms, seek medical care promptly.
        </p>
        <div className="footer-bottom">
          <span>CHAI — Caribbean Herbal Ancestral Intelligence · Phase 1</span>
          <span>AI research assistants arrive in Phase 3; community in Phase 4.</span>
        </div>
      </div>
    </footer>
  );
}
