import { Clock, MapPin, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';
import { ServiceCard } from '../components/marketplace/ServiceCard.tsx';
import {
  fetchApprovedWorkerDetail,
  fetchMarketplaceCatalog,
  type MarketplaceCatalogSnapshot,
  type PublicServiceListing,
  type PublicWorkerSummary,
} from '../lib/marketplaceService.ts';

export function WorkerProfilePage() {
  const { workerId } = useParams();
  const [worker, setWorker] = useState<PublicWorkerSummary | null>(null);
  const [services, setServices] = useState<PublicServiceListing[]>([]);
  const [catalog, setCatalog] = useState<MarketplaceCatalogSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workerId) {
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([fetchApprovedWorkerDetail(workerId), fetchMarketplaceCatalog()])
      .then(([detail, snap]) => {
        if (active) {
          setWorker(detail.worker);
          setServices(detail.services);
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
  }, [workerId]);

  return (
    <PublicLayout>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {loading ? (
          <div className="h-48 rounded-xl bg-white border border-[#E4E4E7] animate-pulse" />
        ) : !worker ? (
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-8 text-center space-y-3">
            <h1 className="font-display text-2xl font-bold text-[#18181B]">
              Provider profile unavailable
            </h1>
            <p className="text-sm text-[#52525B]">
              This service provider does not exist or has not yet been approved by LankaWorks.
            </p>
            <Link
              to="/services"
              className="inline-block px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white"
            >
              Browse Approved Services
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#0F766E] font-medium">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Verified &amp; Approved Provider</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-[#18181B]">
                {worker.businessName}
              </h1>
              <p className="text-base text-[#52525B] leading-relaxed">{worker.bio}</p>

              <div className="pt-3 border-t border-[#E4E4E7] flex flex-wrap gap-6 text-sm text-[#52525B]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                  <span>
                    {worker.districtIds
                      .map((id) => catalog?.districts.find((d) => d.id === id)?.name)
                      .filter(Boolean)
                      .join(', ') || 'Sri Lanka'}
                  </span>
                </span>
                {worker.workingHoursSummary && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                    <span>{worker.workingHoursSummary}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#18181B]">
                Services Offered
              </h2>
              {services.length === 0 ? (
                <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 text-sm text-[#52525B]">
                  This verified provider has not published individual service packages yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((svc) => (
                    <ServiceCard key={svc.id} service={svc} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </PublicLayout>
  );
}
