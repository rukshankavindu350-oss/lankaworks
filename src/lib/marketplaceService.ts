import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {
  INITIAL_SERVICE_CATEGORIES,
  SRI_LANKA_DISTRICTS,
  SRI_LANKA_MAJOR_CITIES,
  SRI_LANKA_PROVINCES,
  type CategorySeed,
  type CitySeed,
  type DistrictSeed,
  type ProvinceSeed,
} from '../shared/sriLankaData.ts';
import { db } from './firebase.ts';

export interface MarketplaceCategory extends CategorySeed {
  serviceCount: number;
}

export interface PublicWorkerSummary {
  uid: string;
  businessName: string;
  bio: string;
  photoUrl?: string;
  approvalStatus: 'approved';
  serviceCategoryIds: string[];
  provinceIds: string[];
  districtIds: string[];
  cityIds?: string[];
  workingHoursSummary?: string;
  ratingAvg: number;
  reviewCount: number;
}

export interface PublicServiceListing {
  id: string;
  workerId: string;
  workerBusinessName: string;
  workerVerified: boolean;
  workerPhotoUrl?: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  priceLkr: number;
  durationMinutes: number;
  imageUrl?: string;
  provinceIds: string[];
  districtIds: string[];
  cityIds: string[];
  locationLabel: string;
  isActive: boolean;
}

export interface MarketplaceCatalogSnapshot {
  categories: MarketplaceCategory[];
  categoriesSource: 'firestore' | 'reference_fallback';
  provinces: ProvinceSeed[];
  districts: DistrictSeed[];
  cities: CitySeed[];
  locationsSource: 'firestore' | 'reference_fallback';
  workers: PublicWorkerSummary[];
  services: PublicServiceListing[];
}

export function createInitialMarketplaceCatalog(): MarketplaceCatalogSnapshot {
  const categories = sanitizeActiveCategories([...INITIAL_SERVICE_CATEGORIES]).map(
    (cat) => ({
      ...cat,
      serviceCount: 0,
    }),
  );

  return {
    categories,
    categoriesSource: 'reference_fallback',
    provinces: [...SRI_LANKA_PROVINCES],
    districts: [...SRI_LANKA_DISTRICTS].sort((a, b) => a.name.localeCompare(b.name)),
    cities: [...SRI_LANKA_MAJOR_CITIES].sort((a, b) => a.name.localeCompare(b.name)),
    locationsSource: 'reference_fallback',
    workers: [],
    services: [],
  };
}

export interface SearchFilterCriteria {
  queryText?: string;
  categoryId?: string;
  provinceId?: string;
  districtId?: string;
  cityId?: string;
  maxPriceLkr?: number | null;
}

export interface SearchSuggestion {
  type: 'category' | 'location' | 'service' | 'provider';
  label: string;
  sublabel: string;
  categoryId?: string;
  districtId?: string;
  provinceId?: string;
  queryText?: string;
  to: string;
}

export function sanitizeActiveCategories(
  rawCategories: CategorySeed[],
): CategorySeed[] {
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();
  const cleaned: CategorySeed[] = [];

  const sorted = [...rawCategories].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  for (const cat of sorted) {
    const name = (cat.name || '').trim();
    const slug = (cat.slug || '').trim().toLowerCase();
    if (!cat.isActive || !name || !slug) {
      continue;
    }
    const nameKey = name.toLowerCase();
    if (seenSlugs.has(slug) || seenNames.has(nameKey)) {
      continue;
    }
    seenSlugs.add(slug);
    seenNames.add(nameKey);
    cleaned.push({
      ...cat,
      name,
      slug,
    });
  }

  return cleaned;
}

export function resolveLocationLabel(
  provinceIds: string[],
  districtIds: string[],
  cityIds: string[],
  provinces: ProvinceSeed[],
  districts: DistrictSeed[],
  cities: CitySeed[],
): string {
  const cityNames = cityIds
    .map((id) => cities.find((c) => c.id === id)?.name)
    .filter((v): v is string => Boolean(v));
  const districtNames = districtIds
    .map((id) => districts.find((d) => d.id === id)?.name)
    .filter((v): v is string => Boolean(v));
  const provinceNames = provinceIds
    .map((id) => provinces.find((p) => p.id === id)?.name)
    .filter((v): v is string => Boolean(v));

  if (cityNames.length > 0 && districtNames.length > 0) {
    return `${cityNames.slice(0, 2).join(', ')} · ${districtNames.slice(0, 2).join(', ')}`;
  }
  if (districtNames.length > 0) {
    return `${districtNames.slice(0, 3).join(', ')}${districtNames.length > 3 ? ` +${districtNames.length - 3}` : ''}`;
  }
  if (provinceNames.length > 0) {
    return provinceNames.slice(0, 2).join(', ');
  }
  return 'Sri Lanka';
}

export function filterMarketplaceListings(
  services: PublicServiceListing[],
  criteria: SearchFilterCriteria,
  provinces: ProvinceSeed[],
  districts: DistrictSeed[],
  cities: CitySeed[],
): PublicServiceListing[] {
  const q = (criteria.queryText || '').trim().toLowerCase();

  return services.filter((item) => {
    if (!item.isActive) return false;

    if (criteria.categoryId && item.categoryId !== criteria.categoryId) {
      return false;
    }

    if (criteria.provinceId && !item.provinceIds.includes(criteria.provinceId)) {
      return false;
    }

    if (criteria.districtId && !item.districtIds.includes(criteria.districtId)) {
      return false;
    }

    if (criteria.cityId && !item.cityIds.includes(criteria.cityId)) {
      return false;
    }

    if (
      typeof criteria.maxPriceLkr === 'number' &&
      criteria.maxPriceLkr > 0 &&
      item.priceLkr > criteria.maxPriceLkr
    ) {
      return false;
    }

    if (!q) return true;

    const locationText = [
      item.locationLabel,
      ...item.provinceIds.map((id) => provinces.find((p) => p.id === id)?.name || ''),
      ...item.districtIds.map((id) => districts.find((d) => d.id === id)?.name || ''),
      ...item.cityIds.map((id) => cities.find((c) => c.id === id)?.name || ''),
    ]
      .join(' ')
      .toLowerCase();

    const haystack = [
      item.title,
      item.description,
      item.categoryName,
      item.workerBusinessName,
      locationText,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function filterApprovedWorkers(
  workers: PublicWorkerSummary[],
  criteria: SearchFilterCriteria,
  categories: MarketplaceCategory[],
  provinces: ProvinceSeed[],
  districts: DistrictSeed[],
): PublicWorkerSummary[] {
  const q = (criteria.queryText || '').trim().toLowerCase();

  return workers.filter((w) => {
    if (w.approvalStatus !== 'approved') return false;
    if (criteria.categoryId && !w.serviceCategoryIds.includes(criteria.categoryId)) {
      return false;
    }
    if (criteria.provinceId && !w.provinceIds.includes(criteria.provinceId)) {
      return false;
    }
    if (criteria.districtId && !w.districtIds.includes(criteria.districtId)) {
      return false;
    }
    if (criteria.cityId && !(w.cityIds || []).includes(criteria.cityId)) {
      return false;
    }
    if (!q) return true;

    const catNames = w.serviceCategoryIds
      .map((id) => categories.find((c) => c.id === id)?.name || '')
      .join(' ');
    const locNames = [
      ...w.provinceIds.map((id) => provinces.find((p) => p.id === id)?.name || ''),
      ...w.districtIds.map((id) => districts.find((d) => d.id === id)?.name || ''),
    ].join(' ');

    const haystack = `${w.businessName} ${w.bio} ${catNames} ${locNames}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function buildSearchSuggestions(
  queryText: string,
  catalog: MarketplaceCatalogSnapshot,
): SearchSuggestion[] {
  const q = queryText.trim().toLowerCase();
  if (!q) return [];

  const categoryHits: SearchSuggestion[] = [];
  for (const cat of catalog.categories) {
    if (cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q)) {
      categoryHits.push({
        type: 'category',
        label: cat.name,
        sublabel: 'Service Category',
        categoryId: cat.id,
        to: `/services?category=${encodeURIComponent(cat.id)}`,
      });
    }
  }

  const locationHits: SearchSuggestion[] = [];
  for (const dist of catalog.districts) {
    if (dist.name.toLowerCase().includes(q)) {
      locationHits.push({
        type: 'location',
        label: `${dist.name} District`,
        sublabel:
          catalog.provinces.find((p) => p.id === dist.provinceId)?.name ||
          'Sri Lanka',
        districtId: dist.id,
        provinceId: dist.provinceId,
        to: `/services?province=${encodeURIComponent(dist.provinceId)}&district=${encodeURIComponent(dist.id)}`,
      });
    }
  }

  const serviceHits: SearchSuggestion[] = [];
  for (const svc of catalog.services) {
    if (
      svc.title.toLowerCase().includes(q) ||
      svc.categoryName.toLowerCase().includes(q) ||
      svc.workerBusinessName.toLowerCase().includes(q)
    ) {
      serviceHits.push({
        type: 'service',
        label: svc.title,
        sublabel: `${svc.workerBusinessName} · LKR ${svc.priceLkr.toLocaleString()}`,
        queryText: svc.title,
        to: `/services/${encodeURIComponent(svc.id)}`,
      });
    }
  }

  const providerHits: SearchSuggestion[] = [];
  for (const wrk of catalog.workers) {
    const districtNames = wrk.districtIds
      .map((id) => catalog.districts.find((d) => d.id === id)?.name || '')
      .filter(Boolean);
    const provinceNames = wrk.provinceIds
      .map((id) => catalog.provinces.find((p) => p.id === id)?.name || '')
      .filter(Boolean);
    const categoryNames = wrk.serviceCategoryIds
      .map((id) => catalog.categories.find((c) => c.id === id)?.name || '')
      .filter(Boolean);

    const haystack = [
      wrk.businessName,
      wrk.bio,
      ...districtNames,
      ...provinceNames,
      ...categoryNames,
    ]
      .join(' ')
      .toLowerCase();

    if (haystack.includes(q)) {
      providerHits.push({
        type: 'provider',
        label: wrk.businessName,
        sublabel: districtNames[0] ? `Verified Provider · ${districtNames[0]}` : 'Verified Provider',
        queryText: wrk.businessName,
        to: `/workers/${encodeURIComponent(wrk.uid)}`,
      });
    }
  }

  return [
    ...categoryHits.slice(0, 2),
    ...locationHits.slice(0, 2),
    ...serviceHits.slice(0, 2),
    ...providerHits.slice(0, 2),
  ].slice(0, 7);
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

export async function fetchMarketplaceCatalog(): Promise<MarketplaceCatalogSnapshot> {
  const queryBatch = Promise.allSettled([
    getDocs(
      query(
        collection(db, 'categories'),
        where('isActive', '==', true),
        limit(100),
      ),
    ),
    getDocs(
      query(
        collection(db, 'locations_provinces'),
        orderBy('order', 'asc'),
        limit(20),
      ),
    ),
    getDocs(query(collection(db, 'locations_districts'), limit(50))),
    getDocs(
      query(
        collection(db, 'locations_cities'),
        where('isActive', '==', true),
        limit(200),
      ),
    ),
    getDocs(
      query(
        collection(db, 'workers'),
        where('approvalStatus', '==', 'approved'),
        limit(100),
      ),
    ),
    getDocs(
      query(
        collection(db, 'services'),
        where('isActive', '==', true),
        limit(100),
      ),
    ),
  ]);

  const settled = await withTimeout(queryBatch, 6000, null);
  if (!settled) {
    return createInitialMarketplaceCatalog();
  }

  const [catResult, provResult, distResult, cityResult, workerResult, serviceResult] =
    settled;

  const firestoreCategories: CategorySeed[] =
    catResult.status === 'fulfilled'
      ? catResult.value.docs.map((d) => ({
          id: d.id,
          name: String(d.data().name || ''),
          slug: String(d.data().slug || ''),
          description: String(d.data().description || ''),
          iconName: String(d.data().iconName || 'Wrench'),
          order: Number(d.data().order || 999),
          isActive: Boolean(d.data().isActive),
        }))
      : [];

  const cleanedFirestoreCats = sanitizeActiveCategories(firestoreCategories);
  const categoriesSource: 'firestore' | 'reference_fallback' =
    cleanedFirestoreCats.length > 0 ? 'firestore' : 'reference_fallback';
  const baseCategories =
    cleanedFirestoreCats.length > 0
      ? cleanedFirestoreCats
      : sanitizeActiveCategories([...INITIAL_SERVICE_CATEGORIES]);

  const firestoreProvinces: ProvinceSeed[] =
    provResult.status === 'fulfilled'
      ? provResult.value.docs.map((d) => ({
          id: d.id,
          countryCode: String(d.data().countryCode || 'LK'),
          name: String(d.data().name || ''),
          slug: String(d.data().slug || ''),
          order: Number(d.data().order || 99),
        }))
      : [];

  const firestoreDistricts: DistrictSeed[] =
    distResult.status === 'fulfilled'
      ? distResult.value.docs
          .map((d) => ({
            id: d.id,
            countryCode: String(d.data().countryCode || 'LK'),
            provinceId: String(d.data().provinceId || ''),
            name: String(d.data().name || ''),
            slug: String(d.data().slug || ''),
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

  const firestoreCities: CitySeed[] =
    cityResult.status === 'fulfilled'
      ? cityResult.value.docs
          .map((d) => ({
            id: d.id,
            countryCode: String(d.data().countryCode || 'LK'),
            provinceId: String(d.data().provinceId || ''),
            districtId: String(d.data().districtId || ''),
            name: String(d.data().name || ''),
            isActive: Boolean(d.data().isActive),
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

  const hasLiveLocations =
    firestoreProvinces.length > 0 && firestoreDistricts.length > 0;
  const provinces = hasLiveLocations
    ? firestoreProvinces
    : [...SRI_LANKA_PROVINCES];
  const districts = hasLiveLocations
    ? firestoreDistricts
    : [...SRI_LANKA_DISTRICTS].sort((a, b) => a.name.localeCompare(b.name));
  const cities =
    firestoreCities.length > 0
      ? firestoreCities
      : [...SRI_LANKA_MAJOR_CITIES].sort((a, b) => a.name.localeCompare(b.name));

  const workers: PublicWorkerSummary[] =
    workerResult.status === 'fulfilled'
      ? workerResult.value.docs
          .map((d) => {
            const data = d.data();
            return {
              uid: String(data.uid || d.id),
              businessName: String(data.businessName || ''),
              bio: String(data.bio || ''),
              photoUrl: data.photoUrl ? String(data.photoUrl) : undefined,
              approvalStatus: 'approved' as const,
              serviceCategoryIds: Array.isArray(data.serviceCategoryIds)
                ? data.serviceCategoryIds.map(String)
                : [],
              provinceIds: Array.isArray(data.provinceIds)
                ? data.provinceIds.map(String)
                : [],
              districtIds: Array.isArray(data.districtIds)
                ? data.districtIds.map(String)
                : [],
              cityIds: Array.isArray(data.cityIds)
                ? data.cityIds.map(String)
                : [],
              workingHoursSummary: data.workingHoursSummary
                ? String(data.workingHoursSummary)
                : undefined,
              ratingAvg: Number(data.ratingAvg || 0),
              reviewCount: Number(data.reviewCount || 0),
            };
          })
          .filter((w) => w.businessName.length > 0)
      : [];

  const approvedWorkerMap = new Map(workers.map((w) => [w.uid, w]));
  const categoryMap = new Map(baseCategories.map((c) => [c.id, c]));

  const services: PublicServiceListing[] =
    serviceResult.status === 'fulfilled'
      ? serviceResult.value.docs
          .map((d) => {
            const data = d.data();
            const workerId = String(data.workerId || '');
            const approvedWorker = approvedWorkerMap.get(workerId);
            const categoryId = String(data.categoryId || '');
            const provinceIds = Array.isArray(data.provinceIds)
              ? data.provinceIds.map(String)
              : [];
            const districtIds = Array.isArray(data.districtIds)
              ? data.districtIds.map(String)
              : [];
            const cityIds = Array.isArray(data.cityIds)
              ? data.cityIds.map(String)
              : [];

            return {
              id: d.id,
              workerId,
              workerBusinessName:
                approvedWorker?.businessName ||
                String(data.workerBusinessName || ''),
              workerVerified: Boolean(approvedWorker),
              workerPhotoUrl: approvedWorker?.photoUrl,
              categoryId,
              categoryName: categoryMap.get(categoryId)?.name || 'Local Service',
              title: String(data.title || ''),
              description: String(data.description || ''),
              priceLkr: Number(data.priceLkr || 0),
              durationMinutes: Number(data.durationMinutes || 60),
              imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
              provinceIds,
              districtIds,
              cityIds,
              locationLabel: resolveLocationLabel(
                provinceIds,
                districtIds,
                cityIds,
                provinces,
                districts,
                cities,
              ),
              isActive: Boolean(data.isActive),
            };
          })
          .filter((s) => s.title.length > 0 && s.workerVerified)
      : [];

  const countByCat = new Map<string, number>();
  for (const svc of services) {
    countByCat.set(svc.categoryId, (countByCat.get(svc.categoryId) || 0) + 1);
  }

  const categories: MarketplaceCategory[] = baseCategories.map((cat) => ({
    ...cat,
    serviceCount: countByCat.get(cat.id) || 0,
  }));

  return {
    categories,
    categoriesSource,
    provinces,
    districts,
    cities,
    locationsSource: hasLiveLocations ? 'firestore' : 'reference_fallback',
    workers,
    services,
  };
}

export async function fetchApprovedWorkerDetail(
  workerId: string,
): Promise<{ worker: PublicWorkerSummary | null; services: PublicServiceListing[] }> {
  const workerSnap = await getDoc(doc(db, 'workers', workerId));
  if (!workerSnap.exists()) {
    return { worker: null, services: [] };
  }
  const data = workerSnap.data();
  if (data.approvalStatus !== 'approved') {
    return { worker: null, services: [] };
  }
  const catalog = await fetchMarketplaceCatalog();
  const worker =
    catalog.workers.find((w) => w.uid === workerId) || null;
  const services = catalog.services.filter((s) => s.workerId === workerId);
  return { worker, services };
}

export async function fetchPublicServiceDetail(
  serviceId: string,
): Promise<{ service: PublicServiceListing | null; worker: PublicWorkerSummary | null }> {
  const svcSnap = await getDoc(doc(db, 'services', serviceId));
  if (!svcSnap.exists()) {
    return { service: null, worker: null };
  }
  const catalog = await fetchMarketplaceCatalog();
  const service = catalog.services.find((s) => s.id === serviceId) || null;
  const worker = service
    ? catalog.workers.find((w) => w.uid === service.workerId) || null
    : null;
  return { service, worker };
}
