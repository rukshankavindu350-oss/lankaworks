import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';

export function NotFoundPage() {
  return (
    <PublicLayout>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <p className="font-mono text-sm text-[#52525B] tabular-nums">404</p>
        <h1 className="font-display text-3xl font-bold text-[#18181B]">
          Page not found
        </h1>
        <p className="text-sm text-[#52525B]">
          The page you requested does not exist on LankaWorks.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
