import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
//HEAD
import { LocationSearchService } from '../../core/services/location-search.service';
//
import { PwaInstallService } from '../../core/services/pwa-install.service';
//7f9ea7109b049d12a3c0d98ac96604b20594d1a6

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthApiService);
//HEAD
  private readonly locationSearch = inject(LocationSearchService);
//
  private readonly pwaInstallService = inject(PwaInstallService);
//7f9ea7109b049d12a3c0d98ac96604b20594d1a6
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private routeSubscription?: Subscription;
  private locationSubscription?: Subscription;
  private readonly locationQuery$ = new Subject<string>();
  private removeScrollListener?: () => void;
  private lastScrollY = 0;
  private scrollTicking = false;

  menuOpen = false;
  isHomePage = true;
  bookingHidden = false;
  navbarHidden = false;
  selectedLocation = this.locationSearch.selectedLocation();
  locationQuery = this.selectedLocation;
  locationSuggestions: string[] = [];
  locationPanelOpen = false;
  isFetchingLocation = false;
  theme: 'light' | 'dark' = 'light';
  mobileAppUrl = 'https://play.google.com/store/apps/details?id=com.unio.mobile';
  installingApp = false;
  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly canInstallPwa = this.pwaInstallService.canInstall;
  readonly isPwaInstalled = this.pwaInstallService.isInstalled;

  ngOnInit(): void {
    this.pwaInstallService.init();

    const savedTheme = localStorage.getItem('unio-theme');
    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.theme = savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light';
    this.applyTheme();

    if (this.isLoggedIn()) {
      this.authService.syncProfile().subscribe();
    }

//HEAD
    this.updateRouteState(this.router.url);
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateRouteState(event.urlAfterRedirects));

    this.locationSubscription = this.locationQuery$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((query) => this.locationSearch.suggestLocations(query))
      )
      .subscribe((suggestions) => {
        this.locationSuggestions = suggestions;
        this.locationPanelOpen = suggestions.length > 0;
      });

    this.locationQuery$.next(this.locationQuery);

    this.zone.runOutsideAngular(() => {
      const handleScroll = () => this.scheduleScrollUpdate();
      window.addEventListener('scroll', handleScroll, { passive: true });
      this.removeScrollListener = () => window.removeEventListener('scroll', handleScroll);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.locationSubscription?.unsubscribe();
    this.removeScrollListener?.();
//
    this.authService.getMobileAppInstallUrl().subscribe((url) => {
      this.mobileAppUrl = url;
    });
//7f9ea7109b049d12a3c0d98ac96604b20594d1a6
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('unio-theme', this.theme);
    this.applyTheme();
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  onLocationInput(value: string): void {
    this.locationQuery = value;
    this.locationQuery$.next(value);
  }

  chooseLocation(location: string): void {
    this.selectedLocation = location;
    this.locationQuery = location;
    this.locationPanelOpen = false;
    this.locationSearch.setSelectedLocation(location);
  }

  useCurrentLocation(): void {
    this.isFetchingLocation = true;

    if (!navigator.geolocation) {
      this.isFetchingLocation = false;
      this.chooseLocation('Location unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        localStorage.setItem('unio_location_permission', 'granted');
        localStorage.setItem('unio_last_lat', String(position.coords.latitude));
        localStorage.setItem('unio_last_lng', String(position.coords.longitude));
        this.locationSearch
          .useCurrentCoordinates(position.coords.latitude, position.coords.longitude)
          .subscribe((location) => {
            this.zone.run(() => {
              this.isFetchingLocation = false;
              this.chooseLocation(location);
            });
          });
      },
      () => {
        this.zone.run(() => {
          this.isFetchingLocation = false;
          this.chooseLocation('Jabalpur, Madhya Pradesh');
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  searchSelectedLocation(): void {
    if (this.locationQuery.trim()) {
      this.chooseLocation(this.locationQuery);
    }

    this.closeMenu();
    this.router.navigate(['/quick-rent'], {
      queryParams: { location: this.selectedLocation }
    });
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }

  async installMobileApp(): Promise<void> {
    if (this.installingApp) {
      return;
    }

    this.installingApp = true;
    try {
      const result = await this.pwaInstallService.promptInstall();
      this.closeMenu();

      if (result === 'unavailable') {
        window.open(this.mobileAppUrl, '_blank', 'noopener');
      }
    } finally {
      this.installingApp = false;
    }
  }

  userInitial(): string {
    const name = this.currentUser()?.name.trim();
    return name ? name[0].toUpperCase() : 'U';
  }

  userName(): string {
    return this.currentUser()?.name || 'Guest';
  }

  userContact(): string {
    const user = this.currentUser();
    return user?.phone || user?.email || 'mobile or mail';
  }

  userCoins(): number {
    return this.currentUser()?.unioCoins ?? 0;
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  private updateRouteState(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    this.isHomePage = path === '/';
    this.bookingHidden = false;
    this.navbarHidden = false;
    this.lastScrollY = typeof window === 'undefined' ? 0 : window.scrollY;
  }

  private scheduleScrollUpdate(): void {
    if (this.scrollTicking || !this.isHomePage) {
      return;
    }

    this.scrollTicking = true;
    requestAnimationFrame(() => {
      this.scrollTicking = false;
      const currentScrollY = window.scrollY;
      const nextHidden = currentScrollY > this.lastScrollY && currentScrollY > 80;
      this.lastScrollY = Math.max(currentScrollY, 0);

      if (nextHidden !== this.bookingHidden) {
        this.zone.run(() => {
          this.bookingHidden = nextHidden;
          this.navbarHidden = nextHidden;
        });
      }
    });
  }
}

export { NavbarComponent as Navbar };
