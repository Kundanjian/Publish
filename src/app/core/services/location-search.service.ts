import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, timeout } from 'rxjs';

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
    if (!normalized) {
      return;
    }

    localStorage.setItem(this.selectedLocationKey, normalized);
    this.selectedLocationSignal.set(normalized);
  }

  useCurrentCoordinates(latitude: number, longitude: number): Observable<string> {
    const params = new HttpParams().set('lat', latitude).set('lng', longitude);

    return this.http.get<{ suggestions: string[] }>('/api/locations/suggest', { params }).pipe(
      timeout(3500),
      map((response) => response.suggestions[0] || 'Current location'),
      catchError(() => of('Current location'))
    );
  }

  suggestLocations(query: string): Observable<string[]> {
    const params = new HttpParams().set('query', query.trim());

    return this.http.get<{ suggestions: string[] }>('/api/locations/suggest', { params }).pipe(
      timeout(2500),
      map((response) => response.suggestions),
      catchError(() => of(this.localSuggestions(query)))
    );
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
