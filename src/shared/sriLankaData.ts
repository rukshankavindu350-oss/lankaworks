export interface CountrySeed {
  id: string;
  code: string;
  name: string;
  currency: string;
  isActive: boolean;
}

export interface ProvinceSeed {
  id: string;
  countryCode: string;
  name: string;
  slug: string;
  order: number;
}

export interface DistrictSeed {
  id: string;
  countryCode: string;
  provinceId: string;
  name: string;
  slug: string;
}

export interface CitySeed {
  id: string;
  countryCode: string;
  provinceId: string;
  districtId: string;
  name: string;
  isActive: boolean;
}

export interface CategorySeed {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  order: number;
  isActive: boolean;
}

export const SRI_LANKA_COUNTRY: CountrySeed = {
  id: 'lk',
  code: 'LK',
  name: 'Sri Lanka',
  currency: 'LKR',
  isActive: true,
};

export const SRI_LANKA_PROVINCES: readonly ProvinceSeed[] = [
  { id: 'prov-western', countryCode: 'LK', name: 'Western Province', slug: 'western', order: 1 },
  { id: 'prov-central', countryCode: 'LK', name: 'Central Province', slug: 'central', order: 2 },
  { id: 'prov-southern', countryCode: 'LK', name: 'Southern Province', slug: 'southern', order: 3 },
  { id: 'prov-north-western', countryCode: 'LK', name: 'North Western Province', slug: 'north-western', order: 4 },
  { id: 'prov-sabaragamuwa', countryCode: 'LK', name: 'Sabaragamuwa Province', slug: 'sabaragamuwa', order: 5 },
  { id: 'prov-uva', countryCode: 'LK', name: 'Uva Province', slug: 'uva', order: 6 },
  { id: 'prov-north-central', countryCode: 'LK', name: 'North Central Province', slug: 'north-central', order: 7 },
  { id: 'prov-eastern', countryCode: 'LK', name: 'Eastern Province', slug: 'eastern', order: 8 },
  { id: 'prov-northern', countryCode: 'LK', name: 'Northern Province', slug: 'northern', order: 9 },
];

export const SRI_LANKA_DISTRICTS: readonly DistrictSeed[] = [
  // Western (3)
  { id: 'dist-colombo', countryCode: 'LK', provinceId: 'prov-western', name: 'Colombo', slug: 'colombo' },
  { id: 'dist-gampaha', countryCode: 'LK', provinceId: 'prov-western', name: 'Gampaha', slug: 'gampaha' },
  { id: 'dist-kalutara', countryCode: 'LK', provinceId: 'prov-western', name: 'Kalutara', slug: 'kalutara' },
  // Central (3)
  { id: 'dist-kandy', countryCode: 'LK', provinceId: 'prov-central', name: 'Kandy', slug: 'kandy' },
  { id: 'dist-matale', countryCode: 'LK', provinceId: 'prov-central', name: 'Matale', slug: 'matale' },
  { id: 'dist-nuwara-eliya', countryCode: 'LK', provinceId: 'prov-central', name: 'Nuwara Eliya', slug: 'nuwara-eliya' },
  // Southern (3)
  { id: 'dist-galle', countryCode: 'LK', provinceId: 'prov-southern', name: 'Galle', slug: 'galle' },
  { id: 'dist-matara', countryCode: 'LK', provinceId: 'prov-southern', name: 'Matara', slug: 'matara' },
  { id: 'dist-hambantota', countryCode: 'LK', provinceId: 'prov-southern', name: 'Hambantota', slug: 'hambantota' },
  // Northern (5)
  { id: 'dist-jaffna', countryCode: 'LK', provinceId: 'prov-northern', name: 'Jaffna', slug: 'jaffna' },
  { id: 'dist-kilinochchi', countryCode: 'LK', provinceId: 'prov-northern', name: 'Kilinochchi', slug: 'kilinochchi' },
  { id: 'dist-mannar', countryCode: 'LK', provinceId: 'prov-northern', name: 'Mannar', slug: 'mannar' },
  { id: 'dist-mullaitivu', countryCode: 'LK', provinceId: 'prov-northern', name: 'Mullaitivu', slug: 'mullaitivu' },
  { id: 'dist-vavuniya', countryCode: 'LK', provinceId: 'prov-northern', name: 'Vavuniya', slug: 'vavuniya' },
  // Eastern (3)
  { id: 'dist-ampara', countryCode: 'LK', provinceId: 'prov-eastern', name: 'Ampara', slug: 'ampara' },
  { id: 'dist-batticaloa', countryCode: 'LK', provinceId: 'prov-eastern', name: 'Batticaloa', slug: 'batticaloa' },
  { id: 'dist-trincomalee', countryCode: 'LK', provinceId: 'prov-eastern', name: 'Trincomalee', slug: 'trincomalee' },
  // North Western (2)
  { id: 'dist-kurunegala', countryCode: 'LK', provinceId: 'prov-north-western', name: 'Kurunegala', slug: 'kurunegala' },
  { id: 'dist-puttalam', countryCode: 'LK', provinceId: 'prov-north-western', name: 'Puttalam', slug: 'puttalam' },
  // North Central (2)
  { id: 'dist-anuradhapura', countryCode: 'LK', provinceId: 'prov-north-central', name: 'Anuradhapura', slug: 'anuradhapura' },
  { id: 'dist-polonnaruwa', countryCode: 'LK', provinceId: 'prov-north-central', name: 'Polonnaruwa', slug: 'polonnaruwa' },
  // Uva (2)
  { id: 'dist-badulla', countryCode: 'LK', provinceId: 'prov-uva', name: 'Badulla', slug: 'badulla' },
  { id: 'dist-monaragala', countryCode: 'LK', provinceId: 'prov-uva', name: 'Monaragala', slug: 'monaragala' },
  // Sabaragamuwa (2)
  { id: 'dist-ratnapura', countryCode: 'LK', provinceId: 'prov-sabaragamuwa', name: 'Ratnapura', slug: 'ratnapura' },
  { id: 'dist-kegalle', countryCode: 'LK', provinceId: 'prov-sabaragamuwa', name: 'Kegalle', slug: 'kegalle' },
];

export const SRI_LANKA_MAJOR_CITIES: readonly CitySeed[] = [
  { id: 'city-colombo-central', countryCode: 'LK', provinceId: 'prov-western', districtId: 'dist-colombo', name: 'Colombo', isActive: true },
  { id: 'city-dehiwala', countryCode: 'LK', provinceId: 'prov-western', districtId: 'dist-colombo', name: 'Dehiwala-Mount Lavinia', isActive: true },
  { id: 'city-nugegoda', countryCode: 'LK', provinceId: 'prov-western', districtId: 'dist-colombo', name: 'Nugegoda', isActive: true },
  { id: 'city-maharagama', countryCode: 'LK', provinceId: 'prov-western', districtId: 'dist-colombo', name: 'Maharagama', isActive: true },
  { id: 'city-negombo', countryCode: 'LK', provinceId: 'prov-western', districtId: 'dist-gampaha', name: 'Negombo', isActive: true },
  { id: 'city-gampaha-town', countryCode: 'LK', provinceId: 'prov-western', districtId: 'dist-gampaha', name: 'Gampaha', isActive: true },
  { id: 'city-kelaniya', countryCode: 'LK', provinceId: 'prov-western', districtId: 'dist-gampaha', name: 'Kelaniya', isActive: true },
  { id: 'city-kalutara-town', countryCode: 'LK', provinceId: 'prov-western', districtId: 'dist-kalutara', name: 'Kalutara', isActive: true },
  { id: 'city-panadura', countryCode: 'LK', provinceId: 'prov-western', districtId: 'dist-kalutara', name: 'Panadura', isActive: true },
  { id: 'city-kandy-city', countryCode: 'LK', provinceId: 'prov-central', districtId: 'dist-kandy', name: 'Kandy', isActive: true },
  { id: 'city-peradeniya', countryCode: 'LK', provinceId: 'prov-central', districtId: 'dist-kandy', name: 'Peradeniya', isActive: true },
  { id: 'city-matale-town', countryCode: 'LK', provinceId: 'prov-central', districtId: 'dist-matale', name: 'Matale', isActive: true },
  { id: 'city-nuwara-eliya-town', countryCode: 'LK', provinceId: 'prov-central', districtId: 'dist-nuwara-eliya', name: 'Nuwara Eliya', isActive: true },
  { id: 'city-galle-city', countryCode: 'LK', provinceId: 'prov-southern', districtId: 'dist-galle', name: 'Galle', isActive: true },
  { id: 'city-matara-town', countryCode: 'LK', provinceId: 'prov-southern', districtId: 'dist-matara', name: 'Matara', isActive: true },
  { id: 'city-hambantota-town', countryCode: 'LK', provinceId: 'prov-southern', districtId: 'dist-hambantota', name: 'Hambantota', isActive: true },
  { id: 'city-jaffna-city', countryCode: 'LK', provinceId: 'prov-northern', districtId: 'dist-jaffna', name: 'Jaffna', isActive: true },
  { id: 'city-vavuniya-town', countryCode: 'LK', provinceId: 'prov-northern', districtId: 'dist-vavuniya', name: 'Vavuniya', isActive: true },
  { id: 'city-kilinochchi-town', countryCode: 'LK', provinceId: 'prov-northern', districtId: 'dist-kilinochchi', name: 'Kilinochchi', isActive: true },
  { id: 'city-mannar-town', countryCode: 'LK', provinceId: 'prov-northern', districtId: 'dist-mannar', name: 'Mannar', isActive: true },
  { id: 'city-mullaitivu-town', countryCode: 'LK', provinceId: 'prov-northern', districtId: 'dist-mullaitivu', name: 'Mullaitivu', isActive: true },
  { id: 'city-batticaloa-city', countryCode: 'LK', provinceId: 'prov-eastern', districtId: 'dist-batticaloa', name: 'Batticaloa', isActive: true },
  { id: 'city-trincomalee-town', countryCode: 'LK', provinceId: 'prov-eastern', districtId: 'dist-trincomalee', name: 'Trincomalee', isActive: true },
  { id: 'city-ampara-town', countryCode: 'LK', provinceId: 'prov-eastern', districtId: 'dist-ampara', name: 'Ampara', isActive: true },
  { id: 'city-kurunegala-city', countryCode: 'LK', provinceId: 'prov-north-western', districtId: 'dist-kurunegala', name: 'Kurunegala', isActive: true },
  { id: 'city-puttalam-town', countryCode: 'LK', provinceId: 'prov-north-western', districtId: 'dist-puttalam', name: 'Puttalam', isActive: true },
  { id: 'city-anuradhapura-city', countryCode: 'LK', provinceId: 'prov-north-central', districtId: 'dist-anuradhapura', name: 'Anuradhapura', isActive: true },
  { id: 'city-polonnaruwa-town', countryCode: 'LK', provinceId: 'prov-north-central', districtId: 'dist-polonnaruwa', name: 'Polonnaruwa', isActive: true },
  { id: 'city-badulla-town', countryCode: 'LK', provinceId: 'prov-uva', districtId: 'dist-badulla', name: 'Badulla', isActive: true },
  { id: 'city-monaragala-town', countryCode: 'LK', provinceId: 'prov-uva', districtId: 'dist-monaragala', name: 'Monaragala', isActive: true },
  { id: 'city-ratnapura-city', countryCode: 'LK', provinceId: 'prov-sabaragamuwa', districtId: 'dist-ratnapura', name: 'Ratnapura', isActive: true },
  { id: 'city-kegalle-town', countryCode: 'LK', provinceId: 'prov-sabaragamuwa', districtId: 'dist-kegalle', name: 'Kegalle', isActive: true },
];

export const INITIAL_SERVICE_CATEGORIES: readonly CategorySeed[] = [
  {
    id: 'cat-plumbing',
    name: 'Plumbing & Water Systems',
    slug: 'plumbing-water-systems',
    description: 'Pipe repairs, bathroom fittings, water tank installation, and leak detection.',
    iconName: 'Wrench',
    order: 1,
    isActive: true,
  },
  {
    id: 'cat-electrical',
    name: 'Electrical & Wiring',
    slug: 'electrical-wiring',
    description: 'Home wiring, breaker panels, solar inverter checks, and lighting installations.',
    iconName: 'Zap',
    order: 2,
    isActive: true,
  },
  {
    id: 'cat-ac-appliance',
    name: 'AC & Appliance Repair',
    slug: 'ac-appliance-repair',
    description: 'Air conditioner servicing, refrigerator repair, and washing machine maintenance.',
    iconName: 'Wind',
    order: 3,
    isActive: true,
  },
  {
    id: 'cat-cleaning',
    name: 'Home & Office Cleaning',
    slug: 'home-office-cleaning',
    description: 'Deep house cleaning, post-construction cleanup, and commercial sanitation.',
    iconName: 'Sparkles',
    order: 4,
    isActive: true,
  },
  {
    id: 'cat-carpentry',
    name: 'Carpentry & Woodwork',
    slug: 'carpentry-woodwork',
    description: 'Custom cabinetry, door and lock repairs, roof timber work, and furniture restoration.',
    iconName: 'Hammer',
    order: 5,
    isActive: true,
  },
  {
    id: 'cat-painting-masonry',
    name: 'Painting & Masonry',
    slug: 'painting-masonry',
    description: 'Interior and exterior painting, waterproofing, tiling, and structural repairs.',
    iconName: 'Paintbrush',
    order: 6,
    isActive: true,
  },
  {
    id: 'cat-gardening',
    name: 'Gardening & Landscaping',
    slug: 'gardening-landscaping',
    description: 'Lawn care, tree trimming, garden design, and outdoor maintenance.',
    iconName: 'Trees',
    order: 7,
    isActive: true,
  },
  {
    id: 'cat-it-tech',
    name: 'IT & Computer Support',
    slug: 'it-computer-support',
    description: 'Laptop repair, home Wi-Fi setup, CCTV installation, and office networking.',
    iconName: 'Laptop',
    order: 8,
    isActive: true,
  },
  {
    id: 'cat-tutoring',
    name: 'Tutoring & Lessons',
    slug: 'tutoring-lessons',
    description: 'School subject coaching, language lessons, and exam preparation.',
    iconName: 'BookOpen',
    order: 9,
    isActive: true,
  },
  {
    id: 'cat-moving',
    name: 'Moving & Transport',
    slug: 'moving-transport',
    description: 'Local house shifting, packing assistance, and furniture delivery.',
    iconName: 'Truck',
    order: 10,
    isActive: true,
  },
];
