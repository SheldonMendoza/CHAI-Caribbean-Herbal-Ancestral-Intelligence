/** /plants — the CHAI plant encyclopedia: search, filters, A–Z, pagination. */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  EvidenceCategory,
  FiltersResponse,
  PlantSummary,
} from '../../../shared/types';
import { EVIDENCE_CATEGORIES } from '../../../shared/types';
import { dataSource } from '../lib/data';
import { filterByLetter } from '../lib/query';
import { PageHero } from '../components/PageHero';
import { BigSearch } from '../components/BigSearch';
import { PlantCard } from '../components/PlantCard';
import { Badge, Button, EmptyState, Field, Input, Select } from '../components/ui';

const PER_PAGE = 12;
const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface FilterState {
  country: string;
  family: string;
  use: string;
  evidence: string;
  safety: boolean;
  sort: 'name_asc' | 'name_desc' | 'recently_reviewed';
}

const EMPTY_FILTERS: FilterState = {
  country: '',
  family: '',
  use: '',
  evidence: '',
  safety: false,
  sort: 'name_asc',
};

export function Plants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [letter, setLetter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<PlantSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [featured, setFeatured] = useState<PlantSummary[]>([]);
  const [recent, setRecent] = useState<PlantSummary[]>([]);
  const [filterMeta, setFilterMeta] = useState<FiltersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const searching = q.trim() !== '';
  const filtering =
    filters.country !== '' ||
    filters.family !== '' ||
    filters.use !== '' ||
    filters.evidence !== '' ||
    filters.safety ||
    letter !== '';
  const browsing = !searching && !filtering;

  // Filter metadata (countries, families, uses, evidence levels with counts).
  useEffect(() => {
    let live = true;
    dataSource.getFilters().then((f) => {
      if (live) setFilterMeta(f);
    });
    return () => {
      live = false;
    };
  }, []);

  // Featured + recently-reviewed rails (shown in browse mode only).
  useEffect(() => {
    let live = true;
    (async () => {
      const [f, r] = await Promise.all([
        dataSource.search({ featured: true, per_page: 3 }),
        dataSource.search({ sort: 'recently_reviewed', per_page: 3 }),
      ]);
      if (!live) return;
      setFeatured(f.data);
      setRecent(r.data);
    })();
    return () => {
      live = false;
    };
  }, []);

  // Main result set.
  useEffect(() => {
    let live = true;
    setLoading(true);
    (async () => {
      if (letter) {
        // A–Z mode: pull a wide page and filter client-side.
        const res = await dataSource.search({
          q: q || undefined,
          country: filters.country || undefined,
          family: filters.family || undefined,
          use: filters.use || undefined,
          evidence: (filters.evidence as EvidenceCategory) || undefined,
          safety: filters.safety || undefined,
          sort: filters.sort,
          per_page: 50,
          page: 1,
        });
        if (!live) return;
        const matched = filterByLetter(res.data, letter);
        const pages = Math.max(1, Math.ceil(matched.length / PER_PAGE));
        const pg = Math.min(page, pages);
        setResults(matched.slice((pg - 1) * PER_PAGE, pg * PER_PAGE));
        setTotalPages(pages);
        setTotal(matched.length);
        if (pg !== page) setPage(pg);
      } else {
        const res = await dataSource.search({
          q: q || undefined,
          country: filters.country || undefined,
          family: filters.family || undefined,
          use: filters.use || undefined,
          evidence: (filters.evidence as EvidenceCategory) || undefined,
          safety: filters.safety || undefined,
          sort: filters.sort,
          per_page: PER_PAGE,
          page,
        });
        if (!live) return;
        setResults(res.data);
        setTotalPages(res.pagination.total_pages);
        setTotal(res.pagination.total);
        if (res.pagination.page !== page) setPage(res.pagination.page);
      }
      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, [q, filters, letter, page]);

  // Reset to page 1 whenever the query shape changes.
  useEffect(() => {
    setPage(1);
  }, [q, filters, letter]);

  const setFilter = (patch: Partial<FilterState>) =>
    setFilters((f) => ({ ...f, ...patch }));

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setLetter('');
    setSearchParams(searchParams.get('q') ? { q: searchParams.get('q')! } : {});
  };

  const activeFilterCount =
    (filters.country ? 1 : 0) +
    (filters.family ? 1 : 0) +
    (filters.use ? 1 : 0) +
    (filters.evidence ? 1 : 0) +
    (filters.safety ? 1 : 0) +
    (letter ? 1 : 0);

  return (
    <>
      <PageHero title="Plant Encyclopedia">
        <p>
          Search the plants of the Caribbean by name, use, island, or evidence —
          with traditional knowledge and scientific findings kept clearly apart.
        </p>
      </PageHero>

      <div className="container">
        <div className="section-tight">
          <BigSearch initial={q} />
        </div>

        {/* Browse-mode rails */}
        {browsing && featured.length > 0 && (
          <section aria-labelledby="feat-rail" className="section-tight">
            <h2 id="feat-rail" style={{ fontSize: '1.35rem' }}>Featured</h2>
            <div className="grid grid-3">
              {featured.map((p) => (
                <PlantCard key={p.slug} plant={p} />
              ))}
            </div>
          </section>
        )}
        {browsing && recent.length > 0 && (
          <section aria-labelledby="recent-rail" className="section-tight">
            <h2 id="recent-rail" style={{ fontSize: '1.35rem' }}>Recently reviewed</h2>
            <div className="grid grid-3">
              {recent.map((p) => (
                <PlantCard key={p.slug} plant={p} />
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section aria-label="Filter plants" className="section-tight">
          <h2 style={{ fontSize: '1.35rem' }}>Browse &amp; filter</h2>
          <div className="filter-bar">
            <Field id="f-country" label="Country / territory">
              <Select
                id="f-country"
                value={filters.country}
                onChange={(e) => setFilter({ country: e.target.value })}
              >
                <option value="">All countries</option>
                {(filterMeta?.countries ?? []).map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="f-family" label="Botanical family">
              <Select
                id="f-family"
                value={filters.family}
                onChange={(e) => setFilter({ family: e.target.value })}
              >
                <option value="">All families</option>
                {(filterMeta?.families ?? []).map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.count})
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="f-use" label="Traditional use">
              <Select
                id="f-use"
                value={filters.use}
                onChange={(e) => setFilter({ use: e.target.value })}
              >
                <option value="">All uses</option>
                {(filterMeta?.uses ?? []).map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name} ({u.count})
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="f-evidence" label="Evidence level">
              <Select
                id="f-evidence"
                value={filters.evidence}
                onChange={(e) => setFilter({ evidence: e.target.value })}
              >
                <option value="">Any evidence level</option>
                {(filterMeta?.evidence_levels ?? []).map((e) => (
                  <option key={e.category} value={e.category}>
                    {EVIDENCE_CATEGORIES[e.category].label} ({e.count})
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="f-sort" label="Sort by">
              <Select
                id="f-sort"
                value={filters.sort}
                onChange={(e) =>
                  setFilter({ sort: e.target.value as FilterState['sort'] })
                }
              >
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="recently_reviewed">Recently reviewed</option>
              </Select>
            </Field>
            <div className="filter-row" style={{ alignItems: 'flex-end', paddingBottom: '1rem' }}>
              <label className="checkbox-field" htmlFor="f-safety">
                <Input
                  id="f-safety"
                  type="checkbox"
                  checked={filters.safety}
                  onChange={(e) => setFilter({ safety: e.target.checked })}
                  style={{ width: 'auto' }}
                />
                Safety concern flagged
              </label>
              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear all ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>

          {/* A–Z browsing */}
          <div>
            <span id="az-label" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Browse A–Z:
            </span>
            <div className="az-row" role="group" aria-labelledby="az-label">
              {AZ.map((l) => (
                <button
                  key={l}
                  type="button"
                  className="az-btn"
                  aria-pressed={letter === l}
                  onClick={() => setLetter((cur) => (cur === l ? '' : l))}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section aria-label="Plant results" aria-live="polite" className="section-tight">
          <p style={{ color: '#41544a' }} role="status">
            {loading
              ? 'Loading plants…'
              : total === 0
                ? 'No plants match.'
                : `${total} plant${total === 1 ? '' : 's'} found`}
            {letter && ` starting with “${letter}”`}
          </p>
          {!loading && results.length === 0 ? (
            <EmptyState title="No plants found">
              <p>
                Try a different search term, clear a filter, or pick another
                letter. New plants are added as research is verified.
              </p>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear search &amp; filters
              </Button>
            </EmptyState>
          ) : (
            <div className="grid grid-3">
              {results.map((p) => (
                <PlantCard key={p.slug} plant={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Plant results pages">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                ← Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant="outline"
                  size="sm"
                  aria-current={n === page ? 'page' : undefined}
                  onClick={() => setPage(n)}
                  aria-label={`Page ${n}`}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                Next →
              </Button>
              {letter && (
                <Badge className="badge-neutral">A–Z mode: browsing locally</Badge>
              )}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
