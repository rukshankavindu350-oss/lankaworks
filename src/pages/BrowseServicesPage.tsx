import { ArrowRight, Search, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';
import { ServiceCard } from '../components/marketplace/ServiceCard.tsx';
import {
  createInitialMarketplaceCatalog,
  fetchMarketplaceCatalog,
  filterApprovedWorkers,
  filterMarketplaceListings,
  type MarketplaceCatalogSnapshot,
} from '../lib/marketplaceService.ts';

export function BrowseServicesPage({ mode = 'browse' }: { mode?: 'browse' | 'search' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState<MarketplaceCatalogSnapshot>(() =>
    createInitialMarketplaceCatalog(),
  );
  const [loading, setLoading] = useState(true);

  const queryText = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';
  const provinceId = searchParams.get('province') || '';
  const districtId = searchParams.get('district') || '';
  const cityId = searchParams.get('city') || '';

  useEffect(() => {
    let active = true;
    fetchMarketplaceCatalog()
      .then((snap) => {
        if (active) {
          setCatalog(snap);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const availableDistricts = useMemo(() => {
    if (!provinceId) return catalog.districts;
    return catalog.districts.filter((d) => d.provinceId === provinceId);
  }, [catalog.districts, provinceId]);

  const availableCities = useMemo(() => {
    if (districtId) {
      return catalog.cities.filter((c) => c.districtId === districtId);
    }
    if (provinceId) {
      return catalog.cities.filter((c) => c.provinceId === provinceId);
    }
    return catalog.cities;
  }, [catalog.cities, districtId, provinceId]);

  const filteredServices = useMemo(() => {
    return filterMarketplaceListings(
      catalog.services,
      { queryText, categoryId, provinceId, districtId, cityId },
      catalog.provinces,
      catalog.districts,
      catalog.cities,
    );
  }, [catalog, categoryId, cityId, districtId, provinceId, queryText]);

  const filteredWorkers = useMemo(() => {
    return filterApprovedWorkers(
      catalog.workers,
      { queryText, categoryId, provinceId, districtId, cityId },
      catalog.categories,
      catalog.provinces,
      catalog.districts,
    );
  }, [catalog, categoryId, cityId, districtId, provinceId, queryText]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key === 'province') {
      next.delete('district');
      next.delete('city');
    }
    if (key === 'district') {
      next.delete('city');
    }
    setSearchParams(next, { replace: true });
  }

  function clearAllFilters() {
    setSearchParams({}, { replace: true });
  }

  const activeCategoryName = catalog.categories.find((c) => c.id === categoryId)?.name;

  return (
    <PublicLayout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#0F766E]">
            Sri Lanka Service Directory · 9 Provinces &amp; 25 Districts
          </p>
          <h1 className="font-display text-3xl font-bold text-[#18181B]">
            {activeCategoryName
              ? activeCategoryName
              : mode === 'search'
                ? 'Search Services & Providers'
                : 'Browse Local Services'}
          </h1>
          <p className="text-sm text-[#52525B]">
            Filter verified services by keyword, category, province, district, and city.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative flex items-center">
              <Search className="w-4 h-4 text-[#52525B] absolute left-3 pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={queryText}
                onChange={(e) => updateParam('q', e.target.value)}
                placeholder="Search service, keyword, or provider..."
                aria-label="Filter by keyword"
                className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-[#E4E4E7] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
              {queryText && (
                <button
                  type="button"
                  onClick={() => updateParam('q', '')}
                  aria-label="Clear keyword"
                  className="absolute right-2 p-1 text-[#52525B] hover:text-[#18181B]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Filter by category"
                value={categoryId}
                onChange={(e) => updateParam('category', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#E4E4E7] bg-white"
              >
                <option value="">All Categories</option>
                {catalog.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by province"
                value={provinceId}
                onChange={(e) => updateParam('province', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#E4E4E7] bg-white"
              >
                <option value="">All 9 Provinces</option>
                {catalog.provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name.replace(' Province', '')}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Filter by district"
                value={districtId}
                onChange={(e) => updateParam('district', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#E4E4E7] bg-white"
              >
                <option value="">All Districts</option>
                {availableDistricts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <select
                aria-label="Filter by city or town"
                value={cityId}
                onChange={(e) => updateParam('city', e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-[#E4E4E7] bg-white"
              >
                <option value="">All Cities &amp; Towns</option>
                {availableCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <span className="text-xs text-[#52525B] tabular-nums">
                {loading
                  ? 'Loading...'
                  : `${filteredServices.length} service${filteredServices.length === 1 ? '' : 's'} · ${filteredWorkers.length} provider${filteredWorkers.length === 1 ? '' : 's'}`}
              </span>
            </div>

            {(queryText || categoryId || provinceId || districtId || cityId) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-[#0F766E] hover:underline self-start sm:self-auto"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-white border border-[#E4E4E7] animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length === 0 && filteredWorkers.length === 0 ? (
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-10 text-center space-y-3">
            <h2 className="font-display text-xl font-semibold text-[#18181B]">
              No matching services or providers found
            </h2>
            <p className="text-sm text-[#52525B] max-w-md mx-auto">
              There are currently no published listings matching your active filters. Try clearing your filters or check back as verified Sri Lankan providers publish services.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59]"
              >
                Reset Filters
              </button>
              <Link
                to="/worker"
                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] text-[#18181B]"
              >
                Register as a Provider
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredServices.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold text-[#18181B]">
                  Service Listings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((svc) => (
                    <ServiceCard key={svc.id} service={svc} />
                  ))}
                </div>
              </div>
            )}

            {filteredWorkers.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold text-[#18181B]">
                  Verified Service Providers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredWorkers.map((worker) => (
                    <Link
                      key={worker.uid}
                      to={`/workers/${encodeURIComponent(worker.uid)}`}
                      className="bg-white border border-[#E4E4E7] rounded-xl p-5 flex items-start justify-between gap-4 hover:border-[#0F766E] transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-[#18181B] truncate">
                            {worker.businessName}
                          </h3>
                          <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" aria-label="Verified Provider" />
                        </div>
                        <p className="text-sm text-[#52525B] line-clamp-2">{worker.bio}</p>
                        <p className="text-xs text-[#52525B]">
                          {worker.districtIds
                            .map((id) => catalog.districts.find((d) => d.id === id)?.name)
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#52525B] shrink-0 mt-1" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
