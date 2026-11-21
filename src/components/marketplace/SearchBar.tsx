import { MapPin, Search, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  MarketplaceCatalogSnapshot,
  SearchSuggestion,
} from '../../lib/marketplaceService.ts';
import { buildSearchSuggestions } from '../../lib/marketplaceService.ts';

interface SearchBarProps {
  catalog: MarketplaceCatalogSnapshot;
  queryText: string;
  selectedDistrictId: string;
  onQueryChange: (next: string) => void;
  onDistrictChange: (next: string) => void;
  onSearchSubmit: () => void;
  onClear: () => void;
}

export function SearchBar({
  catalog,
  queryText,
  selectedDistrictId,
  onQueryChange,
  onDistrictChange,
  onSearchSubmit,
  onClear,
}: SearchBarProps) {
  const navigate = useNavigate();
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    return buildSearchSuggestions(queryText, catalog);
  }, [catalog, queryText]);

  const showSuggestions = focused && queryText.trim().length > 0 && suggestions.length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFocused(false);
    onSearchSubmit();
  }

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search local services"
        className="bg-white border border-[#E4E4E7] rounded-xl p-2 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2 focus-within:border-[#0F766E] transition-colors"
      >
        <div className="relative flex-1 min-w-0 flex items-center">
          <Search
            aria-hidden="true"
            className="w-5 h-5 text-[#52525B] absolute left-3.5 pointer-events-none shrink-0"
          />
          <input
            type="search"
            value={queryText}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setTimeout(() => setFocused(false), 160);
            }}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search services, trades, or providers"
            aria-label="Search services, categories, or providers"
            className={`w-full pl-11 ${
              queryText.length > 0 ? 'pr-10' : 'pr-3'
            } py-2.5 min-h-[44px] text-sm sm:text-base text-[#18181B] placeholder:text-[#71717A] bg-transparent rounded-lg focus:outline-none`}
          />
          {queryText.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onClear();
              }}
              aria-label="Clear search query"
              className="absolute right-2 p-1.5 rounded-md text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] min-w-[32px] min-h-[32px] inline-flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="hidden md:block w-px h-7 bg-[#E4E4E7] shrink-0" aria-hidden="true" />

        <div className="relative md:w-52 shrink-0 flex items-center border-t border-[#E4E4E7] md:border-t-0 pt-2 md:pt-0">
          <MapPin
            aria-hidden="true"
            className="w-4 h-4 text-[#52525B] absolute left-3 pointer-events-none shrink-0"
          />
          <select
            aria-label="Filter by Sri Lanka District"
            value={selectedDistrictId}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-sm text-[#18181B] bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E] cursor-pointer"
          >
            <option value="">All 25 Districts</option>
            {catalog.provinces.map((prov) => {
              const provDistricts = catalog.districts.filter(
                (d) => d.provinceId === prov.id,
              );
              if (provDistricts.length === 0) return null;
              return (
                <optgroup key={prov.id} label={prov.name}>
                  {provDistricts.map((dist) => (
                    <option key={dist.id} value={dist.id}>
                      {dist.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        <button
          type="submit"
          className="px-7 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
        >
          Search
        </button>
      </form>

      {showSuggestions && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 mt-1.5 bg-white border border-[#E4E4E7] rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-[#E4E4E7]"
        >
          {suggestions.map((item, idx) => (
            <button
              key={`${item.type}-${item.label}-${idx}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setFocused(false);
                navigate(item.to);
              }}
              className="w-full text-left px-4 py-3 hover:bg-[#FAFAF9] flex items-center justify-between gap-4 transition-colors"
            >
              <span className="text-sm font-medium text-[#18181B] truncate">
                {item.label}
              </span>
              <span className="text-xs text-[#52525B] shrink-0">
                {item.sublabel}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
