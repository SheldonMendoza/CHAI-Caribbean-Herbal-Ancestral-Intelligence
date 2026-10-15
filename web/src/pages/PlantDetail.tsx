/** /plants/:slug — full plant detail page with clear tradition/science separation. */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PlantDetail, SourceRef } from '../../../shared/types';
import { dataSource, sourceRegistry } from '../lib/data';
import { resolvePlantSources } from '../lib/query';
import { PageHero } from '../components/PageHero';
import {
  Badge,
  Button,
  EmptyState,
  NotDocumented,
  Tooltip,
} from '../components/ui';
import { EvidenceBadge } from '../components/EvidenceBadge';

function hasText(v: string | undefined | null): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function CitationLink({ source }: { source: SourceRef }) {
  const inner = (
    <>
      <strong>{source.title}</strong>
      <br />
      <span className="source-meta">
        {hasText(source.authors) ? `${source.authors}` : ''}
        {source.year ? ` (${source.year})` : ''}
        {hasText(source.journal) ? ` · ${source.journal}` : ''}
        {hasText(source.doi) ? ` · DOI: ${source.doi}` : ''}
        {hasText(source.source_type) ? ` · ${source.source_type.replace(/_/g, ' ')}` : ''}
        {hasText(source.accessed) ? ` · verified ${source.accessed}` : ''}
      </span>
    </>
  );
  return hasText(source.url) ? (
    <a href={source.url} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <span>{inner}</span>
  );
}

export function PlantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [plant, setPlant] = useState<PlantDetail | null>(null);
  const [sources, setSources] = useState<SourceRef[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    setMissing(false);
    setActiveImage(0);
    (async () => {
      const detail = slug ? await dataSource.getBySlug(slug) : null;
      if (!live) return;
      if (!detail) {
        setMissing(true);
        setPlant(null);
        return;
      }
      setPlant(detail);
      // Resolve citations: union of all source ids on the record.
      const ids = new Set<string>();
      for (const t of detail.traditional_uses ?? [])
        for (const id of t.source_ids ?? []) ids.add(id);
      for (const c of detail.claims ?? [])
        for (const a of c.assessments ?? [])
          for (const id of a.source_ids ?? []) ids.add(id);
      const resolved =
        detail.sources && detail.sources.length > 0
          ? detail.sources
          : await dataSource.getSources(detail, [...ids]);
      // When the seed bundle carries no per-plant sources array, resolve from registry.
      const finalSources =
        resolved.length > 0
          ? resolved
          : resolvePlantSources(detail, sourceRegistry());
      setSources(finalSources);
    })();
    return () => {
      live = false;
    };
  }, [slug]);

  if (missing) {
    return (
      <div className="container section">
        <EmptyState
          title="Plant not found"
          action={
            <Button to="/plants" variant="primary" size="sm">
              Back to the encyclopedia
            </Button>
          }
        >
          <p>
            There is no plant with the address “{slug}”. It may have been renamed
            or the link may be incomplete.
          </p>
        </EmptyState>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="container section">
        <p role="status">Loading plant…</p>
      </div>
    );
  }

  const images = plant.images ?? [];
  const safety = plant.safety;
  const safetyHasContent =
    hasText(safety.summary) ||
    hasText(safety.side_effects) ||
    hasText(safety.interactions) ||
    hasText(safety.pregnancy) ||
    hasText(safety.children) ||
    hasText(safety.contraindications);

  return (
    <>
      <PageHero title={plant.common_name}>
        <p className="sci-name" style={{ color: '#e9e4d3', marginBottom: '0.75rem' }}>
          {plant.scientific_name}
          {hasText(plant.scientific_name_authorship) &&
            ` ${plant.scientific_name_authorship}`}
        </p>
        <div className="badge-row" style={{ marginBottom: 0 }}>
          <Badge className="badge-neutral">{plant.family}</Badge>
          {plant.reviewer_status === 'verified' ? (
            <Badge className="badge-verified">Reviewed &amp; verified</Badge>
          ) : (
            <Badge className="badge-draft">Draft — awaiting reviewer verification</Badge>
          )}
          {plant.featured && <Badge className="badge-featured">Featured</Badge>}
        </div>
      </PageHero>

      <div className="container section">
        <p>
          <Link to="/plants" className="card-link">← Back to the encyclopedia</Link>
        </p>

        <div className="plant-hero">
          {/* Gallery */}
          <div className="plant-gallery">
            {images.length > 0 ? (
              <>
                <img
                  src={images[Math.min(activeImage, images.length - 1)].url}
                  alt={
                    images[Math.min(activeImage, images.length - 1)].caption ||
                    `Photograph of ${plant.common_name}`
                  }
                />
                {images.length > 1 && (
                  <div className="plant-gallery-thumbs" role="group" aria-label="Plant images">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-current={i === activeImage}
                        aria-label={`View image ${i + 1}: ${img.caption || plant.common_name}`}
                        onClick={() => setActiveImage(i)}
                      >
                        <img src={img.url} alt="" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="image-credit">
                  {images[Math.min(activeImage, images.length - 1)].attribution}
                  {hasText(images[Math.min(activeImage, images.length - 1)].license) &&
                    ` · ${images[Math.min(activeImage, images.length - 1)].license}`}
                </p>
              </>
            ) : (
              <EmptyState title="No photograph yet">
                <p>A verified, freely licensed photograph has not been added for this plant.</p>
              </EmptyState>
            )}
          </div>

          {/* Quick facts + AI entry */}
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>At a glance</h2>
            <table className="kv-table">
              <tbody>
                <tr>
                  <th scope="row">Family</th>
                  <td>{hasText(plant.family) ? plant.family : <NotDocumented />}</td>
                </tr>
                <tr>
                  <th scope="row">Parts used</th>
                  <td>
                    {(plant.parts_used ?? []).length > 0 ? (
                      plant.parts_used.join(', ')
                    ) : (
                      <NotDocumented />
                    )}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Documented in</th>
                  <td>
                    {(plant.distribution ?? []).length > 0 ? (
                      plant.distribution.map((d) => d.country).join(', ')
                    ) : (
                      <NotDocumented />
                    )}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Last reviewed</th>
                  <td>{hasText(plant.last_reviewed) ? plant.last_reviewed : <NotDocumented />}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: '1.25rem' }}>
              <Tooltip
                id={`ask-ai-${plant.slug}`}
                text="Available when AI is connected in Phase 3"
              >
                <Button variant="disabled" disabled aria-disabled="true">
                  Ask AI about this plant
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Disambiguation */}
        {hasText(plant.disambiguation_note) && (
          <div
            className="disclaimer-box"
            style={{ marginTop: '2rem' }}
            role="note"
            aria-label="Name disambiguation"
          >
            <h3>Don&apos;t confuse it</h3>
            <p style={{ marginBottom: 0 }}>{plant.disambiguation_note}</p>
          </div>
        )}

        {/* ============ TRADITIONAL USE (gold band) ============ */}
        <section aria-labelledby="trad-heading" style={{ marginTop: '2.5rem' }}>
          <div className="tradition-band">
            <span className="band-label" id="trad-heading">
              Traditional use — ancestral knowledge
            </span>
            <p style={{ color: '#41544a', fontSize: '0.95rem' }}>
              What Caribbean communities have practiced and passed down. Documented
              from ethnobotanical sources — this is heritage, not proof of effect.
            </p>
            {(plant.traditional_uses ?? []).length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                {plant.traditional_uses.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#fff',
                      border: '1px solid #d8c78f',
                      borderRadius: '8px',
                      padding: '1rem 1.25rem',
                    }}
                  >
                    <p style={{ fontWeight: 600, marginBottom: '0.35rem' }}>
                      {hasText(t.use) ? t.use : <NotDocumented />}
                    </p>
                    <p style={{ fontSize: '0.92rem', color: '#41544a', marginBottom: 0 }}>
                      {t.countries.length > 0 && (
                        <>Documented in: {t.countries.join(', ')}. </>
                      )}
                      {hasText(t.preparation) && <>Preparation: {t.preparation}</>}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="not-documented" style={{ marginTop: '1rem' }}>
                Traditional uses: not yet documented.
              </p>
            )}
            {hasText(plant.cultural_background) && (
              <>
                <h3 style={{ marginTop: '1.5rem' }}>Cultural background</h3>
                <p style={{ marginBottom: 0 }}>{plant.cultural_background}</p>
              </>
            )}
          </div>
        </section>

        {/* ============ SCIENTIFIC EVIDENCE (green band) ============ */}
        <section aria-labelledby="sci-heading" style={{ marginTop: '2rem' }}>
          <div className="science-band">
            <span className="band-label" id="sci-heading">
              Scientific evidence — what research says
            </span>
            <p style={{ color: '#41544a', fontSize: '0.95rem' }}>
              Each claim below is assessed individually against published research.
              A traditional practice and a laboratory finding are different kinds of
              knowledge — they are never blended here.
            </p>
            {(plant.claims ?? []).length > 0 ? (
              plant.claims.map((claim, ci) => (
                <article key={ci} aria-label={`Claim: ${claim.claim}`}>
                  <h3 className="claim-title">{claim.claim}</h3>
                  {(claim.assessments ?? []).length > 0 ? (
                    claim.assessments.map((a, ai) => (
                      <div className="assessment-card" key={ai}>
                        <div className="badge-row" style={{ margin: '0 0 0.25rem' }}>
                          <EvidenceBadge category={a.category} />
                          {a.reviewer_status === 'verified' ? (
                            <Badge className="badge-verified">Verified</Badge>
                          ) : (
                            <Badge className="badge-draft">
                              Draft — awaiting reviewer verification
                            </Badge>
                          )}
                        </div>
                        {hasText(a.summary) ? (
                          <p>{a.summary}</p>
                        ) : (
                          <p className="not-documented">Assessment summary: not yet documented.</p>
                        )}
                        <dl>
                          {hasText(a.study_design) && (
                            <>
                              <dt>Study design</dt>
                              <dd>{a.study_design}</dd>
                            </>
                          )}
                          {hasText(a.population) && (
                            <>
                              <dt>Population</dt>
                              <dd>{a.population}</dd>
                            </>
                          )}
                          {hasText(a.preparation_studied) && (
                            <>
                              <dt>Preparation studied</dt>
                              <dd>{a.preparation_studied}</dd>
                            </>
                          )}
                          {hasText(a.main_findings) && (
                            <>
                              <dt>Main findings</dt>
                              <dd>{a.main_findings}</dd>
                            </>
                          )}
                          {hasText(a.limitations) && (
                            <>
                              <dt>Limitations</dt>
                              <dd>{a.limitations}</dd>
                            </>
                          )}
                          {hasText(a.adverse_effects) && (
                            <>
                              <dt>Adverse effects</dt>
                              <dd>{a.adverse_effects}</dd>
                            </>
                          )}
                        </dl>
                        {hasText(a.last_reviewed) && (
                          <p className="source-meta" style={{ marginTop: '0.75rem' }}>
                            Last reviewed: {a.last_reviewed}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="not-documented">No assessments yet for this claim.</p>
                  )}
                </article>
              ))
            ) : (
              <p className="not-documented" style={{ marginTop: '1rem' }}>
                Scientific assessments: not yet documented.
              </p>
            )}
          </div>
        </section>

        {/* ============ SAFETY (coral band) ============ */}
        <section aria-labelledby="safety-heading" style={{ marginTop: '2rem' }}>
          <div className="safety-band">
            <span className="band-label" id="safety-heading">
              Safety — read before use
            </span>
            {safetyHasContent ? (
              <dl className="kv-table" style={{ marginTop: '0.5rem' }}>
                <tbody>
                  {hasText(safety.summary) && (
                    <tr><th scope="row">Summary</th><td>{safety.summary}</td></tr>
                  )}
                  {hasText(safety.side_effects) && (
                    <tr><th scope="row">Side effects</th><td>{safety.side_effects}</td></tr>
                  )}
                  {hasText(safety.interactions) && (
                    <tr><th scope="row">Interactions</th><td>{safety.interactions}</td></tr>
                  )}
                  {hasText(safety.pregnancy) && (
                    <tr><th scope="row">Pregnancy</th><td>{safety.pregnancy}</td></tr>
                  )}
                  {hasText(safety.children) && (
                    <tr><th scope="row">Children</th><td>{safety.children}</td></tr>
                  )}
                  {hasText(safety.contraindications) && (
                    <tr><th scope="row">Contraindications</th><td>{safety.contraindications}</td></tr>
                  )}
                </tbody>
              </dl>
            ) : (
              <p className="not-documented" style={{ marginTop: '0.75rem' }}>
                Safety information: not yet documented. Absence of information is not
                evidence of safety — consult a qualified health professional.
              </p>
            )}
          </div>
        </section>

        {/* ============ BOTANICAL DETAILS ============ */}
        <section aria-labelledby="botany-heading" style={{ marginTop: '2.5rem' }}>
          <h2 id="botany-heading">Botanical details</h2>
          <table className="kv-table">
            <tbody>
              <tr>
                <th scope="row">Description</th>
                <td>{hasText(plant.botanical_description) ? plant.botanical_description : <NotDocumented />}</td>
              </tr>
              <tr>
                <th scope="row">Identification</th>
                <td>{hasText(plant.identification) ? plant.identification : <NotDocumented />}</td>
              </tr>
              <tr>
                <th scope="row">Constituents</th>
                <td>
                  {(plant.constituents ?? []).length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      {plant.constituents.map((c, i) => (
                        <li key={i}>
                          <strong>{c.name}</strong>
                          {hasText(c.note) && ` — ${c.note}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <NotDocumented />
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Other names</th>
                <td>
                  {(plant.names ?? []).length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      {plant.names.map((n, i) => (
                        <li key={i}>
                          {n.name}{' '}
                          <span className="source-meta">
                            ({n.name_type === 'regional' ? `regional${n.region ? ` — ${n.region}` : ''}` : 'synonym'}
                            {hasText(n.notes) && ` · ${n.notes}`})
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <NotDocumented />
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Distribution</th>
                <td>
                  {(plant.distribution ?? []).length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      {plant.distribution.map((d, i) => (
                        <li key={i}>
                          {d.country}
                          {d.status && (
                            <span className="source-meta"> — {d.status}</span>
                          )}
                          {hasText(d.note) && <span className="source-meta"> · {d.note}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <NotDocumented />
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ============ SOURCES ============ */}
        <section aria-labelledby="sources-heading" style={{ marginTop: '2.5rem' }}>
          <h2 id="sources-heading">Sources &amp; citations</h2>
          {sources.length > 0 ? (
            <ul className="source-list">
              {sources.map((s) => (
                <li key={s.id}>
                  <CitationLink source={s} />
                  {hasText(s.notes) && (
                    <p className="source-meta" style={{ marginTop: '0.35rem', marginBottom: 0 }}>
                      {s.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sources are being verified">
              <p>Citations for this plant have not been published yet.</p>
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
