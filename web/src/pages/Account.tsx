/** /account — honest "coming in Phase 4" placeholder. NO login form in Phase 1. */
import { PageHero } from '../components/PageHero';
import { Button } from '../components/ui';

export function Account() {
  return (
    <>
      <PageHero title="Account">
        <p>Your personal space in CHAI — saved plants, research history, and more.</p>
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
          <h2>Accounts arrive with the community in Phase 4.</h2>
          <p>
            There is deliberately no sign-in here yet. When accounts open, members
            will be able to save plants, keep research conversations, and take
            part in the community — all on the free tier, with no payment ever
            required.
          </p>
          <p>
            Everything in the encyclopedia is free to explore right now, no
            account needed.
          </p>
          <div style={{ marginTop: '1.25rem' }}>
            <Button to="/plants" variant="primary">
              Explore the encyclopedia
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
