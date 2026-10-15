/** /community — honest "coming in Phase 4" placeholder. */
import { PageHero } from '../components/PageHero';
import { Button } from '../components/ui';

export function Community() {
  return (
    <>
      <PageHero title="Community">
        <p>
          The people who carry this knowledge — their stories, remedies, and
          island wisdom.
        </p>
      </PageHero>
      <div className="container section">
        <div className="honest-panel">
          <p
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#087A52',
              marginBottom: '0.5rem',
            }}
          >
            Coming in Phase 4
          </p>
          <h2>The CHAI community opens in Phase 4.</h2>
          <p>
            The heart of CHAI is the people who carry Caribbean herbal knowledge
            — and one day soon, this is where you&apos;ll meet them. Community
            members will be able to share remedies, family stories, and island
            wisdom, ask questions, and learn from one another.
          </p>
          <p>When it opens, the community will have:</p>
          <ul>
            <li>Member accounts with island and interest profiles.</li>
            <li>Moderated sharing, so contributions stay respectful and safe.</li>
            <li>Clear separation between personal experience and verified evidence.</li>
            <li>Protection for contributors — shared with consent, credited always.</li>
          </ul>
          <p>
            Until then, the encyclopedia grows through verified research — and
            every plant page is free to explore today.
          </p>
          <div style={{ marginTop: '1.25rem' }}>
            <Button to="/plants" variant="primary">
              Explore the encyclopedia meanwhile
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
