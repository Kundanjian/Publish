export type PropertyStatus = 'AVAILABLE' | 'BOOKED' | 'PENDING_APPROVAL';
export type BookingStatus = 'CONFIRMED' | 'PENDING_PAYMENT' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED';

export type MarketplaceProperty = {
  id: number;
  title: string;
  location: string;
  price: number;
  dailyPrice: number;
  weeklyPrice: number;
  propertyType: string;
  summary: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  status: PropertyStatus;
  availableFrom: string;
  amenities: string[];
  rules: string[];
  bookedRanges: Array<{ from: string; to: string; bookingId: string }>;
  images?: string[];
  specifications?: string[];
  addOns?: Array<{ name: string; charge: number; image?: string }>;
  nearbyLandmark?: string;
  landmarkDistance?: string;
  foodAvailable?: boolean;
  foodOptions?: string[];
  entryRule?: string;
};

export type Booking = {
  id: string;
  propertyId: number;
  propertyTitle: string;
  tenantName: string;
  tenantEmail: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  amount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  invoiceNo: string;
  landlordContact: {
    name: string;
    phone: string;
    email: string;
  };
  createdAt: string;
};

export const marketplaceProperties: MarketplaceProperty[] = [
  {
    id: 1,
    title: 'Blue Haven Hostel',
    location: 'Jabalpur',
    price: 7800,
    dailyPrice: 450,
    weeklyPrice: 2400,
    propertyType: 'Hostel',
    summary: 'Verified hostel stay with daily, weekly and monthly booking options.',
    ownerName: 'Amit Sharma',
    ownerPhone: '+91 98765 41001',
    ownerEmail: 'amit.landlord@unio.test',
    status: 'AVAILABLE',
    availableFrom: '2026-05-15',
    amenities: ['Attached washroom', 'Wi-Fi', 'Wardrobe', 'Two-wheeler parking'],
    rules: ['ID verification required', 'No loud parties', 'Visitors allowed until 8 PM'],
    bookedRanges: []
  },
  {
    id: 2,
    title: 'City View Apartment',
    location: 'Napier Town, Jabalpur',
    price: 14500,
    dailyPrice: 1050,
    weeklyPrice: 6200,
    propertyType: 'Apartment',
    summary: 'Central apartment for professionals, couples and flexible city stays.',
    ownerName: 'Neha Verma',
    ownerPhone: '+91 98765 41002',
    ownerEmail: 'neha.host@unio.test',
    status: 'AVAILABLE',
    availableFrom: '2026-05-14',
    amenities: ['Private kitchen', 'Balcony', 'Power backup', 'Lift access'],
    rules: ['Family and professionals preferred', 'Pets require approval'],
    bookedRanges: []
  },
  {
    id: 3,
    title: 'Lakefront Villa Stay',
    location: 'Bhedaghat, Jabalpur',
    price: 22500,
    dailyPrice: 2200,
    weeklyPrice: 13200,
    propertyType: 'Villa',
    summary: 'Spacious villa stay with garden access and short-term check-in.',
    ownerName: 'Raghav Soni',
    ownerPhone: '+91 98765 41003',
    ownerEmail: 'raghav.villa@unio.test',
    status: 'AVAILABLE',
    availableFrom: '2026-05-18',
    amenities: ['Garden', 'Parking', 'Kitchen', 'Caretaker support'],
    rules: ['No events without approval', 'Security ID required at check-in'],
    bookedRanges: []
  },
  {
    id: 4,
    title: 'Budget Student Flat',
    location: 'Gorakhpur, Jabalpur',
    price: 6900,
    dailyPrice: 420,
    weeklyPrice: 2300,
    propertyType: 'Flat',
    summary: 'Affordable student-friendly stay near coaching and transit.',
    ownerName: 'Sanjay Jain',
    ownerPhone: '+91 98765 41004',
    ownerEmail: 'sanjay.flat@unio.test',
    status: 'AVAILABLE',
    availableFrom: '2026-05-14',
    amenities: ['Study table', 'Shared kitchen', 'RO water', 'Laundry area'],
    rules: ['Students allowed', 'Quiet hours after 10 PM'],
    bookedRanges: []
  },
  {
    id: 5,
    title: 'Metro Comfort PG',
    location: 'Wright Town, Jabalpur',
    price: 8300,
    dailyPrice: 500,
    weeklyPrice: 2850,
    propertyType: 'Hostel',
    summary: 'Managed PG with food option and quick move-in support.',
    ownerName: 'Priya Mehta',
    ownerPhone: '+91 98765 41005',
    ownerEmail: 'priya.pg@unio.test',
    status: 'AVAILABLE',
    availableFrom: '2026-05-16',
    amenities: ['Meals optional', 'Wi-Fi', 'Cleaning', 'CCTV common areas'],
    rules: ['Tenant KYC before check-in', 'No overnight unregistered guests'],
    bookedRanges: []
  }
];

export const bookings: Booking[] = [
  {
    id: 'BK-1001',
    propertyId: 1,
    propertyTitle: 'Blue Haven Hostel',
    tenantName: 'Demo Tenant',
    tenantEmail: 'tenant@unio.test',
    startDate: '2026-05-20',
    endDate: '2026-06-20',
    durationDays: 31,
    amount: 7800,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    invoiceNo: 'INV-2026-1001',
    landlordContact: {
      name: 'Amit Sharma',
      phone: '+91 98765 41001',
      email: 'amit.landlord@unio.test'
    },
    createdAt: new Date().toISOString()
  }
];

export const hasDateConflict = (
  ranges: MarketplaceProperty['bookedRanges'],
  startDate: string,
  endDate: string
): boolean => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return ranges.some((range) => {
    const bookedStart = new Date(range.from).getTime();
    const bookedEnd = new Date(range.to).getTime();
    return start <= bookedEnd && end >= bookedStart;
  });
};

export const calculateRentalAmount = (
  property: MarketplaceProperty,
  durationDays: number
): number => {
  if (durationDays >= 28) {
    return Math.ceil(durationDays / 30) * property.price;
  }
  if (durationDays >= 7) {
    return Math.ceil(durationDays / 7) * property.weeklyPrice;
  }
  return durationDays * property.dailyPrice;
};
