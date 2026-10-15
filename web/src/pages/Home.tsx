/** CHAI homepage — Phase 1. All data comes through the PlantDataSource. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_ORDER,
  type PlantSummary,
} from '../../../shared/types';
import { dataSource } from '../lib/data';
import { EVIDENCE_RANK } from '../../../shared/types';
import { Button, EmptyState } from '../components/ui';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { PlantCard } from '../components/PlantCard';
import { BigSearch } from '../components/BigSearch';
import { BotanicalArt } from '../components/BotanicalArt';

function SectionHeading({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      {kicker && (
        <p
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#087A52',
            marginBottom: '0.4rem',
          }}
        >
          {kicker}
        </p>
      )}
      <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
      {children}
    </div>
  );
}

export function Home() {
  const [featured, setFeatured] = useState<PlantSummary[]>([]);
  const [recent, setRecent] = useState<PlantSummary[]>([]);
  const [preview, setPreview] = useState<PlantSummary[]>([]);
  const [discoveries, setDiscoveries] = useState<PlantSummary[]>([]);

  useEffect(() => {
    let live = true;
    (async () => {
      const [feat, rec, prev, disc] = await Promise.all([
        dataSource.search({ featured: true, per_page: 6 }),
        dataSource.search({ sort: 'recently_reviewed', per_page: 4 }),
        dataSource.search({ per_page: 4 }),
        dataSource.search({ per_page: 50 }),
      ]);
      if (!live) return;
      setFeatured(feat.data);
      setRecent(rec.data);
      setPreview(prev.data);
      setDiscoveries(
        [...disc.data]
          .filter((p) => p.highest_evidence !== null)
          .sort(
            (a, b) =>
              EVIDENCE_RANK[b.highest_evidence!] - EVIDENCE_RANK[a.highest_evidence!],
          )
          .slice(0, 3),
      );
    })();
    return () => {
      live = false;
    };
  }, []);

  const heroPlant = featured.find((p) => p.image) ?? preview.find((p) => p.image);

  return (
    <>
      {/* 1. Hero */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-inner">
          <div>
            <h1 id="hero-heading">Discover the Healing Heritage of the Caribbean.</h1>
            <p className="hero-lede">
              Explore the plants, traditions, and scientific discoveries that connect
              generations of Caribbean knowledge—with AI to help you investigate,
              learn, and discover.
            </p>
            <div className="hero-actions">
              <Button to="/plants" variant="gold">
                Explore the Plant Encyclopedia
              </Button>
              <Button to="/research" variant="outline-light">
                Start AI Research
              </Button>
            </div>
          </div>
          <div className="hero-image-wrap">
            {heroPlant?.image ? (
              <figure style={{ margin: 0 }}>
                <div className="hero-image-frame">
                  <img
                    className="hero-image"
                    src={heroPlant.image.url}
                    alt={heroPlant.image.caption || `Photograph of ${heroPlant.common_name}`}
                  />
                </div>
                <figcaption className="hero-image-caption">
                  {heroPlant.common_name} ({heroPlant.scientific_name}) —{' '}
                  {heroPlant.image.attribution}
                </figcaption>
              </figure>
            ) : (
              <BotanicalArt />
            )}
          </div>
        </div>
      </section>

      {/* 2. Prominent search */}
      <section className="section-tight" aria-label="Search the encyclopedia">
        <div className="container" style={{ marginTop: '-2.5rem', position: 'relative', zIndex: 2 }}>
          <BigSearch />
        </div>
      </section>

      {/* 3. Featured plants */}
      <section className="section" aria-labelledby="featured-heading">
        <div className="container">
          <SectionHeading kicker="The encyclopedia" title="Featured plants">
            <p className="lede">
              Hand-reviewed entries from the Caribbean herbal tradition — each one
              separating what elders have long practiced from what science has
              established.
            </p>
          </SectionHeading>
          {featured.length > 0 ? (
            <div className="grid grid-3">
              {featured.slice(0, 3).map((p) => (
                <PlantCard key={p.slug} plant={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="Featured plants are on their way">
              <p>The research team is reviewing the first entries now.</p>
            </EmptyState>
          )}
          <p style={{ marginTop: '1.5rem' }}>
            <Link to="/plants" className="card-link">
              Browse the full encyclopedia →
            </Link>
          </p>
        </div>
      </section>

      {/* 4. AI promo panel */}
      <section
        className="section"
        aria-labelledby="ai-promo-heading"
        style={{ background: '#0B3D2C', color: '#F7F4E9' }}
      >
        <div className="container" style={{ maxWidth: '46rem' }}>
          <p
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#F2C14E',
              marginBottom: '0.4rem',
            }}
          >
            Coming in Phase 3
          </p>
          <h2 id="ai-promo-heading" style={{ color: '#F7F4E9' }}>
            Your Caribbean Knowledge Research Partner.
          </h2>
          <p style={{ color: '#e9e4d3', fontSize: '1.1rem' }}>
            Soon, CHAI&apos;s research assistants will help you ask questions about
            any plant — quick answers grounded in verified records, deeper web
            research, and document analysis, always with citations you can check.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <Button to="/research" variant="gold">
              Start Researching
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Plants of the Caribbean preview */}
      <section className="section" aria-labelledby="grid-heading" style={{ background: '#fff' }}>
        <div className="container">
          <SectionHeading kicker="Island by island" title="Plants of the Caribbean">
            <p className="lede">
              A living catalog of the plants Caribbean communities have turned to
              for generations — documented country by country.
            </p>
          </SectionHeading>
          {preview.length > 0 ? (
            <div className="grid grid-4">
              {preview.map((p) => (
                <PlantCard key={p.slug} plant={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="The catalog is being built">
              <p>Plant records are being researched and verified now.</p>
            </EmptyState>
          )}
        </div>
      </section>

      {/* 6. Traditional knowledge preview */}
      <section className="section" aria-labelledby="tk-heading">
        <div className="container">
          <SectionHeading kicker="Ancestral wisdom" title="Traditional knowledge across the islands" />
          <p className="lede" style={{ maxWidth: '46rem' }}>
            From Trinidad&apos;s bush teas to Jamaica&apos;s washouts, Caribbean
            herbal knowledge lives in kitchens, markets, and family stories. The
            Traditional Knowledge Library — arriving in a later phase — will gather
            these practices with their island attributions, preparation methods,
            and the sources that document them, always kept clearly separate from
            scientific claims.
          </p>
          <p>
            <Link to="/traditional-knowledge" className="card-link">
              Learn about the coming library →
            </Link>
          </p>
        </div>
      </section>

      {/* 7. Evidence categories */}
      <section className="section" aria-labelledby="science-heading" style={{ background: '#fff' }}>
        <div className="container">
          <SectionHeading kicker="Evidence, honestly graded" title="What the science says" />
          <p className="lede" style={{ maxWidth: '46rem' }}>
            CHAI never gives a whole plant a single blanket rating. Every individual
            claim is assessed in one of six categories:
          </p>
          <div className="grid grid-3" style={{ marginTop: '1.5rem' }}>
            {EVIDENCE_CATEGORY_ORDER.map((cat) => (
              <div key={cat} className="ev-explainer">
                <h3>
                  <EvidenceBadge category={cat} />
                </h3>
                <p>{EVIDENCE_CATEGORIES[cat].description}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem' }}>
            <Link to="/evidence" className="card-link">
              How assessments are reviewed →
            </Link>
          </p>
        </div>
      </section>

      {/* 8. Recently added research */}
      <section className="section" aria-labelledby="recent-heading">
        <div className="container">
          <SectionHeading kicker="Fresh from review" title="Recently added research" />
          {recent.length > 0 ? (
            <div className="grid grid-4">
              {recent.map((p) => (
                <PlantCard key={p.slug} plant={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="No research entries yet">
              <p>Recently reviewed plants will appear here.</p>
            </EmptyState>
          )}
        </div>
      </section>

      {/* 9. Community */}
      <section
        className="section"
        aria-labelledby="community-heading"
        style={{ background: '#0B3D2C', color: '#F7F4E9' }}
      >
        <div className="container" style={{ maxWidth: '46rem' }}>
          <p
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#F2C14E',
              marginBottom: '0.4rem',
            }}
          >
            Coming in Phase 4
          </p>
          <h2 id="community-heading" style={{ color: '#F7F4E9' }}>
            Community knowledge and stories
          </h2>
          <p style={{ color: '#e9e4d3' }}>
            The heart of CHAI is the people who carry this knowledge. In Phase 4,
            community members will be able to share remedies, stories, and island
            wisdom — with moderation that protects both contributors and readers.
            Until then, the encyclopedia grows through verified research.
          </p>
          <div style={{ marginTop: '1.25rem' }}>
            <Button to="/community" variant="outline-light" size="sm">
              About the coming community
            </Button>
          </div>
        </div>
      </section>

      {/* 10. Featured botanical discoveries */}
      <section className="section" aria-labelledby="discoveries-heading" style={{ background: '#fff' }}>
        <div className="container">
          <SectionHeading kicker="Claims with the strongest evidence" title="Featured botanical discoveries" />
          {discoveries.length > 0 ? (
            <div className="grid grid-3">
              {discoveries.map((p) => (
                <PlantCard key={p.slug} plant={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="Discoveries will appear here">
              <p>As claims are assessed, the strongest findings will be highlighted.</p>
            </EmptyState>
          )}
        </div>
      </section>

      {/* 11. Safety */}
      <section className="section" aria-labelledby="safety-heading">
        <div className="container">
          <div className="disclaimer-box">
            <h3 id="safety-heading">Responsible herbal education &amp; safety</h3>
            <p>
              CHAI is an <strong>educational resource</strong>, not medical advice.
              Traditional use does not equal safety or effectiveness — some widely
              used plants carry real risks, interact with medicines, or are unsafe
              in pregnancy. Every plant page carries a safety section and flags
              known concerns clearly.
            </p>
            <p style={{ marginBottom: 0 }}>
              Always consult a qualified health professional before using any herbal
              remedy, and if you have urgent symptoms, seek medical care promptly.
              When tradition and science disagree, we show you both — and say so.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
