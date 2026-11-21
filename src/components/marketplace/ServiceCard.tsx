import { ShieldCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PublicServiceListing } from '../../lib/marketplaceService.ts';

interface ServiceCardProps {
  service: PublicServiceListing;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <article className="bg-white border border-[#E4E4E7] rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5">
      <Link
        to={`/services/${encodeURIComponent(service.id)}`}
        className="block aspect-[4/3] bg-[#F4F4F5] overflow-hidden"
      >
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : service.workerPhotoUrl ? (
          <img
            src={service.workerPhotoUrl}
            alt={service.workerBusinessName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#71717A] px-4 text-center">
            <Wrench className="w-7 h-7" aria-hidden="true" />
            <span className="text-xs font-medium">{service.categoryName}</span>
          </div>
        )}
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#52525B] flex-wrap">
            <span>{service.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{service.locationLabel}</span>
          </div>

          <h3 className="font-display text-base font-semibold text-[#18181B] leading-snug">
            <Link
              to={`/services/${encodeURIComponent(service.id)}`}
              className="hover:text-[#0F766E] transition-colors"
            >
              {service.title}
            </Link>
          </h3>

          <p className="text-sm text-[#52525B] line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        <div className="pt-3 border-t border-[#E4E4E7] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/workers/${encodeURIComponent(service.workerId)}`}
              className="text-xs font-medium text-[#18181B] hover:text-[#0F766E] truncate block"
            >
              {service.workerBusinessName}
            </Link>
            {service.workerVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-[#0F766E] mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Verified Provider</span>
              </span>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="font-mono text-sm font-semibold tabular-nums text-[#18181B]">
              LKR {service.priceLkr.toLocaleString()}
            </p>
            <p className="text-xs text-[#52525B] tabular-nums">
              {service.durationMinutes} min
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
