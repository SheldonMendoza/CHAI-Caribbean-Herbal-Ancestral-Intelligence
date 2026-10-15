/** Shared test fixtures: minimal but schema-conformant PlantDetail records. */
import type { PlantDetail } from '../../shared/types';

function base(over: Partial<PlantDetail>): PlantDetail {
  return {
    id: 'x',
    slug: 'x',
    common_name: 'X',
    scientific_name: 'X x',
    scientific_name_authorship: '',
    family: 'Fam',
    botanical_description: '',
    identification: '',
    parts_used: [],
    constituents: [],
    cultural_background: '',
    traditional_use_summary: '',
    disambiguation_note: '',
    names: [],
    distribution: [],
    traditional_uses: [],
    claims: [],
    safety: {
      summary: '',
      side_effects: '',
      interactions: '',
      pregnancy: '',
      children: '',
      contraindications: '',
    },
    images: [],
    sources: [],
    reviewer_status: 'draft',
    featured: false,
    last_reviewed: '2026-10-14',
    ...over,
  } as PlantDetail;
}

export const feverGrass: PlantDetail = base({
  id: 'fever-grass',
  slug: 'fever-grass',
  common_name: 'Fever Grass',
  scientific_name: 'Cymbopogon citratus',
  scientific_name_authorship: '(DC.) Stapf',
  family: 'Poaceae',
  featured: true,
  last_reviewed: '2026-10-13',
  traditional_use_summary: 'Leaf tea used for fever and colds.',
  names: [
    { name: 'Lemongrass', name_type: 'regional', region: 'Trinidad and Tobago', notes: '' },
    { name: 'Andropogon citratus', name_type: 'synonym', region: null, notes: '' },
  ],
  distribution: [
    { country: 'Trinidad and Tobago', status: 'cultivated', note: '' },
    { country: 'Jamaica', status: 'cultivated', note: '' },
  ],
  parts_used: ['Leaves'],
  traditional_uses: [
    {
      use: 'Leaf tea taken for fever',
      countries: ['Trinidad and Tobago'],
      preparation: 'Steeped in hot water',
      source_ids: ['src-a'],
    },
  ],
  claims: [
    {
      claim: 'Fever grass tea reduces fever',
      assessments: [
        {
          category: 'traditional_use_documented',
          summary: 'Documented traditional use.',
          study_design: '',
          population: '',
          preparation_studied: '',
          main_findings: '',
          limitations: '',
          adverse_effects: '',
          source_ids: ['src-a'],
          reviewer_status: 'draft',
          last_reviewed: '2026-10-13',
        },
      ],
    },
  ],
  images: [
    {
      url: 'https://example.org/fever.jpg',
      caption: 'Fever grass',
      attribution: 'Photo: Test, Example',
      license: 'CC0',
      license_url: 'https://example.org',
      source_url: 'https://example.org/file',
    },
  ],
});

export const cerasee: PlantDetail = base({
  id: 'cerasee',
  slug: 'cerasee',
  common_name: 'Cerasee',
  scientific_name: 'Momordica charantia',
  scientific_name_authorship: 'L.',
  family: 'Cucurbitaceae',
  featured: true,
  last_reviewed: '2026-10-14',
  traditional_use_summary: 'Bitter leaf tea used as a cleansing washout.',
  names: [{ name: 'Bitter Melon', name_type: 'synonym', region: null, notes: '' }],
  distribution: [{ country: 'Jamaica', status: 'naturalized', note: '' }],
  parts_used: ['Leaves'],
  traditional_uses: [
    {
      use: 'Bitter tonic washout',
      countries: ['Jamaica'],
      preparation: 'Boiled',
      source_ids: [],
    },
  ],
  claims: [
    {
      claim: 'Cerasee cleanses the body',
      assessments: [
        {
          category: 'preliminary',
          summary: 'Lab findings only.',
          study_design: 'in vitro',
          population: '',
          preparation_studied: 'Leaf extract',
          main_findings: '',
          limitations: '',
          adverse_effects: '',
          source_ids: [],
          reviewer_status: 'draft',
          last_reviewed: '2026-10-14',
        },
      ],
    },
    {
      claim: 'Cerasee is safe in pregnancy',
      assessments: [
        {
          category: 'safety_concern',
          summary: 'Potential risk flagged.',
          study_design: '',
          population: '',
          preparation_studied: '',
          main_findings: '',
          limitations: '',
          adverse_effects: '',
          source_ids: [],
          reviewer_status: 'draft',
          last_reviewed: '2026-10-14',
        },
      ],
    },
  ],
});

export const aloeVera: PlantDetail = base({
  id: 'aloe-vera',
  slug: 'aloe-vera',
  common_name: 'Aloe Vera',
  scientific_name: 'Aloe vera',
  scientific_name_authorship: '(L.) Burm.f.',
  family: 'Asphodelaceae',
  featured: false,
  last_reviewed: '2026-10-12',
  traditional_use_summary: 'Leaf gel applied to burns and skin irritation.',
  distribution: [{ country: 'Barbados', status: 'cultivated', note: '' }],
  parts_used: ['Leaves'],
  traditional_uses: [
    {
      use: 'Gel applied to burns',
      countries: ['Barbados'],
      preparation: 'Fresh gel',
      source_ids: [],
    },
  ],
  claims: [
    {
      claim: 'Aloe gel soothes minor burns',
      assessments: [
        {
          category: 'moderate_human',
          summary: 'Human studies give limited support.',
          study_design: 'randomized controlled trial',
          population: 'Adults with minor burns',
          preparation_studied: 'Topical gel',
          main_findings: 'Faster healing observed.',
          limitations: 'Small samples.',
          adverse_effects: 'Rare skin irritation.',
          source_ids: [],
          reviewer_status: 'verified',
          last_reviewed: '2026-10-12',
        },
      ],
    },
  ],
});

export const ALL = [feverGrass, cerasee, aloeVera];
