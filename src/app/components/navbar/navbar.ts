import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { Component, HostListener, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
=======
import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { LocationSearchService } from '../../core/services/location-search.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthApiService);
  private readonly locationSearch = inject(LocationSearchService);
  private readonly pwaInstallService = inject(PwaInstallService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private routeSubscription?: Subscription;
  private locationSubscription?: Subscription;
  private readonly locationQuery$ = new Subject<string>();
  private removeScrollListener?: () => void;
  private lastScrollY = 0;
  private scrollTicking = false;
<<<<<<< HEAD
  private manuallyCollapsed = false;

  // ── Nav state ──────────────────────────────────────────────────────────────
=======

>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
  menuOpen = false;
  isHomePage = true;
  bookingHidden = false;
  navbarHidden = false;
<<<<<<< HEAD
  theme: 'light' | 'dark' = 'light';
  mobileAppUrl = 'https://play.google.com/store/apps/details?id=com.unio.mobile';
  installingApp = false;

  // ── Location ───────────────────────────────────────────────────────────────
=======
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
  selectedLocation = this.locationSearch.selectedLocation();
  locationQuery = this.selectedLocation;
  locationSuggestions: string[] = [];
  locationPanelOpen = false;
  isFetchingLocation = false;
<<<<<<< HEAD

  // ── Booking widget state ───────────────────────────────────────────────────
  guestAdults = 1;
  guestChildren = 0;
  guestPanelOpen = false;
  moveInDate = '';
  moveOutDate = '';
  flexibleMoveOut = false;
  checkInTime = '';
  budgetOption = 'Rs 2,000 - Rs 6,000';

  readonly budgetOptions = [
    'Rs 2,000 - Rs 6,000',
    'Rs 6,000 - Rs 12,000',
    'Rs 12,000 - Rs 25,000',
    'Rs 25,000+',
  ];

  readonly checkInTimes = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM',
  ];

  // ── Auth ───────────────────────────────────────────────────────────────────
=======
  theme: 'light' | 'dark' = 'light';
  mobileAppUrl = 'https://play.google.com/store/apps/details?id=com.unio.mobile';
  installingApp = false;
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly canInstallPwa = this.pwaInstallService.canInstall;
  readonly isPwaInstalled = this.pwaInstallService.isInstalled;

<<<<<<< HEAD
  // ── Computed getters ───────────────────────────────────────────────────────
  get todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  get moveOutMin(): string {
    if (this.moveInDate) {
      const d = new Date(this.moveInDate);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }
    return this.todayIso;
  }

  get stayLength(): string {
    if (!this.moveInDate || !this.moveOutDate || this.flexibleMoveOut) return '';
    const inMs = new Date(this.moveInDate).getTime();
    const outMs = new Date(this.moveOutDate).getTime();
    const nights = Math.round((outMs - inMs) / 86400000);
    if (nights <= 0) return '';
    return nights === 1 ? '1 Night' : `${nights} Nights`;
  }

  get guestSummary(): string {
    const total = this.guestAdults + this.guestChildren;
    if (total === 0) return 'Add guests';
    const parts: string[] = [];
    if (this.guestAdults > 0) parts.push(`${this.guestAdults} Adult${this.guestAdults !== 1 ? 's' : ''}`);
    if (this.guestChildren > 0) parts.push(`${this.guestChildren} Child${this.guestChildren !== 1 ? 'ren' : ''}`);
    return parts.join(', ');
  }

  get formattedMoveIn(): string {
    return this.formatDate(this.moveInDate);
  }

  get formattedMoveOut(): string {
    return this.formatDate(this.moveOutDate);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
=======
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
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

<<<<<<< HEAD
=======
    this.authService.getMobileAppInstallUrl().subscribe((url) => {
      this.mobileAppUrl = url;
    });

>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
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
  }

<<<<<<< HEAD
  // ── Close panels on outside click ─────────────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.booking-field-guests')) {
      this.guestPanelOpen = false;
    }
    if (!target.closest('.nav-filter.location-search') && !target.closest('.location-suggestions')) {
      this.locationPanelOpen = false;
    }
  }

  // ── Theme ──────────────────────────────────────────────────────────────────
=======
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('unio-theme', this.theme);
    this.applyTheme();
  }

<<<<<<< HEAD
  // ── Menu ───────────────────────────────────────────────────────────────────
  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void  { this.menuOpen = false; }

  // ── Booking bar ────────────────────────────────────────────────────────────
  collapseBooking(): void {
    this.manuallyCollapsed = true;
    this.bookingHidden = true;
  }

  expandBooking(): void {
    this.manuallyCollapsed = false;
    this.bookingHidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Guest counter ──────────────────────────────────────────────────────────
  toggleGuestPanel(): void {
    this.guestPanelOpen = !this.guestPanelOpen;
  }

  changeAdults(delta: number): void {
    this.guestAdults = Math.max(0, this.guestAdults + delta);
  }

  changeChildren(delta: number): void {
    this.guestChildren = Math.max(0, this.guestChildren + delta);
  }

  // ── Date handling ──────────────────────────────────────────────────────────
  onMoveInChange(): void {
    // If move-out is before new move-in, clear it
    if (this.moveOutDate && this.moveOutDate <= this.moveInDate) {
      this.moveOutDate = '';
    }
  }

  toggleFlexibleMoveOut(): void {
    this.flexibleMoveOut = !this.flexibleMoveOut;
    if (this.flexibleMoveOut) {
      this.moveOutDate = '';
    }
  }

  // ── Location ───────────────────────────────────────────────────────────────
=======
  closeMenu(): void {
    this.menuOpen = false;
  }

>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
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
<<<<<<< HEAD
    this.closeMenu();
    const params: Record<string, string> = { location: this.selectedLocation };
    if (this.flexibleMoveOut) params['flexible'] = 'true';
    if (this.moveInDate) params['moveIn'] = this.moveInDate;
    if (this.moveOutDate && !this.flexibleMoveOut) params['moveOut'] = this.moveOutDate;
    if (this.stayLength) params['nights'] = this.stayLength;
    if (this.guestAdults + this.guestChildren > 0) {
      params['guests'] = `${this.guestAdults}a${this.guestChildren}c`;
    }
    this.router.navigate(['/quick-rent'], { queryParams: params });
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
=======

    this.closeMenu();
    this.router.navigate(['/quick-rent'], {
      queryParams: { location: this.selectedLocation }
    });
  }

>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
  logout(): void {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }

  async installMobileApp(): Promise<void> {
<<<<<<< HEAD
    if (this.installingApp) return;
=======
    if (this.installingApp) {
      return;
    }

>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
    this.installingApp = true;
    try {
      const result = await this.pwaInstallService.promptInstall();
      this.closeMenu();
<<<<<<< HEAD
=======

>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
      if (result === 'unavailable') {
        window.open(this.mobileAppUrl, '_blank', 'noopener');
      }
    } finally {
      this.installingApp = false;
    }
  }

<<<<<<< HEAD
  // ── Drawer profile helpers ─────────────────────────────────────────────────
  greeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12)  return 'Good Morning';
    if (h >= 12 && h < 17) return 'Good Afternoon';
    if (h >= 17 && h < 21) return 'Good Evening';
    return 'Good Night';
  }

  userInitial(): string {
    const name = this.currentUser()?.name?.trim();
    return name ? name[0].toUpperCase() : '?';
  }

  userName(): string {
    return this.currentUser()?.name?.trim() || '';
  }

  userEmail(): string {
    return this.currentUser()?.email?.trim() || '';
  }

  userPhone(): string {
    return this.currentUser()?.phone?.trim() || '';
=======
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
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
  }

  userCoins(): number {
    return this.currentUser()?.unioCoins ?? 0;
  }

<<<<<<< HEAD
  // ── Private ────────────────────────────────────────────────────────────────
  private formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

=======
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  private updateRouteState(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    this.isHomePage = path === '/';
<<<<<<< HEAD
    this.manuallyCollapsed = false;
=======
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
    this.bookingHidden = false;
    this.navbarHidden = false;
    this.lastScrollY = typeof window === 'undefined' ? 0 : window.scrollY;
  }

  private scheduleScrollUpdate(): void {
<<<<<<< HEAD
    if (this.scrollTicking) return;
=======
    if (this.scrollTicking || !this.isHomePage) {
      return;
    }

>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
    this.scrollTicking = true;
    requestAnimationFrame(() => {
      this.scrollTicking = false;
      const currentScrollY = window.scrollY;
<<<<<<< HEAD
      this.lastScrollY = Math.max(currentScrollY, 0);
      if (!this.isHomePage) return;
      const collapseThreshold = Math.max(window.innerHeight * 0.07, 56);
      const shouldHide = this.manuallyCollapsed || currentScrollY > collapseThreshold;
      if (shouldHide !== this.bookingHidden) {
        this.zone.run(() => {
          this.bookingHidden = shouldHide;
          this.navbarHidden = false;
=======
      const nextHidden = currentScrollY > this.lastScrollY && currentScrollY > 80;
      this.lastScrollY = Math.max(currentScrollY, 0);

      if (nextHidden !== this.bookingHidden) {
        this.zone.run(() => {
          this.bookingHidden = nextHidden;
          this.navbarHidden = nextHidden;
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
        });
      }
    });
  }
}

export { NavbarComponent as Navbar };
