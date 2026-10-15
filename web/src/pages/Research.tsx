/** /research — honest Phase-3 placeholder. NO interactive fake chat. */
import { PageHero } from '../components/PageHero';
import { Button } from '../components/ui';

const MODES = [
  {
    name: 'Quick Answer',
    text: 'Ask a focused question and get a concise, cited answer drawn from CHAI’s verified plant records — ideal for checking a claim or a preparation.',
  },
  {
    name: 'Web Research',
    text: 'Deeper investigation across the open web: ethnobotanical surveys, PubMed studies, and institutional sources, summarized with working links you can verify.',
  },
  {
    name: 'Deep Research',
    text: 'Multi-step research for harder questions — comparing traditional claims against clinical evidence, flagging contradictions and evidence gaps.',
  },
  {
    name: 'Document Analysis',
    text: 'Upload a paper, article, or document and have the assistant summarize it, extract claims, and cross-check them against the CHAI encyclopedia.',
  },
];

export function Research() {
  return (
    <>
      <PageHero title="Caribbean AI Research">
        <p>
          Your research partner for Caribbean herbal knowledge — grounded in
          verified records, honest about uncertainty, always cited.
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
            Coming in Phase 3
          </p>
          <h2>Caribbean AI Research is coming in Phase 3 — no AI provider is connected yet.</h2>
          <p>
            CHAI is being built in careful phases so the foundation — verified
            plant records, honest evidence grading, clear safety information —
            comes first. The AI research assistants arrive in Phase 3, powered by
            Cloudflare Workers AI on its free tier, with a strict daily budget and
            no paid overage possible.
          </p>
          <p>
            Until then, there is no chat box here on purpose: we would rather show
            you nothing than a fake conversation that pretends to know things it
            doesn&apos;t.
          </p>

          <h3 style={{ marginTop: '2rem' }}>What the research assistants will do</h3>
          <div className="mode-list">
            {MODES.map((m) => (
              <div className="mode-card" key={m.name}>
                <h3>{m.name}</h3>
                <p>{m.text}</p>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: '2rem' }}>What you can do today</h3>
          <p>
            The encyclopedia is already research-grade: every plant page separates
            traditional knowledge from scientific evidence, grades individual
            claims, and links working citations.
          </p>
          <div style={{ marginTop: '1.25rem' }}>
            <Button to="/plants" variant="primary">
              Explore the Plant Encyclopedia
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
