import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PlatformMetadata } from '../shared/types.ts';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';

interface PublicShellPageProps {
  title: string;
  summary: string;
  plannedPhase: string;
}

export function PublicShellPage({
  title,
  summary,
  plannedPhase,
}: PublicShellPageProps) {
  const [metadata, setMetadata] = useState<PlatformMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/meta/platform')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: { platform: PlatformMetadata }) => {
        if (active) {
          setMetadata(data.platform);
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to reach platform metadata endpoint.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PublicLayout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-medium text-[#52525B]">
            LankaWorks · {plannedPhase}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#18181B]">
            {title}
          </h1>
          <p className="text-base text-[#52525B] leading-relaxed">{summary}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-2">
            <p className="text-xs font-medium text-[#52525B]">Coverage</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-[#18181B]">
              {metadata ? `${metadata.provincesCount} Provinces · ${metadata.districtsCount} Districts` : 'Loading...'}
            </p>
            <p className="text-sm text-[#52525B]">
              Structured Sri Lanka locations seeded in Phase 03.
            </p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-2">
            <p className="text-xs font-medium text-[#52525B]">Customer Access</p>
            <p className="font-display text-2xl font-semibold text-[#18181B]">
              Guest or Account
            </p>
            <p className="text-sm text-[#52525B]">
              Always free for customers. Book with Reference and PIN or sign in.
            </p>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-2">
            <p className="text-xs font-medium text-[#52525B]">Worker Trial</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-[#18181B]">
              {metadata ? `${metadata.trialMonths} Months Free` : 'Loading...'}
            </p>
            <p className="text-sm text-[#52525B]">
              Standard plan {metadata ? `LKR ${metadata.defaultMonthlyFeeLkr.toLocaleString()}/mo` : ''} after trial.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 bg-white border border-[#E4E4E7] rounded-xl p-4 text-sm text-[#DC2626]"
          >
            {error}
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-[#E4E4E7] flex flex-wrap gap-3">
          <Link
            to="/services"
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors whitespace-nowrap"
          >
            Browse Services
          </Link>
          <Link
            to="/track-booking"
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] bg-white text-[#18181B] hover:bg-[#F4F4F5] transition-colors whitespace-nowrap"
          >
            Track Guest Booking
          </Link>
          <Link
            to="/worker"
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] bg-white text-[#18181B] hover:bg-[#F4F4F5] transition-colors whitespace-nowrap"
          >
            Worker Portal
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
