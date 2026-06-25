import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, timeout } from 'rxjs';
import { rentalListings, type RentalListing } from '../../data/market-data';
import { ApiBooking, ApiProperty } from '../models/api.models';
import { AuthApiService } from './auth-api.service';

export type BookingPayload = {
  propertyId: number;
  tenantName: string;
  tenantEmail: string;
  startDate: string;
  endDate: string;
};

export type PublishPropertyPayload = {
  title: string;
  location: string;
  price: number;
  dailyPrice: number;
  propertyType: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  summary: string;
  images: string[];
  specifications: string[];
  addOns: Array<{ name: string; charge: number; image?: string }>;
  nearbyLandmark: string;
  landmarkDistance: string;
  foodAvailable: boolean;
  foodOptions: string[];
  entryRule: string;
};

@Injectable({ providedIn: 'root' })
export class PropertyApiService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly apiBase = '/api/properties';
  private readonly bookingBase = '/api/bookings';
  private readonly requestTimeoutMs = 2500;
  private readonly publishTimeoutMs = 15000;
  private readonly publishedStorageKey = 'unio-live-published-properties';
  private readonly propertiesCache = new Map<string, Observable<RentalListing[]>>();
  private inMemoryLiveListings: RentalListing[] = [];

  getProperties(location = '', query = ''): Observable<RentalListing[]> {
    const cacheKey = `${location.trim().toLowerCase()}::${query.trim().toLowerCase()}`;
    const params = this.buildPropertyParams(location, query);

    if (!this.propertiesCache.has(cacheKey)) {
      this.propertiesCache.set(
        cacheKey,
        this.http.get<ApiProperty[]>(this.apiBase, { params }).pipe(
          timeout(this.requestTimeoutMs),
          map((properties) =>
            this.filterListings(
              this.mergeLiveListings(properties.map((property, index) => this.mapProperty(property, index))),
              location,
              query
            )
          ),
          catchError(() => of(this.filterListings(this.mergeLiveListings(rentalListings), location, query))),
          shareReplay({ bufferSize: 1, refCount: true })
        )
      );
    }

    return this.propertiesCache.get(cacheKey) as Observable<RentalListing[]>;
  }

  getPropertyById(id: string): Observable<RentalListing> {
    return this.http
      .get<ApiProperty>(`${this.apiBase}/${id}`)
      .pipe(
        timeout(this.requestTimeoutMs),
        map((property) => this.mapProperty(property, this.safeIndex(property.id))),
        catchError(() => {
          const fallback =
            rentalListings.find((listing) => String(listing.id) === String(id)) ?? rentalListings[0];
          return of(fallback);
        })
      );
  }

  createBooking(payload: BookingPayload): Observable<{ message: string; booking: ApiBooking }> {
    return this.http.post<{ message: string; booking: ApiBooking }>(this.bookingBase, payload, {
      headers: this.authApi.getAuthHeaders()
    });
  }

  getBookings(): Observable<ApiBooking[]> {
    return this.http.get<ApiBooking[]>(this.bookingBase, { headers: this.authApi.getAuthHeaders() });
  }

  getMyProperties(): Observable<RentalListing[]> {
    return this.http.get<ApiProperty[]>(`${this.apiBase}/mine`, { headers: this.authApi.getAuthHeaders() }).pipe(
      timeout(this.requestTimeoutMs),
      map((properties) => properties.map((property, index) => this.mapProperty(property, index)))
    );
  }

  publishProperty(
    payload: PublishPropertyPayload
  ): Observable<{ message: string; property: ApiProperty }> {
    return this.http.post<{ message: string; property: ApiProperty }>(this.apiBase, payload, {
      headers: this.authApi.getAuthHeaders()
    }).pipe(
      timeout(this.publishTimeoutMs),
      tap(({ property }) => {
        this.storeLiveListing(this.mapProperty(property, this.safeIndex(property.id)));
        this.propertiesCache.clear();
      })
    );
  }

  private mapProperty(property: ApiProperty, fallbackIndex: number): RentalListing {
    const fallback = rentalListings[this.safeIndex(fallbackIndex)];
    const title = property.title?.trim() || fallback.title;
    const location = property.location?.trim() || fallback.location;
    const price = property.price || fallback.price;

    return {
      ...fallback,
      id: String(property.id),
      title,
      location,
      price,
      dailyPrice: property.dailyPrice || Math.max(100, Math.round(price / 18)),
      image: property.images?.[0] || fallback.image,
      images: property.images,
      weeklyPrice: property.weeklyPrice,
      propertyType: property.propertyType || this.inferPropertyType(title, fallback.propertyType),
      summary:
        property.summary ||
        `Direct landlord listing in ${location}. Check facilities, stay rules and suitability before booking.`,
      status: property.status,
      availableFrom: property.availableFrom,
      amenities: property.amenities,
      rules: property.rules,
      bookedRanges: property.bookedRanges,
      landlordContact: {
        name: property.ownerName,
        phone: property.ownerPhone,
        email: property.ownerEmail
      },
      specifications: property.specifications,
      addOns: property.addOns,
      nearbyLandmark: property.nearbyLandmark,
      landmarkDistance: property.landmarkDistance,
      foodAvailable: property.foodAvailable,
      foodOptions: property.foodOptions,
      entryRule: property.entryRule
    };
  }

  private mergeLiveListings(listings: RentalListing[]): RentalListing[] {
    const liveListings = [...this.inMemoryLiveListings, ...this.readLiveListings()];
    const liveIds = new Set(liveListings.map((listing) => String(listing.id)));
    return [
      ...liveListings,
      ...listings.filter((listing) => !liveIds.has(String(listing.id)))
    ];
  }

  private storeLiveListing(listing: RentalListing): void {
    this.inMemoryLiveListings = [
      { ...listing, status: 'AVAILABLE' as const },
      ...this.inMemoryLiveListings.filter((item) => String(item.id) !== String(listing.id))
    ].slice(0, 20);

    const storageSafeListing = {
      ...listing,
      images: undefined,
      image: listing.image.startsWith('data:image/') ? rentalListings[0].image : listing.image,
      addOns: listing.addOns?.map((addOn) => ({ ...addOn, image: undefined }))
    };
    const nextListings = [
      { ...storageSafeListing, status: 'AVAILABLE' as const },
      ...this.readLiveListings().filter((item) => String(item.id) !== String(listing.id))
    ].slice(0, 20);

    try {
      localStorage.setItem(this.publishedStorageKey, JSON.stringify(nextListings));
    } catch {
      localStorage.removeItem(this.publishedStorageKey);
    }
  }

  private readLiveListings(): RentalListing[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.publishedStorageKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private safeIndex(index: number): number {
    return Math.abs(index) % rentalListings.length;
  }

  private inferPropertyType(title: string, fallback: string): string {
    const normalized = title.toLowerCase();

    if (normalized.includes('hostel')) {
      return 'Hostel';
    }
    if (normalized.includes('villa')) {
      return 'Villa';
    }
    if (normalized.includes('apartment')) {
      return 'Apartment';
    }
    if (normalized.includes('flat')) {
      return 'Flat';
    }

    return fallback;
  }

  private buildPropertyParams(location: string, query: string): HttpParams {
    let params = new HttpParams();
    if (location.trim()) {
      params = params.set('location', location.trim());
    }
    if (query.trim()) {
      params = params.set('query', query.trim());
    }
    return params;
  }

  private filterListings(listings: RentalListing[], location: string, query: string): RentalListing[] {
    const normalizedLocation = this.normalize(location);
    const normalizedQuery = this.normalize(query);

    return listings.filter((listing) => {
      const searchableLocation = this.normalize(`${listing.location} ${listing.title}`);
      const searchableQuery = this.normalize(
        `${listing.title} ${listing.propertyType} ${listing.summary} ${listing.location}`
      );

      const locationMatch =
        !normalizedLocation ||
        searchableLocation.includes(normalizedLocation) ||
        normalizedLocation.includes(this.normalize(listing.location)) ||
        this.hasLocationOverlap(normalizedLocation, this.normalize(listing.location));
      const queryMatch = !normalizedQuery || searchableQuery.includes(normalizedQuery);

      return locationMatch && queryMatch;
    });
  }

  private normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private hasLocationOverlap(selectedLocation: string, propertyLocation: string): boolean {
    return selectedLocation
      .split(' ')
      .filter((token) => token.length > 2)
      .some((token) => propertyLocation.includes(token));
  }
}
