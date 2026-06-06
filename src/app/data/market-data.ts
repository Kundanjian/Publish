export type Category = {
  icon: string;
  label: string;
};

export type RentalListing = {
  id: string;
  title: string;
  propertyType: string;
  price: number;
  dailyPrice: number;
  unit: string;
  summary: string;
  location: string;
  image: string;
  images?: string[];
  rating: number;
  badge?: string;
  weeklyPrice?: number;
  status?: 'AVAILABLE' | 'BOOKED' | 'PENDING_APPROVAL';
  availableFrom?: string;
  amenities?: string[];
  rules?: string[];
  bookedRanges?: Array<{ from: string; to: string; bookingId: string }>;
  landlordContact?: {
    name: string;
    phone: string;
    email: string;
  };
  specifications?: string[];
  addOns?: Array<{ name: string; charge: number; image?: string }>;
  nearbyLandmark?: string;
  landmarkDistance?: string;
  foodAvailable?: boolean;
  foodOptions?: string[];
  entryRule?: string;
};

export type OrderItem = {
  title: string;
  status: 'Active' | 'Completed' | 'Upcoming';
  duration: string;
  amount: string;
};

export type AccessoryItem = {
  name: string;
  rent: string;
  summary: string;
  image: string;
};

const createArt = (topColor: string, bottomColor: string, label: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${topColor}" />
          <stop offset="100%" stop-color="${bottomColor}" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" rx="32" fill="url(#bg)" />
      <circle cx="522" cy="114" r="64" fill="rgba(255,255,255,0.35)" />
      <rect x="84" y="140" width="246" height="176" rx="26" fill="rgba(255,255,255,0.92)" />
      <rect x="110" y="166" width="194" height="18" rx="9" fill="rgba(15,23,42,0.16)" />
      <rect x="110" y="202" width="146" height="78" rx="18" fill="rgba(15,23,42,0.08)" />
      <rect x="358" y="168" width="170" height="126" rx="22" fill="rgba(255,255,255,0.78)" />
      <rect x="390" y="204" width="106" height="22" rx="11" fill="rgba(15,23,42,0.14)" />
      <rect x="386" y="246" width="92" height="28" rx="14" fill="rgba(15,23,42,0.1)" />
      <text x="84" y="394" fill="#0f172a" font-size="34" font-family="Segoe UI, Arial, sans-serif" font-weight="800">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const createCategoryArt = (
  label: string,
  backgroundTop: string,
  backgroundBottom: string,
  accent: string,
  svgBody: string
): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="panel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${backgroundTop}" />
          <stop offset="100%" stop-color="${backgroundBottom}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="26" fill="url(#panel)" />
      <circle cx="72" cy="24" r="9" fill="#ffffff" fill-opacity="0.35" />
      <g stroke="${accent}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
        ${svgBody}
      </g>
      <text x="48" y="82" text-anchor="middle" fill="${accent}" font-size="8.8" font-family="Segoe UI, Arial, sans-serif" font-weight="800">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const quickFilters: Category[] = [
  {
    icon: createCategoryArt(
      'Hostel',
      '#eef8ff',
      '#d7ecfb',
      '#0a6ea9',
      `
        <path d="M22 58V36h52v22" />
        <path d="M28 36v-8h40v8" />
        <path d="M34 58V46h12v12" />
        <path d="M50 58V46h12v12" />
        <path d="M24 62h48" />
      `
    ),
    label: 'Hostels'
  },
  {
    icon: createCategoryArt(
      'Flat',
      '#fff5e8',
      '#ffe4c4',
      '#d86a1b',
      `
        <path d="M28 62V30h40v32" />
        <path d="M38 40h6" />
        <path d="M52 40h6" />
        <path d="M38 50h6" />
        <path d="M52 50h6" />
        <path d="M44 62V54h8v8" />
        <path d="M24 62h48" />
      `
    ),
    label: 'Flats'
  },
  {
    icon: createCategoryArt(
      'Apt',
      '#eef7ff',
      '#dbeeff',
      '#0a7db8',
      `
        <path d="M30 62V26h14v36" />
        <path d="M44 62V34h20v28" />
        <path d="M35 34h4" />
        <path d="M35 42h4" />
        <path d="M35 50h4" />
        <path d="M51 42h5" />
        <path d="M51 50h5" />
        <path d="M24 62h48" />
      `
    ),
    label: 'Apartments'
  },
  {
    icon: createCategoryArt(
      'Studio',
      '#f2f8ff',
      '#e0efff',
      '#1d73a8',
      `
        <rect x="26" y="31" width="44" height="31" rx="6" />
        <path d="M34 40h28" />
        <path d="M34 48h17" />
        <path d="M58 48h4" />
        <path d="M32 26h32" />
      `
    ),
    label: 'Studio Apartments'
  },
  {
    icon: createCategoryArt(
      'Villa',
      '#fff3ea',
      '#ffe0cb',
      '#d96d27',
      `
        <path d="M24 44 48 25l24 19" />
        <path d="M30 42v20h36V42" />
        <path d="M44 62V49h8v13" />
        <path d="M36 46h6" />
        <path d="M54 46h6" />
        <path d="M24 62h48" />
      `
    ),
    label: 'Villas'
  }
];

const roomArt = createArt('#dbeafe', '#93c5fd', 'Room View');
const bunkArt = createArt('#fee2e2', '#f59e0b', 'Bunk Stay');
const kitchenArt = createArt('#ede9fe', '#8b5cf6', 'Kitchen');
const towerArt = createArt('#dcfce7', '#22c55e', 'Apartment');
const gardenArt = createArt('#fef3c7', '#f97316', 'Garden Home');
const mapArt = createArt('#cffafe', '#0891b2', 'Map Nearby');
const tripArt = createArt('#ffedd5', '#ea580c', 'Trip Plan');

export const durationOptions = ['Daily', 'Weekly', 'Monthly'];
export const locationSuggestions = ['Jabalpur', 'Jabalpur, Madhya Pradesh', 'Madhya Pradesh'];

export const rentalListings: RentalListing[] = [
  {
    id: 'ganga-jamna-boys-hostel',
    title: '1 BHK Hostel, fully furnished',
    propertyType: 'Hostel',
    price: 4500,
    dailyPrice: 250,
    unit: '/month',
    summary: 'Comfortable private stay with wardrobe, AC, attached washroom and landlord-approved stay terms.',
    location: 'Jabalpur, M.P.',
    image: roomArt,
    rating: 4
  },
  {
    id: 'family-flat-near-civil-lines',
    title: '2 BHK flat with study space',
    propertyType: 'Flat',
    price: 12000,
    dailyPrice: 950,
    unit: '/month',
    summary: 'Bright family flat with work desk, balcony access and natural light.',
    location: 'Civil Lines, Jabalpur',
    image: roomArt,
    rating: 4,
    badge: 'Popular'
  },
  {
    id: 'student-sharing-hostel',
    title: '2 bed sharing hostel room',
    propertyType: 'Hostel',
    price: 2500,
    dailyPrice: 180,
    unit: '/month',
    summary: 'Budget-friendly twin sharing option near coaching centers and public transit.',
    location: 'Napier Town, Jabalpur',
    image: roomArt,
    rating: 3
  },
  {
    id: 'studio-apartment-near-market',
    title: 'Studio apartment, fully furnished',
    propertyType: 'Apartment',
    price: 9500,
    dailyPrice: 700,
    unit: '/month',
    summary: 'Compact apartment with storage, kitchen setup and quick access to markets.',
    location: 'Wright Town, Jabalpur',
    image: bunkArt,
    rating: 4
  },
  {
    id: 'apartment-city-center',
    title: '1 BHK apartment near city center',
    propertyType: 'Apartment',
    price: 11000,
    dailyPrice: 850,
    unit: '/month',
    summary: 'Modern apartment for solo renters or couples who want a central location.',
    location: 'Sadar, Jabalpur',
    image: roomArt,
    rating: 4
  },
  {
    id: 'independent-flat-with-desk',
    title: 'Independent flat with wardrobe and desk',
    propertyType: 'Flat',
    price: 9800,
    dailyPrice: 780,
    unit: '/month',
    summary: 'Quiet street-facing flat ideal for interns, professionals and students.',
    location: 'Katanga, Jabalpur',
    image: roomArt,
    rating: 3
  },
  {
    id: 'gated-apartment-with-kitchen',
    title: 'Gated apartment with private kitchen',
    propertyType: 'Apartment',
    price: 13500,
    dailyPrice: 980,
    unit: '/month',
    summary: 'Private apartment with fitted kitchen in a secure gated property.',
    location: 'Adhartal, Jabalpur',
    image: kitchenArt,
    rating: 4
  },
  {
    id: 'villa-stay-long-term',
    title: 'Villa stay for long-term rent',
    propertyType: 'Villa',
    price: 24000,
    dailyPrice: 1800,
    unit: '/month',
    summary: 'Spacious villa option with parking, garden frontage and direct landlord terms.',
    location: 'Madan Mahal, Jabalpur',
    image: towerArt,
    rating: 4
  }
];

export const discoveryTiles = [
  { title: 'Garden-facing villa', image: gardenArt },
  { title: 'Nearby rental map', image: mapArt },
  { title: 'Room and facility photos', image: roomArt },
  { title: 'Accessories for your stay', image: tripArt }
];

export const accessoryItems: AccessoryItem[] = [
  {
    name: 'Single-door fridge',
    rent: 'Rs 900/month',
    summary: 'Energy-efficient fridge for hostel rooms, flats and apartments.',
    image: createArt('#d1fae5', '#14b8a6', 'Fridge')
  },
  {
    name: 'Washing machine',
    rent: 'Rs 1,400/month',
    summary: 'Compact semi-automatic machine suitable for tenant use.',
    image: createArt('#e0f2fe', '#0ea5e9', 'Washing')
  },
  {
    name: 'Sofa cum bed',
    rent: 'Rs 1,800/month',
    summary: 'Flexible sofa bed setup for studio apartments and guest rooms.',
    image: createArt('#fef3c7', '#f59e0b', 'Sofa Bed')
  },
  {
    name: 'Study table set',
    rent: 'Rs 600/month',
    summary: 'Essential desk and chair combo for students and remote workers.',
    image: createArt('#ede9fe', '#8b5cf6', 'Study Set')
  }
];

export const platformHighlights = [
  'Direct landlord-to-tenant accommodation discovery with no vehicle listings mixed in.',
  'Daily, weekly and monthly duration support for flexible stay planning.',
  'Deeper property pages covering landlord rules, facilities, allowed tenant profiles and feedback.'
];

export const landlordRules = [
  'Bachelors allowed after landlord approval',
  'No loud parties or overnight unregistered guests',
  'ID verification required before move-in',
  'Electricity and water terms shared clearly before booking'
];

export const facilityList = [
  'Attached washroom',
  'Wardrobe and storage',
  'Kitchen or pantry access',
  'Wi-Fi availability',
  'Parking or two-wheeler stand',
  'Cleaning support based on property'
];

export const feedbackNotes = [
  'Landlord is responsive and shares rules clearly before check-in.',
  'Good match for students and working professionals looking for flexible duration stays.',
  'Facilities matched the listing and the neighborhood felt safe.'
];

export const orderItems: OrderItem[] = [
  {
    title: 'Ganga Jamna Boys Hostel',
    status: 'Active',
    duration: '23 Mar 2026 - 23 Apr 2026',
    amount: 'Rs 4,500/month'
  },
  {
    title: 'Civil Lines Family Flat',
    status: 'Completed',
    duration: '10 Feb 2026 - 10 Mar 2026',
    amount: 'Rs 12,000/month'
  },
  {
    title: 'Villa stay in Madan Mahal',
    status: 'Upcoming',
    duration: '28 Mar 2026 - 28 Apr 2026',
    amount: 'Rs 24,000/month'
  }
];

export const helpTopics = [
  'How to book directly from a landlord on Unio',
  'What documents are needed for daily, weekly and monthly stays',
  'How to check what the landlord allows before confirming',
  'How to review facilities, feedback and cancellation terms'
];

export const settingGroups = [
  { label: 'Profile', value: 'Name, phone number and email' },
  { label: 'Notifications', value: 'Rental updates, OTP and reminders' },
  { label: 'Privacy', value: 'Saved addresses and account visibility' },
  { label: 'Security', value: 'Password and login preferences' }
];
