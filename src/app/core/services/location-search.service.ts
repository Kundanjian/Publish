import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, timeout } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LocationSearchService {
  private readonly http = inject(HttpClient);
  private readonly selectedLocationKey = 'unio_selected_location';
  private readonly selectedLocationSignal = signal(
    localStorage.getItem(this.selectedLocationKey) || 'Jabalpur, Madhya Pradesh'
  );

  readonly selectedLocation = this.selectedLocationSignal.asReadonly();
  readonly selectedCity = computed(() => this.selectedLocationSignal().split(',')[0].trim());

  setSelectedLocation(location: string): void {
    const normalized = location.trim();
    if (!normalized || normalized === 'Current location') {
      return;
    }

    localStorage.setItem(this.selectedLocationKey, normalized);
    this.selectedLocationSignal.set(normalized);
  }

  /**
   * Resolves GPS coordinates → human-readable location string.
   * Strategy:
   *  1. Try our backend /api/locations/suggest?lat=&lng= (nearest known area)
   *  2. If that returns a generic fallback, try Nominatim reverse-geocode
   *  3. Fall back to the last known stored location
   */
  useCurrentCoordinates(latitude: number, longitude: number): Observable<string> {
    const params = new HttpParams()
      .set('lat', latitude)
      .set('lng', longitude);

    return this.http.get<{ suggestions: string[] }>('/api/locations/suggest', { params }).pipe(
      timeout(3500),
      map((response) => {
        const first = response.suggestions[0] || '';
        // If our backend gave a meaningful location (not the generic fallback), use it
        if (first && first !== 'Current location') {
          return first;
        }
        return '';
      }),
      // If empty/generic, try Nominatim for accurate reverse-geocoding
      switchMap((location) => {
        if (location) {
          return of(location);
        }
        return this.reverseGeocodeNominatim(latitude, longitude);
      }),
      catchError(() => this.reverseGeocodeNominatim(latitude, longitude))
    );
  }

  suggestLocations(query: string): Observable<string[]> {
    const trimmedQuery = query.trim();
    const params = new HttpParams().set('query', trimmedQuery);

    return this.http.get<{ suggestions: string[] }>('/api/locations/suggest', { params }).pipe(
      timeout(2500),
      map((response) => response.suggestions),
      catchError(() => of(this.localSuggestions(trimmedQuery)))
    );
  }

  /**
   * Nominatim reverse geocoding — free, no API key needed.
   * Returns a locality string like "Civil Lines, Jabalpur, Madhya Pradesh".
   */
  private reverseGeocodeNominatim(lat: number, lng: number): Observable<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;

    return this.http.get<NominatimResult>(url, {
      headers: { 'Accept-Language': 'en' }
    }).pipe(
      timeout(5000),
      map((result) => this.formatNominatimResult(result)),
      catchError(() => {
        // Last resort: use the stored location
        const stored = localStorage.getItem(this.selectedLocationKey);
        return of(stored || 'Jabalpur, Madhya Pradesh');
      })
    );
  }

  private formatNominatimResult(result: NominatimResult): string {
    const addr = result.address;
    if (!addr) {
      return result.display_name?.split(',').slice(0, 2).join(',').trim() || 'Jabalpur, Madhya Pradesh';
    }

    // Build a clean "Locality, City, State" string
    const locality =
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.residential ||
      addr.village ||
      addr.town ||
      '';

    const city =
      addr.city ||
      addr.district ||
      addr.county ||
      addr.town ||
      '';

    const state = addr.state || '';

    const parts: string[] = [];
    if (locality) parts.push(locality);
    if (city && city !== locality) parts.push(city);
    if (state) parts.push(state);

    return parts.length > 0
      ? parts.join(', ')
      : result.display_name?.split(',').slice(0, 2).join(',').trim() || 'Jabalpur, Madhya Pradesh';
  }

  private localSuggestions(query: string): string[] {
    const options = [
      'Jabalpur, Madhya Pradesh',
      'Napier Town, Jabalpur',
      'Civil Lines, Jabalpur',
      'Wright Town, Jabalpur',
      'Madan Mahal, Jabalpur',
      'Bhedaghat, Jabalpur',
      'Indore, Madhya Pradesh',
      'Bhopal, Madhya Pradesh'
    ];
    const normalized = query.toLowerCase().trim();

    return options
      .filter((location) => !normalized || location.toLowerCase().includes(normalized))
      .slice(0, 8);
  }
}

interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  residential?: string;
  village?: string;
  town?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
}

interface NominatimResult {
  display_name?: string;
  address?: NominatimAddress;
}
