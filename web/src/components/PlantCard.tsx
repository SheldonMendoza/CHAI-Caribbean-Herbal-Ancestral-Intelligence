/** PlantCard — encyclopedia card used on Home, /plants, and section previews. */
import { Link } from 'react-router-dom';
import type { PlantSummary } from '../../../shared/types';
import { Badge, Button, Card, CardBody, Tooltip } from './ui';
import { EvidenceStatus } from './EvidenceBadge';

function InitialTile({ name }: { name: string }) {
  return (
    <div
      className="card-media"
      role="img"
      aria-label={`Botanical illustration placeholder for ${name}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#145C43',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '3.5rem',
          color: '#F2C14E',
          fontWeight: 600,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

export function PlantCard({ plant }: { plant: PlantSummary }) {
  const to = `/plants/${plant.slug}`;
  return (
    <Card className="plant-card">
      {plant.image ? (
        <img
          className="card-media"
          src={plant.image.url}
          alt={plant.image.caption || `Photograph of ${plant.common_name}`}
          loading="lazy"
        />
      ) : (
        <InitialTile name={plant.common_name} />
      )}
      <CardBody>
        <h3 className="card-title">
          <Link to={to} className="card-link">
            {plant.common_name}
          </Link>
        </h3>
        <p className="sci">{plant.scientific_name}</p>
        <div className="badge-row" style={{ margin: 0 }}>
          <EvidenceStatus category={plant.highest_evidence} />
          {plant.safety_flag && (
            <Badge className="badge-safety" label="Safety: a safety concern has been flagged">
              <span className="badge-dot" aria-hidden="true" />
              Safety noted
            </Badge>
          )}
          {plant.featured && <Badge className="badge-featured">Featured</Badge>}
        </div>
        {plant.countries.length > 0 && (
          <p className="countries">
            Documented in: {plant.countries.join(', ')}
          </p>
        )}
        {plant.traditional_use_summary ? (
          <p className="summary">{plant.traditional_use_summary}</p>
        ) : (
          <p className="summary not-documented">Traditional use: not yet documented</p>
        )}
        <div className="card-actions">
          <Button to={to} variant="primary" size="sm">
            Explore Plant
          </Button>
          <Tooltip
            id={`ask-ai-${plant.slug}`}
            text="Available when AI is connected in Phase 3"
          >
            <Button variant="disabled" size="sm" disabled aria-disabled="true">
              Ask AI
            </Button>
          </Tooltip>
        </div>
      </CardBody>
    </Card>
  );
}
