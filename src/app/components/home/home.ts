import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LocationSearchService } from '../../core/services/location-search.service';
import { PropertyApiService } from '../../core/services/property-api.service';
import {
  discoveryTiles,
  durationOptions,
  locationSuggestions,
  platformHighlights,
  quickFilters,
  rentalListings
} from '../../data/market-data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private readonly propertyApi = inject(PropertyApiService);
  private readonly locationSearch = inject(LocationSearchService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly durationOptions = durationOptions;
  readonly locationSuggestions = locationSuggestions;
  readonly quickFilters = quickFilters;
  listings = rentalListings;
  readonly discoveryTiles = discoveryTiles;
  readonly platformHighlights = platformHighlights;
  readonly selectedLocation = this.locationSearch.selectedLocation;
  readonly selectedCity = this.locationSearch.selectedCity;
  private readonly starCache = new Map<number, boolean[]>();

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
