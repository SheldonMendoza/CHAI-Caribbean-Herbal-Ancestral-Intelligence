/** 404 — honest, helpful, on-brand. */
import { PageHero } from '../components/PageHero';
import { Button, EmptyState } from '../components/ui';

export function NotFound() {
  return (
    <>
      <PageHero title="Page not found">
        <p>This trail through the bush leads nowhere.</p>
      </PageHero>
      <div className="container section">
        <EmptyState
          title="We couldn't find that page"
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button to="/" variant="primary" size="sm">
                Back home
              </Button>
              <Button to="/plants" variant="outline" size="sm">
                Plant encyclopedia
              </Button>
            </div>
          }
        >
          <p>
            The address may be mistyped, or the page may have moved. The
            encyclopedia itself is very much alive — start there.
          </p>
        </EmptyState>
      </div>
    </>
  );
}
