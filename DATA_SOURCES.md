# CHAI Seed Data — Sources

Every fact in `data/seed-plants.json` traces to a source below. All sources were
fetched and verified on **2026-10-14**. Nothing is cited from a search snippet
alone. Where a fact could not be verified, the field was left empty (`""`/`[]`).

## Methodology notes

- **Taxonomy:** each binomial, authorship and family was verified on the Kew
  Plants of the World Online (POWO) taxon page on 2026-10-14. Exact POWO taxon
  URLs were not preserved in working notes, so those registry entries carry an
  empty `url` rather than an invented one.
- **Traditional uses:** primarily two TRAMIL-methodology surveys —
  Clement et al. 2015 (Trinidad and Tobago, 450 households) and
  Picking et al. 2015 (Jamaica). Citation counts are taken from those papers.
- **Evidence:** one assessment per claim per source, using the six honest
  categories. `insufficient_evidence` is used only where a source explicitly
  discusses the evidence gap (WebMD on Jamaican dogwood).
- **Images:** Wikimedia Commons only. The license was verified **on the file
  page** (never from search results). Hotlink format:
  `https://commons.wikimedia.org/wiki/Special:FilePath/<filename>?width=1280`
  — a stable Commons redirect to a 1280px thumbnail, chosen per the contract's
  allowance for unwieldy direct URLs. The canonical file-page URL is recorded
  in `source_url` of every image.
- **Image verification gaps (honest report):** license badges on some Commons
  file pages do not render as text in text-extraction fetches (UploadWizard
  badge icons; old bot-upload templates). Files affected: aloe-vera, moringa,
  guava-leaf, passionflower (file pages opened; author and subject confirmed,
  license badge not visible in extracted text), turmeric, jamaican-dogwood,
  guinea-hen-weed, breadfruit-leaf (no verifiable file obtained). Those eight
  plants ship with `"images": []` and `reviewer_status: "draft"` until a
  human verifies the license on the file page. Six Commons file pages returned
  HTTP 403 on 2026-10-14 and were not retried (ginger Köhler plate, turmeric
  roots, aloe Praia, passionflower fruit, hibiscus Loma, soursop Starr fruit).

## Taxonomy (POWO, accessed 2026-10-14)

| # | Source ID | Taxon (as verified) |
|---|---|---|
| 1 | `src-powo-cymbopogon-citratus` | *Cymbopogon citratus* (DC.) Stapf — Poaceae. Native: India, Sri Lanka. Introduced incl. Trinidad and Tobago, Jamaica, Cuba, Haiti, Puerto Rico. |
| 2 | `src-powo-momordica-charantia` | *Momordica charantia* L. — Cucurbitaceae. Native: Old World tropics. Introduced incl. Trinidad and Tobago, Jamaica, Cuba, Haiti. |
| 3 | `src-powo-aloe-vera` | *Aloe vera* (L.) Burm.f. — Asphodelaceae. Native: Oman. Introduced incl. Trinidad and Tobago, Jamaica. |
| 4 | `src-powo-moringa-oleifera` | *Moringa oleifera* Lam. — Moringaceae. Native: India, Pakistan. |
| 5 | `src-powo-zingiber-officinale` | *Zingiber officinale* Roscoe — Zingiberaceae. Native: possibly India. |
| 6 | `src-powo-curcuma-longa` | *Curcuma longa* L. — Zingiberaceae. Native: India. |
| 7 | `src-powo-annona-muricata` | *Annona muricata* L. — Annonaceae. Native: tropical Americas. |
| 8 | `src-powo-psidium-guajava` | *Psidium guajava* L. — Myrtaceae. Native: South America. |
| 9 | `src-powo-hibiscus-sabdariffa` | *Hibiscus sabdariffa* L. — Malvaceae. Native: tropical Africa (exact home debated). POWO now treats it as a synonym of *Sabdariffa gossypiifolia* (genus *Sabdariffa* reinstated after *Hibiscus* found polyphyletic); medicinal literature uses *H. sabdariffa*, retained here. |
| 10 | `src-powo-azadirachta-indica` | *Azadirachta indica* A.Juss. — Meliaceae. Native: Assam to Vietnam. Introduced incl. Trinidad and Tobago, Jamaica, Cuba. |
| 11 | `src-powo-piscidia-piscipula` | *Piscidia piscipula* (L.) Sarg. — Fabaceae. Native: Bahamas, Belize, Cayman Islands, Cuba, Dominican Republic, Jamaica, etc. |
| 12 | `src-powo-petiveria-alliacea` | *Petiveria alliacea* L. — Petiveriaceae (APG IV). Native incl. Trinidad and Tobago, Cuba, Haiti, Jamaica. |
| 13 | `src-powo-artocarpus-altilis` | *Artocarpus altilis* (Parkinson) Fosberg — Moraceae. Native: Caroline Islands, Marianas. Introduced incl. Trinidad and Tobago, Jamaica. |
| 14 | `src-powo-bryophyllum-pinnatum` | *Bryophyllum pinnatum* (Lam.) Oken — Crassulaceae. POWO accepts *Kalanchoe pinnata* (Lam.) Pers. with *B. pinnatum* as homotypic synonym; Caribbean/TRAMIL literature uses *B. pinnatum*, retained here. Native: Madagascar + Cook Islands. Introduced: Jamaica, Trinidad and Tobago, Cuba, Haiti. |
| 15 | `src-powo-passiflora-edulis` | *Passiflora edulis* Sims — Passifloraceae. Native: NE Argentina, Brazil, Paraguay. Introduced: Jamaica, Trinidad and Tobago, Cuba, Dominican Republic. Chosen over *P. incarnata* (SE USA only, no Caribbean distribution) for the passionflower record. |

## Ethnobotanical / traditional-use sources

- **`src-tramil-trinidad-2015`** — Clement, Y.N. et al. (2015). Medicinal plants used in Trinidad and Tobago (TRAMIL methodology; 450 households). *Journal of Ethnobiology and Ethnomedicine*. DOI: 10.1186/s13002-015-0052-0. URL: https://doi.org/10.1186/s13002-015-0052-0. Accessed 2026-10-14.
- **`src-tramil-jamaica-2015`** — Picking, D. et al. (2015). Traditional herbal medicine use in Jamaica (TRAMIL survey). *Journal of Ethnopharmacology* 169:314–327. DOI: 10.1016/j.jep.2015.04.027. PMID: 25929450. URL: https://doi.org/10.1016/j.jep.2015.04.027. Accessed 2026-10-14.
- **`src-guava-liu-2024`** — Liu et al. (2024). Traditional uses of *Psidium guajava* for diarrheal disorders (44 countries incl. Trinidad and Tobago, Cuba, Guadeloupe, Martinique). *Frontiers in Pharmacology*. DOI: 10.3389/fphar.2024.1459066. PMC11377350. URL: https://doi.org/10.3389/fphar.2024.1459066. Accessed 2026-10-14.
- **`src-guava-gutierrez-2008`** — Gutiérrez, R.M.P.; Mitchell, S.; Solis, R.V. (2008). *Psidium guajava*: traditional uses, phytochemistry and pharmacology. *Journal of Ethnopharmacology* 117(1):1–27. PMID: 18353572. (URL not preserved in working notes.) Accessed 2026-10-14.
- **`src-hibiscus-toptropicals`** — TopTropicals. *Hibiscus sabdariffa* (Roselle) plant profile. URL: https://toptropicals.com/catalog/uid/hibiscus_sabdariffa.htm. Accessed 2026-10-14. Documents Jamaican sorrel Christmas tradition and folk antihypertensive use.
- **`src-moringa-mdpi-2017`** — (2017). Moringa in Jamaica. *Plants* (MDPI) 6(4):48. URL: https://www.mdpi.com/2223-7747/6/4/48. Accessed 2026-10-14. Documents moringa teas/juices/meals in Jamaican households since the 2000s.
- **`src-petiveria-costarica-2006`** — (2006). *Petiveria alliacea* TRAMIL study (Costa Rica). *Revista de Biología Tropical*. URL: https://www.scielo.sa.cr/scielo.php?script=sci_arttext&pid=S0034-77442006000500017. Accessed 2026-10-14. Documents abortive effect (uterine smooth-muscle contraction); contraindicated in pregnancy.

## Evidence sources (systematic reviews, trials, pharmacology)

- **`src-cerasee-zhang-2024`** — Zhang et al. (2024). *Momordica charantia* for glycemic control: systematic review and meta-analysis of RCTs. *Heliyon* 10(10):e31126. DOI: 10.1016/j.heliyon.2024.e31126. PMID: 38784554. PMC11112315. URL: https://doi.org/10.1016/j.heliyon.2024.e31126. Accessed 2026-10-14. 8 RCTs, n=423; FBG −0.85 mmol/L, PPG −2.28, HbA1c −0.38%; high heterogeneity; conflicts with Cochrane.
- **`src-ginger-viljoen-2014`** — Viljoen, E. et al. (2014). Ginger for nausea and vomiting: systematic review and meta-analysis. *Nutrition Journal* 13:20. PMID: 24642205. PMC3995184. URL: https://doi.org/10.1186/1475-2891-13-20. Accessed 2026-10-14. 12 RCTs, n=1278; nausea improved, vomiting NS; low-quality evidence.
- **`src-hibiscus-ellis-2022`** — Ellis et al. (2022). *Hibiscus sabdariffa* for blood pressure: systematic review and meta-analysis. *Nutrition Reviews* 80(6):1723–1737. PMID: 34927694. PMC9086798. URL: https://doi.org/10.1093/nutrit/nuab104. Accessed 2026-10-14. 17 RCTs; SBP −7.10 mmHg vs placebo.
- **`src-turmeric-daily-2016`** — Daily, J.W.; Yang, M.; Park, S. (2016). Turmeric extracts and curcumin for arthritis: systematic review and meta-analysis. *Journal of Medicinal Food* 19(8):717–729. PMID: 27533649. PMC5003001. URL: https://doi.org/10.1089/jmf.2016.3705. Accessed 2026-10-14. 8 RCTs; PVAS −2.04, WOMAC −15.36. Note: first author affiliated with Daily Manufacturing, Inc.
- **`src-aloe-hekmatpou-2019`** — Hekmatpou, D. et al. (2019). *Aloe vera* for wound healing: review of clinical trials. *Iranian Journal of Medical Sciences*. PMID: 30666070. PMC6330525. (URL not preserved in working notes.) Accessed 2026-10-14. 23 trials; supports complementary use for burns.
- **`src-soursop-moghadamtousi-2015`** — Moghadamtousi, S.Z. et al. (2015). *Annona muricata*: phytochemistry and anticancer potential. *International Journal of Molecular Sciences* 16(7):15625–15658. DOI: 10.3390/ijms160715625. URL: https://doi.org/10.3390/ijms160715625. Accessed 2026-10-14. In vitro/animal only.
- **`src-soursop-lannuzel-2003`** — Lannuzel, A. et al. (2003). Annonacin neurotoxicity; atypical parkinsonism link (Guadeloupe). *Journal of Neurochemistry*. PMID: 14675150. (URL not preserved in working notes.) Accessed 2026-10-14.
- **`src-petiveria-hernandez-2017`** — Hernandez et al. (2017). *Petiveria alliacea* in a mouse breast-cancer model. URL: https://link.springer.com/article/10.1186/s12906-023-04109-2 (via BMC protocol page). Accessed 2026-10-14. Animal evidence only.
- **`src-breadfruit-nwokocha-2012`** — Nwokocha, C.R. et al. (2012). Hypotensive/bradycardic effects of *Artocarpus altilis* leaf extract in rats (UWI Mona, Jamaica). *Pharmaceutical Biology*. PMID: 22830437. (URL not preserved in working notes.) Accessed 2026-10-14.
- **`src-moringa-stohs-2015`** — Stohs, S.J.; Hartman, M.J. (2015). *Moringa oleifera*: safety and efficacy in human studies. *Phytotherapy Research*. PMID: 25808883. PMC6680322. (URL not preserved in working notes.) Accessed 2026-10-14. 5 small human studies; no adverse effects reported.
- **`src-kalanchoe-mdpi-review`** — *Kalanchoe pinnata* (*Bryophyllum pinnatum*): phytochemistry and pharmacology review. *Molecules* (MDPI). URL: https://www.mdpi.com/1420-3049/31/19/3456. Accessed 2026-10-14. Preclinical wound-healing evidence; bufadienolide toxicity.
- **`src-dogwood-webmd`** — WebMD. Jamaican Dogwood: uses, side effects and safety. URL: https://www.webmd.com/vitamins/ai/ingredientmono-682/jamaican-dogwood. Accessed 2026-10-14. Explicitly states no human evidence for any use; documents rotenone toxicity.
- **`src-neem-oil-toxicity`** — Neem oil poisoning: clinical review. PMC9358515. URL: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9358515/. Accessed 2026-10-14. Pediatric poisoning: hepatic toxicity, encephalopathy, seizures.
- **`src-passiflora-scielo-2015`** — (2015). Anxiolytic/antidepressant-like effects of *Passiflora edulis* leaf extract in mice. *Revista Brasileira de Farmacognosia* (SciELO). URL: https://www.scielo.br/j/rbfar/a/Ms6phR8kXHd9wqV3qpZtNbG/. Accessed 2026-10-14. Animal evidence only.

## Safety sources

- **`src-nccih-aloe`** — National Center for Complementary and Integrative Health. Aloe vera: Herbs at a Glance. URL: https://www.nccih.nih.gov/health/aloe-vera. Accessed 2026-10-14. (Burn-healing support; latex risks; IARC possible carcinogen; pregnancy caution.)
- **`src-turmeric-safety-nhs`** — Welsh NHS. Turmeric adverse effects information. (URL not preserved in working notes.) Accessed 2026-10-14. (Gallstone/biliary concerns; liver injury reports; bleeding risk.)

## Image sources (license verified on the file page, 2026-10-14)

| Source ID | File | Author | License (verified on file page) |
|---|---|---|---|
| `src-img-fever-grass-starr` | [Starr-150325-0455 *Cymbopogon citratus*…](https://commons.wikimedia.org/wiki/File:Starr-150325-0455-Cymbopogon_citratus-in_planter_with_float_mulch-Residences_Sand_Island-Midway_Atoll_(25265744835).jpg) | Forest and Kim Starr | CC BY 3.0 US — https://creativecommons.org/licenses/by/3.0/us/deed.en |
| `src-img-neem-azogbonon` | [Margousier ou Neem 01.jpg](https://commons.wikimedia.org/wiki/File:Margousier_ou_Neem_01.jpg) | Azogbonon | CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/ |
| `src-img-wonder-starr` | [Starr-150326-0110 *Kalanchoe pinnata*…](https://commons.wikimedia.org/wiki/File:Starr-150326-0110-Kalanchoe_pinnata-in_pot-Comodore_Ave_Residences_Sand_Island-Midway_Atoll_(24635834884).jpg) | Forest and Kim Starr | CC BY 3.0 US — https://creativecommons.org/licenses/by/3.0/us/deed.en (description notes "Also known as *Bryophyllum pinnatum*") |
| `src-img-cerasee-volkamer` | [*Momordica charantia* chez Volkamer.jpg](https://commons.wikimedia.org/wiki/File:Momordica_charantia_chez_Volkamer.jpg) | Johann Christoph Volkamer (1714) | Public domain (PD-Art) — https://creativecommons.org/publicdomain/mark/1.0/ |
| `src-img-hibiscus-roselle` | [Roselle.jpg](https://commons.wikimedia.org/wiki/File:Roselle.jpg) | Ikiwaner (2008, Serekunda market, The Gambia) | Dual GFDL 1.2+ and CC BY-SA 3.0 — http://creativecommons.org/licenses/by-sa/3.0/ |
| `src-img-ginger-seikei` | [Seikei Zusetsu vol. 24, p. 036 — *Zingiber officinale*, 1804](https://commons.wikimedia.org/wiki/File:Leiden_University_Library_-_Seikei_Zusetsu_vol._24,_page_036_-_%E7%94%9F%E5%A7%9C_-_Zingiber_officinale_Roscoe,_1804.jpg) | Anonymous / Leiden University Library | CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/ |
| `src-img-soursop-blanco` | [*Annona muricata* Blanco1.196.png](https://commons.wikimedia.org/wiki/File:Annona_muricata_Blanco1.196.png) | Francisco Manuel Blanco, *Flora de Filipinas* (1880–1883) | Public domain by age of publication (pre-1929; author d. 1845). License badge did not render in text extraction; PD status determined from the publication date and author shown on the file page. |

## Disambiguation decisions (recorded in each plant's `disambiguation_note`)

1. **hibiscus-sorrel → *Hibiscus sabdariffa* L.** The name used across all medicinal/TRAMIL literature; not ornamental *H. rosa-sinensis*. POWO now sinks it into *Sabdariffa gossypiifolia*; retained *H. sabdariffa* with the synonymy documented.
2. **wonder-of-the-world → *Bryophyllum pinnatum* (Lam.) Oken.** Task brief + Caribbean/TRAMIL literature name. POWO accepts *Kalanchoe pinnata* (homotypic synonym), recorded as a synonym.
3. **passionflower → *Passiflora edulis* Sims.** Documented in the Trinidad TRAMIL survey ("Passion fruit", HBP). *P. incarnata* rejected (SE USA native only, no Caribbean POWO distribution). *P. quadrangularis* ("Barbadine") is a distinct species also in the survey but not covered here.
4. **fever-grass → *Cymbopogon citratus*.** Distinct from citronella grasses (*C. nardus* / *C. winterianus*).
5. **turmeric ("saffron"/"hardi", Trinidad)** = *Curcuma longa*; not true saffron (*Crocus sativus*).
6. **guinea-hen-weed** = *Petiveria alliacea*; family Petiveriaceae per APG IV (older sources: Phytolaccaceae).
7. **jamaican-dogwood** = *Piscidia piscipula* (Fabaceae); unrelated to true dogwoods (Cornaceae).
