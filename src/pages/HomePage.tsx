import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';
import { SearchBar } from '../components/marketplace/SearchBar.tsx';
import { ServiceCard } from '../components/marketplace/ServiceCard.tsx';
import { getCategoryIcon } from '../lib/categoryIcons.tsx';
import {
  createInitialMarketplaceCatalog,
  fetchMarketplaceCatalog,
  filterApprovedWorkers,
  filterMarketplaceListings,
  type MarketplaceCatalogSnapshot,
} from '../lib/marketplaceService.ts';

export function HomePage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<MarketplaceCatalogSnapshot>(() =>
    createInitialMarketplaceCatalog(),
  );
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const [queryText, setQueryText] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [hasExecutedSearch, setHasExecutedSearch] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMarketplaceCatalog()
      .then((snap) => {
        if (active) {
          setCatalog(snap);
          setLoadingListings(false);
        }
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load marketplace catalog.');
          setLoadingListings(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const isSearching = hasExecutedSearch || queryText.trim().length > 0 || selectedDistrictId.length > 0;

  const matchingServices = useMemo(() => {
    if (!isSearching) return [];
    return filterMarketplaceListings(
      catalog.services,
      {
        queryText,
        districtId: selectedDistrictId || undefined,
      },
      catalog.provinces,
      catalog.districts,
      catalog.cities,
    );
  }, [catalog, isSearching, queryText, selectedDistrictId]);

  const matchingWorkers = useMemo(() => {
    if (!isSearching) return [];
    return filterApprovedWorkers(
      catalog.workers,
      {
        queryText,
        districtId: selectedDistrictId || undefined,
      },
      catalog.categories,
      catalog.provinces,
      catalog.districts,
    );
  }, [catalog, isSearching, queryText, selectedDistrictId]);

  function handleSearchSubmit() {
    setHasExecutedSearch(true);
  }

  function handleClearSearch() {
    setQueryText('');
    setSelectedDistrictId('');
    setHasExecutedSearch(false);
  }

  const featuredServices = catalog.services.slice(0, 6);
  const featuredWorkers = catalog.workers.slice(0, 4);
  const visibleCategories = catalog.categories.slice(0, 10);

  return (
    <PublicLayout>
      {/* Hero + Full-Width Search Bar */}
      <section className="border-b border-[#E4E4E7] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-medium tracking-wide text-[#0F766E]">
                Sri Lanka Local Services · 9 Provinces &amp; 25 Districts
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-[#18181B] leading-[1.12] max-w-2xl">
                Find Trusted Local Services Across Sri Lanka
              </h1>
              <p className="text-base text-[#52525B] max-w-xl leading-relaxed">
                Search verified electricians, plumbers, AC technicians, cleaners, and skilled trades near your city. Book directly as a guest or with a free account.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[16/10] lg:h-[260px] lg:aspect-auto w-full rounded-xl overflow-hidden border border-[#E4E4E7] bg-gradient-to-br from-[#F4F4F5] to-[#E4E4E7] flex items-center justify-center">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_lankaworks_home_1795235029763.jpg"
                    alt="Sri Lankan electrical technician inspecting a residential panel in Colombo"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center space-y-1">
                    <ShieldCheck className="w-8 h-8 text-[#0F766E] mx-auto" aria-hidden="true" />
                    <p className="font-display text-sm font-semibold text-[#18181B]">
                      Verified Local Professionals
                    </p>
                    <p className="text-xs text-[#52525B]">
                      Serving homes and businesses across Sri Lanka
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-7 sm:mt-8 space-y-3">
            <SearchBar
              catalog={catalog}
              queryText={queryText}
              selectedDistrictId={selectedDistrictId}
              onQueryChange={(next) => {
                setQueryText(next);
                if (!next.trim() && !selectedDistrictId) {
                  setHasExecutedSearch(false);
                }
              }}
              onDistrictChange={(next) => {
                setSelectedDistrictId(next);
                if (next) {
                  setHasExecutedSearch(true);
                } else if (!queryText.trim()) {
                  setHasExecutedSearch(false);
                }
              }}
              onSearchSubmit={handleSearchSubmit}
              onClear={handleClearSearch}
            />

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#52525B] px-0.5">
              <span>No customer fees</span>
              <span aria-hidden="true">·</span>
              <span>Guest booking with Reference &amp; PIN</span>
              <span aria-hidden="true">·</span>
              <Link to="/worker" className="text-[#0F766E] font-medium hover:underline">
                Offer your services (5 months free)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Inline Search Results (appears immediately when user searches on homepage) */}
      {isSearching && (
        <section
          aria-live="polite"
          className="border-b border-[#E4E4E7] bg-[#FAFAF9]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#18181B]">
                  Search Results
                </h2>
                <p className="text-sm text-[#52525B] tabular-nums">
                  {matchingServices.length} service{matchingServices.length === 1 ? '' : 's'} and{' '}
                  {matchingWorkers.length} verified provider{matchingWorkers.length === 1 ? '' : 's'} matched
                  {queryText.trim() ? ` for "${queryText.trim()}"` : ''}
                  {selectedDistrictId
                    ? ` in ${catalog.districts.find((d) => d.id === selectedDistrictId)?.name || 'selected district'}`
                    : ''}
                  .
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/search?q=${encodeURIComponent(queryText.trim())}&district=${encodeURIComponent(selectedDistrictId)}`,
                    )
                  }
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] text-[#18181B] whitespace-nowrap"
                >
                  Open Advanced Filters
                </button>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-[#18181B] text-white hover:bg-[#27272A] whitespace-nowrap"
                >
                  Clear Search
                </button>
              </div>
            </div>

            {matchingServices.length === 0 && matchingWorkers.length === 0 ? (
              <div className="bg-white border border-[#E4E4E7] rounded-xl p-8 text-center space-y-3">
                <p className="font-display text-lg font-semibold text-[#18181B]">
                  No matching services found
                </p>
                <p className="text-sm text-[#52525B] max-w-lg mx-auto">
                  Try a broader keyword, switch to All 25 Districts, or browse services by category below.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59]"
                  >
                    Clear Search
                  </button>
                  <Link
                    to="/services"
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] text-[#18181B]"
                  >
                    Browse All Services
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {matchingServices.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matchingServices.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                )}

                {matchingWorkers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-display text-base font-semibold text-[#18181B]">
                      Matching Verified Providers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matchingWorkers.map((worker) => (
                        <Link
                          key={worker.uid}
                          to={`/workers/${encodeURIComponent(worker.uid)}`}
                          className="bg-white border border-[#E4E4E7] rounded-xl p-5 flex items-start justify-between gap-4 hover:border-[#0F766E] transition-colors"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-display text-base font-semibold text-[#18181B] truncate">
                                {worker.businessName}
                              </p>
                              <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" aria-label="Verified Provider" />
                            </div>
                            <p className="text-sm text-[#52525B] line-clamp-2">{worker.bio}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#52525B] shrink-0 mt-1" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section
        aria-labelledby="categories-heading"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h2
              id="categories-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[#18181B]"
            >
              Explore Services by Category
            </h2>
            <p className="text-sm text-[#52525B]">
              Select a category to filter verified local services across Sri Lanka.
            </p>
          </div>

          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F766E] hover:text-[#115E59] whitespace-nowrap shrink-0"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {loadError && (
          <div role="alert" className="p-4 rounded-xl bg-white border border-[#E4E4E7] text-sm text-[#B91C1C]">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visibleCategories.map((cat) => {
            const Icon = getCategoryIcon(cat.iconName);
            return (
              <Link
                key={cat.id}
                to={`/services?category=${encodeURIComponent(cat.id)}`}
                className="group bg-white border border-[#E4E4E7] rounded-xl p-5 min-h-[144px] flex flex-col justify-between gap-4 hover:border-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#F4F4F5] text-[#0F766E] flex items-center justify-center group-hover:bg-[#0F766E] group-hover:text-white transition-colors shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-sm font-semibold text-[#18181B] group-hover:text-[#0F766E] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#52525B] line-clamp-2 leading-relaxed">
                    {cat.serviceCount > 0
                      ? `${cat.serviceCount} active service${cat.serviceCount === 1 ? '' : 's'}`
                      : cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Live Services & Verified Providers (Real DB records only) */}
      <section className="border-t border-[#E4E4E7] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-bold text-[#18181B]">
                Available Services &amp; Approved Providers
              </h2>
              <p className="text-sm text-[#52525B]">
                Every provider listed here is verified and approved in the LankaWorks directory.
              </p>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F766E] hover:text-[#115E59] whitespace-nowrap shrink-0"
            >
              <span>Browse All Services</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {loadingListings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-44 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7] animate-pulse" />
              ))}
            </div>
          ) : featuredServices.length === 0 && featuredWorkers.length === 0 ? (
            <div className="bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <p className="text-xs font-medium text-[#0F766E]">
                  Verified Local Directory
                </p>
                <h3 className="font-display text-lg font-semibold text-[#18181B]">
                  No published service listings yet
                </h3>
                <p className="text-sm text-[#52525B] leading-relaxed">
                  LankaWorks only displays real, Admin-approved Sri Lankan professionals. Service providers can register and submit listings in the Worker Portal to appear here.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  to="/worker"
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] whitespace-nowrap"
                >
                  Become a Provider
                </Link>
                <Link
                  to="/services"
                  className="px-5 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] bg-white text-[#18181B] hover:bg-[#F4F4F5] whitespace-nowrap"
                >
                  Explore Locations
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {featuredServices.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredServices.map((svc) => (
                    <ServiceCard key={svc.id} service={svc} />
                  ))}
                </div>
              )}

              {featuredWorkers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredWorkers.map((worker) => (
                    <Link
                      key={worker.uid}
                      to={`/workers/${encodeURIComponent(worker.uid)}`}
                      className="bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl p-5 flex items-start justify-between gap-4 hover:border-[#0F766E] transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-[#18181B] truncate">
                            {worker.businessName}
                          </h3>
                          <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" aria-label="Verified Provider" />
                        </div>
                        <p className="text-sm text-[#52525B] line-clamp-2">{worker.bio}</p>
                        <p className="text-xs text-[#52525B] flex items-center gap-1 pt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {worker.districtIds
                              .map((id) => catalog.districts.find((d) => d.id === id)?.name)
                              .filter(Boolean)
                              .slice(0, 3)
                              .join(', ') || 'Sri Lanka'}
                          </span>
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#52525B] shrink-0 mt-1" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sri Lanka 9 Provinces Quick Location Discovery + How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#18181B]">
            Browse Across Sri Lanka&apos;s 9 Provinces
          </h2>
          <p className="text-sm text-[#52525B]">
            Filter services across all 25 districts from Jaffna to Matara and Colombo to Batticaloa.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {catalog.provinces.map((prov) => {
              const distCount = catalog.districts.filter(
                (d) => d.provinceId === prov.id,
              ).length;
              return (
                <Link
                  key={prov.id}
                  to={`/services?province=${encodeURIComponent(prov.id)}`}
                  className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-3 hover:border-[#0F766E] transition-colors flex items-center justify-between gap-2"
                >
                  <span className="text-sm font-medium text-[#18181B] truncate">
                    {prov.name.replace(' Province', '')}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-[#52525B] shrink-0">
                    {distCount} dist
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-5">
          <h2 className="font-display text-xl font-bold text-[#18181B]">
            How LankaWorks Works
          </h2>
          <ol className="space-y-4 text-sm">
            <li className="space-y-1">
              <p className="font-semibold text-[#18181B]">01. Search by Service &amp; District</p>
              <p className="text-[#52525B]">
                Find real service listings across any province, district, or city without creating an account.
              </p>
            </li>
            <li className="space-y-1">
              <p className="font-semibold text-[#18181B]">02. Review Verified Providers</p>
              <p className="text-[#52525B]">
                Compare transparent LKR pricing, service coverage, working hours, and verified provider profiles.
              </p>
            </li>
            <li className="space-y-1">
              <p className="font-semibold text-[#18181B]">03. Book as Guest or Account</p>
              <p className="text-[#52525B]">
                Customers never pay platform fees. Track bookings securely using your booking reference and PIN.
              </p>
            </li>
          </ol>
          <div className="pt-2">
            <Link
              to="/how-it-works"
              className="text-sm font-medium text-[#0F766E] hover:underline"
            >
              Read full guide →
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
