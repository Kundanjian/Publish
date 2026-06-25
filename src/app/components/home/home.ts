import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { LocationSearchService } from '../../core/services/location-search.service';
import { PropertyApiService } from '../../core/services/property-api.service';
import {
  discoveryTiles,
  durationOptions,
  locationSuggestions as fallbackSuggestions,
  platformHighlights,
  quickFilters,
  rentalListings
} from '../../data/market-data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly propertyApi = inject(PropertyApiService);
  private readonly locationSearch = inject(LocationSearchService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly locationQuery$ = new Subject<string>();
  private locationSub?: Subscription;

  readonly durationOptions = durationOptions;
  readonly quickFilters = quickFilters;
  listings = rentalListings;
  readonly discoveryTiles = discoveryTiles;
  readonly platformHighlights = platformHighlights;
  readonly selectedLocation = this.locationSearch.selectedLocation;
  readonly selectedCity = this.locationSearch.selectedCity;
  private readonly starCache = new Map<number, boolean[]>();

  selectedDuration = durationOptions[0] ?? 'Monthly';
  locationQuery = this.locationSearch.selectedLocation();
  locationSuggestions: string[] = [];
  showSuggestions = false;

  private readonly listingsEffect = effect((onCleanup) => {
    const location = this.selectedLocation();
    const subscription = this.propertyApi.getProperties(location).subscribe({
      next: (properties) => {
        this.listings = properties.slice(0, 8);
        this.changeDetector.markForCheck();
      }
    });
    onCleanup(() => subscription.unsubscribe());
  });

  ngOnInit(): void {
    this.locationSub = this.locationQuery$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((query) => this.locationSearch.suggestLocations(query))
      )
      .subscribe((suggestions) => {
        this.locationSuggestions = suggestions.length > 0 ? suggestions : fallbackSuggestions.slice(0, 5);
        this.showSuggestions = this.locationSuggestions.length > 0 && this.locationQuery.length > 0;
        this.changeDetector.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.locationSub?.unsubscribe();
  }

  onLocationInput(value: string): void {
    this.locationQuery = value;
    this.locationQuery$.next(value);
  }

  onLocationBlur(): void {
    // Short delay so mousedown on suggestion fires first
    setTimeout(() => {
      this.showSuggestions = false;
      this.changeDetector.markForCheck();
    }, 150);
  }

  pickLocation(location: string): void {
    this.locationQuery = location;
    this.showSuggestions = false;
    this.locationSearch.setSelectedLocation(location);
    this.changeDetector.markForCheck();
  }

  confirmLocation(): void {
    if (this.locationQuery.trim()) {
      this.pickLocation(this.locationQuery.trim());
    }
    this.showSuggestions = false;
  }

  searchByCategory(category: string): void {
    this.router.navigate(['/quick-rent'], {
      queryParams: { location: this.selectedLocation(), category }
    });
  }

  stars(rating: number): boolean[] {
    if (!this.starCache.has(rating)) {
      this.starCache.set(
        rating,
        Array.from({ length: 5 }, (_, index) => index < rating)
      );
    }

    return this.starCache.get(rating) ?? [];
  }
}

export { HomeComponent as Home };
