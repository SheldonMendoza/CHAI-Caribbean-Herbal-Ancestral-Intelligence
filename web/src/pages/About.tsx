/** /about — real content: mission, taglines, disclaimers, methodology summary. */
import { Link } from 'react-router-dom';
import { PageHero } from '../components/PageHero';
import { Button } from '../components/ui';

export function About() {
  return (
    <>
      <PageHero title="About CHAI">
        <p>Where ancestral wisdom meets artificial intelligence.</p>
      </PageHero>
      <div className="container section">
        <div className="prose" style={{ maxWidth: '52rem' }}>
          <h2>Our mission</h2>
          <p>
            <strong>Caribbean Herbal Ancestral Intelligence</strong> exists to
            preserve, organize, and honestly present the herbal knowledge of the
            Caribbean — and to put modern research tools in service of it.
          </p>
          <p>
            For generations, Caribbean communities have known which leaves bring
            down a fever, which barks settle the stomach, which teas cleanse and
            which soothe. That knowledge lives in kitchens and markets, in
            grandmothers&apos; instructions and bush doctors&apos; practice. Too
            much of it is undocumented, and too much of what <em>is</em> written
            about it blurs the line between what tradition holds and what science
            has shown.
          </p>
          <p>CHAI draws that line clearly:</p>
          <ul>
            <li>
              <strong>Tradition, documented with respect</strong> — practices
              recorded with their island attributions and sources, never
              presented as proof.
            </li>
            <li>
              <strong>Science, graded honestly</strong> — individual claims
              assessed in six evidence categories, with working citations and
              labeled drafts.
            </li>
            <li>
              <strong>AI, in service of inquiry</strong> — research assistants
              (arriving in Phase 3) that help you investigate and learn, grounded
              in verified records and honest about uncertainty.
            </li>
          </ul>

          <h2>How we work — methodology in brief</h2>
          <ul>
            <li>
              <strong>Verified sources only:</strong> taxonomy from authorities
              like Kew&apos;s Plants of the World Online; traditional use from
              ethnobotanical surveys and programs like TRAMIL; clinical and
              laboratory evidence from peer-reviewed literature. Every cited
              source was actually fetched and checked.
            </li>
            <li>
              <strong>Claim-level evidence:</strong> we never assign a single
              blanket rating to a whole plant. Each claim gets its own
              assessment.
            </li>
            <li>
              <strong>Reviewer verification:</strong> facts are checked against
              retrieved sources before a record is marked verified; unverified
              work stays labeled as draft.
            </li>
            <li>
              <strong>Honest gaps:</strong> where research has not documented
              something, we say &quot;Not yet documented&quot; — we never invent
              content to fill space.
            </li>
          </ul>

          <div className="disclaimer-box" style={{ marginTop: '2rem' }}>
            <h3>Educational purpose &amp; medical disclaimer</h3>
            <p>
              CHAI is an <strong>educational resource</strong>. Nothing on this
              site is medical advice, and nothing here should replace the
              judgment of a qualified health professional.
            </p>
            <ul style={{ marginBottom: 0 }}>
              <li>
                Consult a qualified health professional before using any herbal
                remedy — especially if you are pregnant, nursing, giving remedies
                to children, managing a condition, or taking medication.
              </li>
              <li>
                Traditional use does not guarantee safety or effectiveness. Some
                widely used plants carry real risks.
              </li>
              <li>
                If you have urgent symptoms — difficulty breathing, chest pain,
                severe pain, heavy bleeding, signs of stroke, or a high fever
                that won&apos;t break — seek medical care immediately. Do not
                wait on herbal remedies.
              </li>
            </ul>
          </div>

          <h2 style={{ marginTop: '2.5rem' }}>Built in phases, on the free tier</h2>
          <p>
            CHAI is being built in careful phases with zero budget — free tiers
            only, no paid services. Phase 1 is this encyclopedia. Phase 3 brings
            the AI research assistants (Cloudflare Workers AI, free tier, hard
            daily budget). Phase 4 brings community and accounts.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button to="/plants" variant="primary">
              Explore the encyclopedia
            </Button>
            <Button to="/evidence" variant="outline">
              How we grade evidence
            </Button>
          </div>
          <p style={{ marginTop: '2rem' }}>
            <Link to="/" className="card-link">← Back home</Link>
          </p>
        </div>
      </div>
    </>
  );
}
