import { Component, NgZone, inject } from '@angular/core';
import { LocationSearchService } from '../../core/services/location-search.service';

@Component({
  selector: 'app-location-permission',
  standalone: true,
  templateUrl: './location-permission.html',
  styleUrls: ['./location-permission.css']
})
export class LocationPermissionComponent {
  private readonly locationSearch = inject(LocationSearchService);
  private readonly zone = inject(NgZone);
  private readonly storageKey = 'unio_location_permission';
  showPrompt = localStorage.getItem(this.storageKey) !== 'granted';
  isFetching = false;
  statusMessage = '';

  allowLocation(): void {
    this.statusMessage = '';

    if (!window.isSecureContext && location.hostname !== 'localhost') {
      this.statusMessage = 'Location needs HTTPS or localhost. Please open the site on a secure address.';
      return;
    }

    if (!navigator.geolocation) {
      localStorage.setItem(this.storageKey, 'unsupported');
      this.statusMessage = 'This browser does not support location fetching.';
      return;
    }

    this.isFetching = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        localStorage.setItem(this.storageKey, 'granted');
        localStorage.setItem('unio_last_lat', String(position.coords.latitude));
        localStorage.setItem('unio_last_lng', String(position.coords.longitude));
        localStorage.setItem('unio_location_updated_at', new Date().toISOString());
        this.locationSearch
          .useCurrentCoordinates(position.coords.latitude, position.coords.longitude)
          .subscribe((location) => {
            this.zone.run(() => {
              this.locationSearch.setSelectedLocation(location);
              this.isFetching = false;
              this.showPrompt = false;
            });
          });
      },
      (error) => {
        localStorage.setItem(this.storageKey, 'denied');
        this.isFetching = false;
        this.statusMessage =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Allow it from browser site settings and try again.'
            : 'Unable to fetch current location. Please check GPS/network and try again.';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  dismissPrompt(): void {
    localStorage.setItem(this.storageKey, 'dismissed');
    this.showPrompt = false;
  }
}
