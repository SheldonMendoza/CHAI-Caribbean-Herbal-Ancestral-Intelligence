/** /evidence — REAL content: the 6-category methodology + review process. */
import { Link } from 'react-router-dom';
import {
  EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_ORDER,
} from '../../../shared/types';
import { PageHero } from '../components/PageHero';
import { EvidenceBadge } from '../components/EvidenceBadge';

export function Evidence() {
  return (
    <>
      <PageHero title="Scientific Evidence">
        <p>
          How CHAI grades what research actually says — claim by claim, never a
          single blanket rating for a whole plant.
        </p>
      </PageHero>
      <div className="container section">
        <div className="prose" style={{ maxWidth: '52rem' }}>
          <h2>The six evidence categories</h2>
          <p>
            A plant can have a dozen different claims made about it — that it
            lowers fever, that it soothes digestion, that it is safe in pregnancy.
            Each claim is assessed on its own, in one of six categories. These are
            informational categories, not automatic scientific grades.
          </p>
        </div>

        <div className="ev-grid">
          {EVIDENCE_CATEGORY_ORDER.map((cat) => (
            <div className="ev-explainer" key={cat}>
              <h3>
                <EvidenceBadge category={cat} />
              </h3>
              <p>{EVIDENCE_CATEGORIES[cat].description}</p>
            </div>
          ))}
        </div>

        <div className="prose" style={{ maxWidth: '52rem', marginTop: '2.5rem' }}>
          <h2>How assessments are reviewed</h2>
          <ul>
            <li>
              <strong>One claim, one assessment:</strong> a claim may carry
              several assessments (for example, one documenting traditional use
              and one summarizing a laboratory study), each with its own source.
            </li>
            <li>
              <strong>Sources you can check:</strong> every assessment links to
              the source it rests on — journal article, ethnobotanical survey,
              or institutional database. No source, no assessment.
            </li>
            <li>
              <strong>Drafts are labeled, not hidden:</strong> assessments that
              have not yet passed reviewer verification are shown with a
              &quot;Draft — awaiting reviewer verification&quot; badge. They are
              never silently hidden and never presented as verified.
            </li>
            <li>
              <strong>Gaps are honest:</strong> when no retrievable source
              discusses a claim, the field stays empty and the page says
              &quot;Not yet documented&quot; — we do not invent assessments to
              fill space.
            </li>
            <li>
              <strong>Safety is its own category:</strong> a meaningful risk,
              contraindication, or interaction gets a <em>Safety concern</em>{' '}
              assessment and a visible flag on the plant card — tradition does
              not override it.
            </li>
          </ul>
          <h2>What this means for you</h2>
          <p>
            Use the categories as a map, not a verdict. &quot;Traditional use
            documented&quot; tells you a practice is real heritage; it does not
            tell you it works. &quot;Preliminary evidence&quot; tells you
            scientists are looking; it does not tell you the effect happens in
            people. When in doubt, talk to a qualified health professional — and
            read the safety section of every plant page.
          </p>
          <p>
            <Link to="/plants" className="card-link">
              See the categories in action in the encyclopedia →
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
