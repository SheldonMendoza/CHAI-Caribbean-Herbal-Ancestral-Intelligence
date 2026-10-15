/** EvidenceBadge — renders one of the 6 evidence categories per shared/types.ts. */
import { EVIDENCE_CATEGORIES, type EvidenceCategory } from '../../../shared/types';
import { Badge } from './ui';

export function EvidenceBadge({ category }: { category: EvidenceCategory }) {
  const meta = EVIDENCE_CATEGORIES[category];
  return (
    <Badge className={meta.badgeClass} label={`Evidence: ${meta.label}`}>
      <span className="badge-dot" aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

/** Highest-assessed-category indicator used on cards ("evidence-status indicator"). */
export function EvidenceStatus({
  category,
}: {
  category: EvidenceCategory | null;
}) {
  if (!category) {
    return (
      <Badge className="badge-neutral" label="Evidence status: not yet assessed">
        Not yet assessed
      </Badge>
    );
  }
  return <EvidenceBadge category={category} />;
}
