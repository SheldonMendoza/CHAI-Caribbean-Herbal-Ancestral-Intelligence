# CHAI Seed-Data Format — Phase 1

Single source of truth: `data/seed-plants.json`
Consumers:
- `scripts/generate-seed-sql.mjs` → `migrations/0002_seed.sql` (D1)
- `web/src/data/seed-plants.json` (copied verbatim at integration; SPA data layer)

## The 15 starter plants (id / slug — locked)

| # | id / slug | common name |
|---|---|---|
| 1 | `fever-grass` | Fever Grass |
| 2 | `cerasee` | Cerasee |
| 3 | `aloe-vera` | Aloe Vera |
| 4 | `moringa` | Moringa |
| 5 | `ginger` | Ginger |
| 6 | `turmeric` | Turmeric |
| 7 | `soursop` | Soursop |
| 8 | `guava-leaf` | Guava Leaf |
| 9 | `hibiscus-sorrel` | Hibiscus (Sorrel) |
| 10 | `neem` | Neem |
| 11 | `jamaican-dogwood` | Jamaican Dogwood |
| 12 | `guinea-hen-weed` | Guinea Hen Weed |
| 13 | `breadfruit-leaf` | Breadfruit Leaf |
| 14 | `wonder-of-the-world` | Wonder-of-the-World Leaf |
| 15 | `passionflower` | Passionflower (species determined by research — document the choice) |

## JSON shape

```json
{
  "version": 1,
  "exported": "2026-10-14",
  "sources": [
    {
      "id": "src-powo-cymbopogon-citratus",
      "title": "Cymbopogon citratus (DC.) Stapf",
      "authors": "Plants of the World Online, Royal Botanic Gardens, Kew",
      "year": null,
      "journal": "",
      "doi": "",
      "url": "https://powo.science.kew.org/taxon/...",
      "source_type": "database",
      "accessed": "2026-10-14",
      "notes": "Accepted name + family verification"
    }
  ],
  "plants": [
    {
      "id": "fever-grass",
      "slug": "fever-grass",
      "common_name": "Fever Grass",
      "scientific_name": "Cymbopogon citratus",
      "scientific_name_authorship": "(DC.) Stapf",
      "family": "Poaceae",
      "featured": true,
      "reviewer_status": "verified",
      "last_reviewed": "2026-10-14",
      "botanical_description": "",
      "identification": "",
      "parts_used": ["Leaves"],
      "constituents": [{ "name": "Citral", "note": "" }],
      "cultural_background": "",
      "traditional_use_summary": "",
      "disambiguation_note": "",
      "names": [
        { "name": "Lemongrass", "name_type": "regional", "region": "Trinidad and Tobago", "notes": "" },
        { "name": "Andropogon citratus", "name_type": "synonym", "region": null, "notes": "Basionym" }
      ],
      "distribution": [
        { "country": "Trinidad and Tobago", "status": "introduced", "note": "" }
      ],
      "traditional_uses": [
        { "use": "", "countries": ["Trinidad and Tobago"], "preparation": "", "source_ids": ["src-..."] }
      ],
      "claims": [
        {
          "claim": "",
          "assessments": [
            {
              "category": "traditional_use_documented",
              "summary": "",
              "study_design": "",
              "population": "",
              "preparation_studied": "",
              "main_findings": "",
              "limitations": "",
              "adverse_effects": "",
              "source_ids": ["src-..."],
              "reviewer_status": "verified",
              "last_reviewed": "2026-10-14"
            }
          ]
        }
      ],
      "safety": {
        "summary": "", "side_effects": "", "interactions": "",
        "pregnancy": "", "children": "", "contraindications": ""
      },
      "images": [
        {
          "url": "https://upload.wikimedia.org/...",
          "caption": "",
          "attribution": "Photo: <author>, Wikimedia Commons",
          "license": "CC BY-SA 4.0",
          "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
          "source_url": "https://commons.wikimedia.org/wiki/File:..."
        }
      ]
    }
  ]
}
```

Rules:
- Every `source_ids` entry MUST reference an id present in top-level `sources`.
- Every source MUST have a `url` that was actually fetched and verified on the `accessed` date. No invented DOIs, authors, titles, or URLs. If a fact cannot be sourced, leave the field `""` / `[]` — the UI renders "Not yet documented."
- `reviewer_status`: `verified` only when the underlying facts were each checked against a retrieved source; otherwise `draft`.
- Evidence categories: use the 6 categories honestly. Most traditional claims will be `traditional_use_documented`; lab/animal findings `preliminary`; real documented risks `safety_concern`; claims with no retrievable support get NO assessment (field stays empty — do not invent `insufficient_evidence` assessments without a source discussing the evidence gap).

## Controlled country/territory vocabulary

Use these exact spellings. Add others only if a retrieved source documents them:

Trinidad and Tobago, Jamaica, Guyana, Barbados, Grenada, Saint Lucia, Dominica,
Antigua and Barbuda, Saint Vincent and the Grenadines, Haiti, Dominican Republic,
Belize, Suriname, Bahamas, Cuba, Puerto Rico, Guadeloupe, Martinique,
Saint Kitts and Nevis, Aruba, Curaçao, Bonaire, U.S. Virgin Islands,
British Virgin Islands, Cayman Islands, Turks and Caicos Islands, Anguilla, Montserrat

## Regional names — attribution discipline

A regional name is recorded ONLY with a source that ties the name to the island.
Format: `{ name, name_type: "regional", region: "<island>", notes: "<source hint>" }`.
When sources conflict on which plant a common name refers to, say so in
`disambiguation_note` and pick the identity the weight of retrieved sources supports.

## Images

- Minimum 1 verified image per plant; freely licensed only (Wikimedia Commons).
- Verify the license ON THE FILE PAGE (not search results). Record author, license name, license URL, file page URL.
- Hotlink the direct `upload.wikimedia.org` file URL (prefer ~1280px thumbnail via `Special:FilePath?width=1280` only if the direct file URL is unwieldy — record whichever is used).

## Research starting points (not exhaustive)

- Taxonomy/family: Kew Plants of the World Online (powo.science.kew.org)
- Distribution/status: CABI Compendium, POWO native-range statements
- Caribbean traditional use: TRAMIL program publications, peer-reviewed ethnobotanical surveys (PubMed / Google Scholar)
- Clinical/lab evidence: PubMed, PubMed Central, systematic reviews
- Always fetch the page; never cite from a snippet alone.
