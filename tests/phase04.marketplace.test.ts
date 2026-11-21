import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  buildSearchSuggestions,
  createInitialMarketplaceCatalog,
  filterApprovedWorkers,
  filterMarketplaceListings,
  resolveLocationLabel,
  sanitizeActiveCategories,
  type MarketplaceCatalogSnapshot,
  type PublicServiceListing,
  type PublicWorkerSummary,
} from '../src/lib/marketplaceService.ts';
import {
  INITIAL_SERVICE_CATEGORIES,
  SRI_LANKA_DISTRICTS,
  SRI_LANKA_MAJOR_CITIES,
  SRI_LANKA_PROVINCES,
} from '../src/shared/sriLankaData.ts';

const SAMPLE_WORKERS: PublicWorkerSummary[] = [
  {
    uid: 'wrk_colombo_1',
    businessName: 'Lanka Spark Electricals',
    bio: 'Residential wiring and panel upgrades across Colombo.',
    approvalStatus: 'approved',
    serviceCategoryIds: ['cat-electrical'],
    provinceIds: ['prov-western'],
    districtIds: ['dist-colombo'],
    cityIds: ['city-nugegoda'],
    ratingAvg: 0,
    reviewCount: 0,
  },
  {
    uid: 'wrk_kandy_1',
    businessName: 'Hill Country Plumbing',
    bio: 'Leak repairs and water tank setups in Kandy.',
    approvalStatus: 'approved',
    serviceCategoryIds: ['cat-plumbing'],
    provinceIds: ['prov-central'],
    districtIds: ['dist-kandy'],
    cityIds: ['city-kandy-city'],
    ratingAvg: 0,
    reviewCount: 0,
  },
];

const SAMPLE_SERVICES: PublicServiceListing[] = [
  {
    id: 'svc_1',
    workerId: 'wrk_colombo_1',
    workerBusinessName: 'Lanka Spark Electricals',
    workerVerified: true,
    categoryId: 'cat-electrical',
    categoryName: 'Electrical & Wiring',
    title: 'Breaker Panel Inspection',
    description: 'Full home trip switch testing and fault diagnostics.',
    priceLkr: 3500,
    durationMinutes: 60,
    provinceIds: ['prov-western'],
    districtIds: ['dist-colombo'],
    cityIds: ['city-nugegoda'],
    locationLabel: 'Nugegoda · Colombo',
    isActive: true,
  },
  {
    id: 'svc_2',
    workerId: 'wrk_kandy_1',
    workerBusinessName: 'Hill Country Plumbing',
    workerVerified: true,
    categoryId: 'cat-plumbing',
    categoryName: 'Plumbing & Water Systems',
    title: 'Overhead Tank Installation',
    description: 'Clean pipe fitting and pressure valve setup.',
    priceLkr: 6500,
    durationMinutes: 120,
    provinceIds: ['prov-central'],
    districtIds: ['dist-kandy'],
    cityIds: ['city-kandy-city'],
    locationLabel: 'Kandy · Kandy',
    isActive: true,
  },
];

const SAMPLE_CATALOG: MarketplaceCatalogSnapshot = {
  categories: INITIAL_SERVICE_CATEGORIES.map((c) => ({ ...c, serviceCount: 0 })),
  categoriesSource: 'reference_fallback',
  provinces: [...SRI_LANKA_PROVINCES],
  districts: [...SRI_LANKA_DISTRICTS],
  cities: [...SRI_LANKA_MAJOR_CITIES],
  locationsSource: 'reference_fallback',
  workers: SAMPLE_WORKERS,
  services: SAMPLE_SERVICES,
};

test('sanitizeActiveCategories removes inactive, empty, and duplicate categories', () => {
  const cleaned = sanitizeActiveCategories([
    {
      id: 'c1',
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Pipe repair',
      iconName: 'Wrench',
      order: 2,
      isActive: true,
    },
    {
      id: 'c1-dup',
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Duplicate slug',
      iconName: 'Wrench',
      order: 3,
      isActive: true,
    },
    {
      id: 'c2-inactive',
      name: 'Inactive Category',
      slug: 'inactive',
      description: 'Hidden',
      iconName: 'Wrench',
      order: 1,
      isActive: false,
    },
    {
      id: 'c3-empty',
      name: '   ',
      slug: 'empty',
      description: 'Blank name',
      iconName: 'Wrench',
      order: 4,
      isActive: true,
    },
  ]);

  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].id, 'c1');
});

test('Case-insensitive keyword search matches service title, category, and provider name', () => {
  const byTitle = filterMarketplaceListings(
    SAMPLE_SERVICES,
    { queryText: 'BREAKER' },
    SAMPLE_CATALOG.provinces,
    SAMPLE_CATALOG.districts,
    SAMPLE_CATALOG.cities,
  );
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].id, 'svc_1');

  const byProvider = filterMarketplaceListings(
    SAMPLE_SERVICES,
    { queryText: 'hill country' },
    SAMPLE_CATALOG.provinces,
    SAMPLE_CATALOG.districts,
    SAMPLE_CATALOG.cities,
  );
  assert.equal(byProvider.length, 1);
  assert.equal(byProvider[0].id, 'svc_2');
});

test('Location and category filters isolate Sri Lanka provinces, districts, and cities', () => {
  const kandyOnly = filterMarketplaceListings(
    SAMPLE_SERVICES,
    { provinceId: 'prov-central', districtId: 'dist-kandy' },
    SAMPLE_CATALOG.provinces,
    SAMPLE_CATALOG.districts,
    SAMPLE_CATALOG.cities,
  );
  assert.equal(kandyOnly.length, 1);
  assert.equal(kandyOnly[0].id, 'svc_2');

  const emptyMismatch = filterMarketplaceListings(
    SAMPLE_SERVICES,
    { categoryId: 'cat-electrical', districtId: 'dist-kandy' },
    SAMPLE_CATALOG.provinces,
    SAMPLE_CATALOG.districts,
    SAMPLE_CATALOG.cities,
  );
  assert.equal(emptyMismatch.length, 0);

  const workersInColombo = filterApprovedWorkers(
    SAMPLE_WORKERS,
    { districtId: 'dist-colombo' },
    SAMPLE_CATALOG.categories,
    SAMPLE_CATALOG.provinces,
    SAMPLE_CATALOG.districts,
  );
  assert.equal(workersInColombo.length, 1);
  assert.equal(workersInColombo[0].uid, 'wrk_colombo_1');
});

test('Search suggestions include matching categories, districts, services, and providers', () => {
  const suggestions = buildSearchSuggestions('kandy', SAMPLE_CATALOG);
  assert.ok(suggestions.some((s) => s.type === 'location' && s.label.includes('Kandy')));
  assert.ok(suggestions.some((s) => s.type === 'provider' && s.label.includes('Hill Country')));

  assert.equal(buildSearchSuggestions('   ', SAMPLE_CATALOG).length, 0);
});

test('resolveLocationLabel formats Sri Lanka district and city names cleanly', () => {
  const label = resolveLocationLabel(
    ['prov-western'],
    ['dist-colombo'],
    ['city-nugegoda'],
    SAMPLE_CATALOG.provinces,
    SAMPLE_CATALOG.districts,
    SAMPLE_CATALOG.cities,
  );
  assert.equal(label, 'Nugegoda · Colombo');
});

test('Updated firestore.rules protects services activation and blocks public support_tickets reads', () => {
  const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
  assert.match(rules, /match \/services\/\{serviceId\}/);
  assert.match(rules, /approvalStatus == 'approved'/);
  assert.match(rules, /match \/support_tickets\/\{ticketId\}/);
  assert.match(rules, /incoming\(\)\.status == 'open'/);
});

test('createInitialMarketplaceCatalog initializes valid categories and Sri Lanka locations without fake providers', () => {
  const initial = createInitialMarketplaceCatalog();
  assert.equal(initial.categories.length, 10);
  assert.equal(initial.provinces.length, 9);
  assert.equal(initial.districts.length, 25);
  assert.equal(initial.services.length, 0);
  assert.equal(initial.workers.length, 0);
  assert.ok(initial.categories.every((c) => c.isActive && c.serviceCount === 0));
});

test('HomePage and SearchBar render clean UI copy, categories links, and complete placeholder text', () => {
  const home = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/HomePage.tsx'), 'utf8');
  const searchBar = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/marketplace/SearchBar.tsx'),
    'utf8',
  );

  assert.doesNotMatch(home, /Implement Homme Search/i);
  assert.doesNotMatch(home, /Live Database Connected/i);
  assert.match(home, /Explore Services by Category/);
  assert.match(home, /\/services\?category=\$\{encodeURIComponent\(cat\.id\)\}/);
  assert.match(searchBar, /placeholder="Search services, trades, or providers"/);
});
