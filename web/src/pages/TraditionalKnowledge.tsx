/** /traditional-knowledge — honest placeholder; the library arrives in a later phase. */
import { PageHero } from '../components/PageHero';
import { Button } from '../components/ui';

export function TraditionalKnowledge() {
  return (
    <>
      <PageHero title="Traditional Knowledge">
        <p>
          The living practices of Caribbean communities — bush teas, washouts,
          poultices, and the stories that carry them.
        </p>
      </PageHero>
      <div className="container section">
        <div className="prose">
          <h2>The Traditional Knowledge Library is on its way</h2>
          <p>
            Caribbean herbal knowledge did not come from textbooks. It came from
            grandmothers, market vendors, bush doctors, and neighbors — from
            Trinidad&apos;s fever-grass tea to Jamaica&apos;s cerasee washout, from
            Grenada&apos;s nutmeg wisdom to Dominica&apos;s mountain remedies.
          </p>
          <p>
            The Traditional Knowledge Library — arriving in a later phase — will
            gather these practices with care:
          </p>
          <ul>
            <li>
              <strong>Island attribution:</strong> every practice tied to the
              island or community it comes from, because &quot;Caribbean
              remedy&quot; is never one single thing.
            </li>
            <li>
              <strong>Preparation methods:</strong> how remedies are actually made
              and used, as documented by ethnobotanical sources.
            </li>
            <li>
              <strong>Kept separate from science:</strong> traditional practice
              and clinical evidence are different kinds of knowledge. The library
              will never present one as the other.
            </li>
            <li>
              <strong>Respectful sourcing:</strong> community knowledge shared
              with consent and credited, never extracted.
            </li>
          </ul>
          <h3>What exists today</h3>
          <p>
            Every plant in the encyclopedia already carries a{' '}
            <strong>Traditional use</strong> section — the gold-banded part of each
            plant page — documenting practices from verified ethnobotanical
            sources, clearly separated from the green-banded scientific evidence.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Button to="/plants" variant="primary">
              Browse traditional uses in the encyclopedia
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
