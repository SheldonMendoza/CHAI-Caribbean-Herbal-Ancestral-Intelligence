/** Unit tests: evidence helpers + source resolution. */
import { describe, expect, it } from 'vitest';
import {
  EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_ORDER,
  EVIDENCE_RANK,
  highestEvidence,
  type EvidenceCategory,
  type SourceRef,
} from '../../shared/types';
import { resolvePlantSources, sourcesByIds } from '../src/lib/query';
import { cerasee } from './fixtures';

describe('EVIDENCE_CATEGORIES', () => {
  it('defines exactly the 6 required categories', () => {
    expect(Object.keys(EVIDENCE_CATEGORIES).sort()).toEqual(
      [
        'insufficient_evidence',
        'moderate_human',
        'preliminary',
        'safety_concern',
        'strong_human',
        'traditional_use_documented',
      ].sort(),
    );
  });

  it('gives every category a label, description, and badge class', () => {
    for (const cat of EVIDENCE_CATEGORY_ORDER) {
      const meta = EVIDENCE_CATEGORIES[cat];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
      expect(meta.badgeClass.length).toBeGreaterThan(0);
    }
  });

  it('orders categories strongest-first', () => {
    expect(EVIDENCE_CATEGORY_ORDER[0]).toBe('strong_human');
    expect(EVIDENCE_CATEGORY_ORDER[EVIDENCE_CATEGORY_ORDER.length - 1]).toBe(
      'safety_concern',
    );
  });
});

describe('EVIDENCE_RANK', () => {
  it('ranks stronger evidence higher; safety_concern is 0', () => {
    const cats: EvidenceCategory[] = [
      'strong_human',
      'moderate_human',
      'preliminary',
      'traditional_use_documented',
      'insufficient_evidence',
    ];
    const ranks = cats.map((c) => EVIDENCE_RANK[c]);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i - 1]).toBeGreaterThan(ranks[i]);
    }
    expect(EVIDENCE_RANK['safety_concern']).toBe(0);
  });
});

describe('highestEvidence', () => {
  it('returns the strongest category present', () => {
    expect(
      highestEvidence(['traditional_use_documented', 'preliminary', 'moderate_human']),
    ).toBe('moderate_human');
  });

  it('returns null for an empty list', () => {
    expect(highestEvidence([])).toBeNull();
  });

  it('treats safety_concern as the weakest (rank 0), not the highest', () => {
    expect(highestEvidence(['safety_concern', 'preliminary'])).toBe('preliminary');
    expect(highestEvidence(['safety_concern'])).toBe('safety_concern');
  });
});

describe('source resolution', () => {
  const srcA: SourceRef = {
    id: 'src-a',
    title: 'Fever grass ethnobotany',
    authors: 'A. Researcher',
    year: 2020,
    journal: 'J. Ethnobot.',
    doi: '',
    url: 'https://example.org/a',
    source_type: 'ethnobotanical',
    accessed: '2026-10-14',
    notes: '',
  };
  const srcB: SourceRef = {
    id: 'src-b',
    title: 'Unrelated paper',
    authors: '',
    year: null,
    journal: '',
    doi: '',
    url: 'https://example.org/b',
    source_type: 'peer_reviewed',
    accessed: '2026-10-14',
    notes: '',
  };
  const registry = new Map([
    ['src-a', srcA],
    ['src-b', srcB],
  ]);

  it('sourcesByIds preserves order and drops unknown ids', () => {
    expect(sourcesByIds(['src-b', 'src-a', 'nope'], registry)).toEqual([srcB, srcA]);
  });

  it('resolvePlantSources unions ids from uses and assessments', () => {
    const out = resolvePlantSources(cerasee, registry);
    // cerasee references no source ids in fixtures → empty
    expect(out).toEqual([]);
  });

  it('resolvePlantSources unions ids from traditional uses', () => {
    const plant = {
      ...cerasee,
      traditional_uses: [
        {
          use: 'x',
          countries: [],
          preparation: '',
          source_ids: ['src-a', 'src-b'],
        },
      ],
    };
    const out = resolvePlantSources(plant, registry);
    expect(out.map((s) => s.id).sort()).toEqual(['src-a', 'src-b']);
  });
});
