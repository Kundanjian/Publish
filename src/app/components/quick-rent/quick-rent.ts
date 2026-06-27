import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, Subscription, switchMap } from 'rxjs';
import { LocationSearchService } from '../../core/services/location-search.service';
import { PropertyApiService } from '../../core/services/property-api.service';
import {
  durationOptions,
  quickFilters,
  rentalListings
} from '../../data/market-data';

@Component({
  selector: 'app-quick-rent',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './quick-rent.html',
  styleUrls: ['./quick-rent.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickRentComponent implements OnInit, OnDestroy {
  private readonly propertyApi = inject(PropertyApiService);
  private readonly locationSearch = inject(LocationSearchService);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly locationQuery$ = new Subject<string>();
  private locationSubscription?: Subscription;
  readonly durationOptions = durationOptions;
  readonly quickFilters = quickFilters;
  listings = rentalListings;
  selectedLocation = this.locationSearch.selectedLocation();
  locationSuggestions: string[] = [];
  locationPanelOpen = false;
  searchTerm = '';
  private readonly starCache = new Map<number, boolean[]>();

  ngOnInit(): void {
    const routeLocation = this.route.snapshot.queryParamMap.get('location');
    if (routeLocation) {
      this.locationSearch.setSelectedLocation(routeLocation);
    }

    this.locationSubscription = this.locationQuery$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((query) => this.locationSearch.suggestLocations(query))
      )
      .subscribe((suggestions) => {
        this.locationSuggestions = suggestions;
        this.locationPanelOpen = suggestions.length > 0;
        this.changeDetector.markForCheck();
      });

    this.locationQuery$.next(this.selectedLocation);
  }

  ngOnDestroy(): void {
    this.locationSubscription?.unsubscribe();
  }

  private readonly listingsEffect = effect((onCleanup) => {
    this.selectedLocation = this.locationSearch.selectedLocation();
    const subscription = this.propertyApi.getProperties(this.selectedLocation, this.searchTerm).subscribe({
      next: (properties) => {
        this.listings = properties;
        this.changeDetector.markForCheck();
      }
    });
    onCleanup(() => subscription.unsubscribe());
  });

  onLocationInput(value: string): void {
    this.selectedLocation = value;
    this.locationQuery$.next(value);
  }

  chooseLocation(location: string): void {
    this.selectedLocation = location;
    this.locationPanelOpen = false;
    this.locationSearch.setSelectedLocation(location);
  }

  applySearch(): void {
    if (this.selectedLocation.trim()) {
      this.locationSearch.setSelectedLocation(this.selectedLocation);
    }

    this.propertyApi.getProperties(this.selectedLocation, this.searchTerm).subscribe({
      next: (properties) => {
        this.listings = properties;
        this.changeDetector.markForCheck();
      }
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

export { QuickRentComponent as QuickRent };
