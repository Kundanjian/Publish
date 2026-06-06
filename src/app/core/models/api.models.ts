export type ApiProperty = {
  id: number;
  title: string;
  location: string;
  price: number;
  dailyPrice: number;
  weeklyPrice: number;
  propertyType: string;
  summary: string;
  status: 'AVAILABLE' | 'BOOKED' | 'PENDING_APPROVAL';
  availableFrom: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
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

export type ApiBooking = {
  id: string;
  propertyId: number;
  propertyTitle: string;
  tenantName: string;
  tenantEmail: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  amount: number;
  status: 'CONFIRMED' | 'PENDING_PAYMENT' | 'CANCELLED';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  invoiceNo: string;
  landlordContact: {
    name: string;
    phone: string;
    email: string;
  };
  createdAt: string;
};
