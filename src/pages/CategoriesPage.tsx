import { ArrowRight, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';
import { getCategoryIcon } from '../lib/categoryIcons.tsx';
import {
  createInitialMarketplaceCatalog,
  fetchMarketplaceCatalog,
  type MarketplaceCategory,
} from '../lib/marketplaceService.ts';

export function CategoriesPage() {
  const [categories, setCategories] = useState<MarketplaceCategory[]>(
    () => createInitialMarketplaceCatalog().categories,
  );
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    let active = true;
    fetchMarketplaceCatalog()
      .then((snap) => {
        if (active) {
          setCategories(snap.categories);
        }
      })
      .catch(() => {
        // Retain sanitized initial categories on offline fallback
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [categories, filterText]);

  return (
    <PublicLayout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#0F766E]">Marketplace Directory</p>
            <h1 className="font-display text-3xl font-bold text-[#18181B]">
              Service Categories
            </h1>
            <p className="text-sm text-[#52525B]">
              Choose a category to discover verified local professionals across Sri Lanka.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#52525B] absolute left-3 top-3 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter categories..."
              aria-label="Filter categories"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E4E4E7] bg-white"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-8 text-center space-y-3">
            <p className="font-display text-lg font-semibold text-[#18181B]">
              No categories match &ldquo;{filterText}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => setFilterText('')}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#0F766E] text-white"
            >
              Show All Categories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((cat) => {
              const Icon = getCategoryIcon(cat.iconName);
              return (
                <Link
                  key={cat.id}
                  to={`/services?category=${encodeURIComponent(cat.id)}`}
                  className="group bg-white border border-[#E4E4E7] rounded-xl p-6 flex flex-col justify-between gap-4 hover:border-[#0F766E] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-11 h-11 rounded-lg bg-[#F4F4F5] text-[#0F766E] flex items-center justify-center group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#52525B] group-hover:text-[#0F766E]" aria-hidden="true" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="font-display text-lg font-semibold text-[#18181B] group-hover:text-[#0F766E]">
                      {cat.name}
                    </h2>
                    <p className="text-sm text-[#52525B] leading-relaxed">
                      {cat.description}
                    </p>
                    {cat.serviceCount > 0 && (
                      <p className="text-xs font-medium text-[#0F766E] tabular-nums pt-1">
                        {cat.serviceCount} active service{cat.serviceCount === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
