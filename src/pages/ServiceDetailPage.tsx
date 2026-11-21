import { Clock, MapPin, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';
import {
  fetchPublicServiceDetail,
  type PublicServiceListing,
  type PublicWorkerSummary,
} from '../lib/marketplaceService.ts';

export function ServiceDetailPage() {
  const { serviceId } = useParams();
  const [service, setService] = useState<PublicServiceListing | null>(null);
  const [worker, setWorker] = useState<PublicWorkerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    let active = true;
    fetchPublicServiceDetail(serviceId)
      .then((res) => {
        if (active) {
          setService(res.service);
          setWorker(res.worker);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [serviceId]);

  return (
    <PublicLayout>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="h-64 rounded-xl bg-white border border-[#E4E4E7] animate-pulse" />
        ) : !service ? (
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-8 text-center space-y-3">
            <h1 className="font-display text-2xl font-bold text-[#18181B]">
              Service not available
            </h1>
            <p className="text-sm text-[#52525B]">
              This service listing is inactive or could not be found.
            </p>
            <Link
              to="/services"
              className="inline-block px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white border border-[#E4E4E7] rounded-xl p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#52525B]">
                <span>{service.categoryName}</span>
                <span aria-hidden="true">·</span>
                <span>{service.locationLabel}</span>
              </div>

              <h1 className="font-display text-3xl font-bold text-[#18181B]">
                {service.title}
              </h1>

              <p className="text-base text-[#52525B] leading-relaxed">
                {service.description}
              </p>

              <div className="pt-4 border-t border-[#E4E4E7] flex flex-wrap gap-6 text-sm text-[#52525B]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                  <span>{service.locationLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Clock className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                  <span>Estimated duration: {service.durationMinutes} min</span>
                </span>
              </div>
            </div>

            <aside className="lg:col-span-5 bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-5">
              <div className="space-y-1">
                <p className="text-xs text-[#52525B]">Standard Price</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-[#18181B]">
                  LKR {service.priceLkr.toLocaleString()}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E4E4E7] space-y-2">
                <p className="text-xs text-[#52525B]">Service Provider</p>
                <Link
                  to={`/workers/${encodeURIComponent(service.workerId)}`}
                  className="font-display text-base font-semibold text-[#18181B] hover:text-[#0F766E] block"
                >
                  {service.workerBusinessName}
                </Link>
                {service.workerVerified && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F766E]">
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    <span>Verified &amp; Admin-Approved Provider</span>
                  </p>
                )}
                {worker?.workingHoursSummary && (
                  <p className="text-xs text-[#52525B]">
                    Hours: {worker.workingHoursSummary}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[#E4E4E7] space-y-3">
                <p className="text-xs text-[#52525B]">
                  Guest and registered customer slot booking launches in Phase 05.
                </p>
                <Link
                  to={`/workers/${encodeURIComponent(service.workerId)}`}
                  className="block w-full text-center px-4 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59]"
                >
                  View Provider Profile
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
