import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  INITIAL_SERVICE_CATEGORIES,
  SRI_LANKA_COUNTRY,
  SRI_LANKA_DISTRICTS,
  SRI_LANKA_MAJOR_CITIES,
  SRI_LANKA_PROVINCES,
} from '../shared/sriLankaData.ts';
import { db, handleFirestoreError, OperationType } from './firebase.ts';

export interface SeedStatusSummary {
  provincesCount: number;
  districtsCount: number;
  citiesCount: number;
  categoriesCount: number;
}

export async function fetchSeedCounts(): Promise<SeedStatusSummary> {
  try {
    const [provSnap, distSnap, citySnap, catSnap] = await Promise.all([
      getCountFromServer(collection(db, 'locations_provinces')),
      getCountFromServer(collection(db, 'locations_districts')),
      getCountFromServer(collection(db, 'locations_cities')),
      getCountFromServer(collection(db, 'categories')),
    ]);
    return {
      provincesCount: provSnap.data().count,
      districtsCount: distSnap.data().count,
      citiesCount: citySnap.data().count,
      categoriesCount: catSnap.data().count,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'locations_provinces');
  }
}

export async function seedMissingCatalogRecords(
  actorUid: string,
  actorRole: 'admin' | 'super_admin',
): Promise<{ summary: SeedStatusSummary; addedCount: number }> {
  let existingCountries = new Set<string>();
  let existingProvinces = new Set<string>();
  let existingDistricts = new Set<string>();
  let existingCities = new Set<string>();
  let existingCategories = new Set<string>();

  try {
    const [cSnap, pSnap, dSnap, ciSnap, catSnap] = await Promise.all([
      getDocs(collection(db, 'countries')),
      getDocs(collection(db, 'locations_provinces')),
      getDocs(collection(db, 'locations_districts')),
      getDocs(collection(db, 'locations_cities')),
      getDocs(collection(db, 'categories')),
    ]);
    existingCountries = new Set(cSnap.docs.map((d) => d.id));
    existingProvinces = new Set(pSnap.docs.map((d) => d.id));
    existingDistricts = new Set(dSnap.docs.map((d) => d.id));
    existingCities = new Set(ciSnap.docs.map((d) => d.id));
    existingCategories = new Set(catSnap.docs.map((d) => d.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'categories');
  }

  const batch = writeBatch(db);
  let addedCount = 0;

  if (!existingCountries.has(SRI_LANKA_COUNTRY.id)) {
    batch.set(doc(db, 'countries', SRI_LANKA_COUNTRY.id), {
      code: SRI_LANKA_COUNTRY.code,
      name: SRI_LANKA_COUNTRY.name,
      currency: SRI_LANKA_COUNTRY.currency,
      isActive: SRI_LANKA_COUNTRY.isActive,
    });
    addedCount += 1;
  }

  for (const prov of SRI_LANKA_PROVINCES) {
    if (!existingProvinces.has(prov.id)) {
      batch.set(doc(db, 'locations_provinces', prov.id), {
        countryCode: prov.countryCode,
        name: prov.name,
        slug: prov.slug,
        order: prov.order,
      });
      addedCount += 1;
    }
  }

  for (const dist of SRI_LANKA_DISTRICTS) {
    if (!existingDistricts.has(dist.id)) {
      batch.set(doc(db, 'locations_districts', dist.id), {
        countryCode: dist.countryCode,
        provinceId: dist.provinceId,
        name: dist.name,
        slug: dist.slug,
      });
      addedCount += 1;
    }
  }

  for (const city of SRI_LANKA_MAJOR_CITIES) {
    if (!existingCities.has(city.id)) {
      batch.set(doc(db, 'locations_cities', city.id), {
        countryCode: city.countryCode,
        provinceId: city.provinceId,
        districtId: city.districtId,
        name: city.name,
        isActive: city.isActive,
      });
      addedCount += 1;
    }
  }

  for (const cat of INITIAL_SERVICE_CATEGORIES) {
    if (!existingCategories.has(cat.id)) {
      batch.set(doc(db, 'categories', cat.id), {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        iconName: cat.iconName,
        order: cat.order,
        isActive: cat.isActive,
      });
      addedCount += 1;
    }
  }

  if (addedCount > 0) {
    const logId = `seed_lk_${Date.now()}`;
    batch.set(doc(db, 'audit_logs', logId), {
      actorUid,
      actorRole,
      action: 'seed_missing_catalog',
      targetType: 'system_catalog',
      targetId: 'lk',
      summary: `Safely seeded ${addedCount} missing Sri Lanka location and category records without duplicates.`,
      createdAt: serverTimestamp(),
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'categories');
    }
  }

  return {
    summary: await fetchSeedCounts(),
    addedCount,
  };
}

export async function seedSriLankaLocationsAndCategories(
  actorUid: string,
  actorRole: 'admin' | 'super_admin',
): Promise<SeedStatusSummary> {
  const result = await seedMissingCatalogRecords(actorUid, actorRole);
  return result.summary;
}
