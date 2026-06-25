import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PropertyApiService } from '../../core/services/property-api.service';

type AddOn = { name: string; charge: number; image?: string };

// ── Amenity catalogue ──────────────────────────────────────────────────────
export type AmenityCategory = { label: string; icon: string; items: string[] };
export const AMENITY_CATEGORIES: AmenityCategory[] = [
  {
    label: 'Basic Amenities', icon: 'home',
    items: ['WiFi', 'Air Conditioning', 'Fan', 'RO Water', 'Geyser', 'Power Backup', 'Laundry', 'Housekeeping']
  },
  {
    label: 'Parking', icon: 'local_parking',
    items: ['Two Wheeler Parking', 'Four Wheeler Parking', 'Covered Parking', 'Visitor Parking']
  },
  {
    label: 'EV Support', icon: 'ev_station',
    items: ['2-Wheeler EV Charging', '4-Wheeler EV Charging', 'Fast Charging', 'Paid Charging', 'Free Charging']
  },
  {
    label: 'Food', icon: 'restaurant',
    items: ['Breakfast Included', 'Lunch Available', 'Dinner Available', 'Kitchen Access', 'Cook Available']
  },
  {
    label: 'Security', icon: 'security',
    items: ['CCTV', 'Security Guard', 'Biometric Entry', 'Smart Lock', 'Women Only', 'Family Friendly']
  }
];

// ── Property rules catalogue ───────────────────────────────────────────────
export const PROPERTY_RULES: string[] = [
  'No Loud Music', 'No Parties', 'No Smoking', 'No Alcohol', 'No Pets',
  'No Extra Guests', 'No Visitors After 10 PM', 'Government ID Mandatory',
  'Couples Allowed', 'Couples Not Allowed', 'Bachelor Friendly', 'Family Friendly'
];

// ── Availability status types ──────────────────────────────────────────────
type BlockStatus = 'Booked' | 'Reserved' | 'Maintenance' | 'Unavailable';
type BlockedDate = { date: string; status: BlockStatus };
type RecurringBlock = { day: number; status: BlockStatus }; // 0=Sun … 6=Sat

// ── Pricing engine ─────────────────────────────────────────────────────────
type PricingEvent = { label: string; price: number };

// ── Self check-in ──────────────────────────────────────────────────────────
type CheckInCodeType = 'door_pin' | 'smart_lock' | 'lockbox';
type CheckInCode = { type: CheckInCodeType; label: string; code: string };

@Component({
  selector: 'app-publish-property',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './publish-property.html',
  styleUrls: ['./publish-property.css']
})
export class PublishPropertyComponent {
  private readonly propertyApi = inject(PropertyApiService);
  private readonly maxPropertyImages = 8;
  private readonly maxUploadImageSizeBytes = 5 * 1024 * 1024;
  private readonly targetImageSizeBytes = 650 * 1024;
  private readonly maxImageDimension = 1400;

  // ── Step management ──────────────────────────────────────────────────────
  readonly totalSteps = 7;
  currentStep = 1;

  readonly stepLabels = [
    '1. Basic Details',
    '2. Specifications',
    '3. Amenities',
    '4. Rules',
    '5. Availability',
    '6. Pricing',
    '7. Check-In'
  ];

  // ── Legacy options (step 2) ───────────────────────────────────────────────
  readonly facilityOptions = ['Bed', 'Fan', 'Chair', 'Table', 'AC', 'Water filter', 'Wardrobe'];
  readonly addOnOptions = [
    { name: 'Bed', charge: 500 },
    { name: 'AC', charge: 1500 },
    { name: 'Water filter', charge: 300 },
    { name: 'Food service', charge: 2500 }
  ];
  readonly foodOptions = ['Breakfast', 'Lunch', 'Dinner'];

  // ── Module 2: Amenities ───────────────────────────────────────────────────
  readonly amenityCategories = AMENITY_CATEGORIES;
  selectedAmenities: Set<string> = new Set();
  amenityJumpTarget = '';

  // ── Module 3: Rules ───────────────────────────────────────────────────────
  readonly allRules = PROPERTY_RULES;
  selectedRules: Set<string> = new Set();

  // ── Module 4: Availability ────────────────────────────────────────────────
  readonly blockStatuses: BlockStatus[] = ['Booked', 'Reserved', 'Maintenance', 'Unavailable'];
  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly statusColors: Record<BlockStatus, string> = {
    Booked:       '#dc2626',
    Reserved:     '#d97706',
    Maintenance:  '#7c3aed',
    Unavailable:  '#64748b'
  };

  calendarView: 'month' | 'week' = 'month';
  calendarDate: Date = new Date();
  blockedDates: BlockedDate[] = [];
  recurringBlocks: RecurringBlock[] = [];
  selectedBlockStatus: BlockStatus = 'Unavailable';
  bulkSelectMode = false;
  bulkSelectedDates: Set<string> = new Set();

  // Recurring block form
  recurringDay = 0;
  recurringStatus: BlockStatus = 'Unavailable';

  // ── Module 5: Pricing ─────────────────────────────────────────────────────
  weekdayPrice = 0;
  weekendPrice = 0;
  holidayPrice = 0;
  festivalPrice = 0;
  specialEvents: PricingEvent[] = [];
  newEventLabel = '';
  newEventPrice = 0;

  // ── Module 6: Self check-in ───────────────────────────────────────────────
  selfCheckInEnabled = false;
  checkInCodes: CheckInCode[] = [
    { type: 'door_pin',   label: 'Door PIN',       code: '' },
    { type: 'smart_lock', label: 'Smart Lock Code', code: '' },
    { type: 'lockbox',    label: 'Lockbox Code',    code: '' }
  ];

  // ── Core property ─────────────────────────────────────────────────────────
  property = {
    title: '',
    location: 'Jabalpur, Madhya Pradesh',
    propertyType: 'Apartment',
    price: 12000,
    dailyPrice: 900,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    summary: '',
    images: [] as string[],
    specifications: ['Fan'],
    addOns: [] as AddOn[],
    nearbyLandmark: '',
    landmarkDistance: '',
    foodAvailable: false,
    foodOptions: [] as string[],
    entryRule: '24 hour entry allowed'
  };

  isSubmitting = false;
  isSubmitted = false;
  successMessage = '';
  errorMessage = '';
  imageError = '';

  // ── Navigation ─────────────────────────────────────────────────────────────
  goToStep(step: number, form?: NgForm): void {
    if (step > this.currentStep && form && form.invalid) {
      form.form.markAllAsTouched();
      this.errorMessage = 'Please correct the highlighted fields before continuing.';
      return;
    }
    this.errorMessage = '';
    this.successMessage = '';
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextStep(form?: NgForm): void { this.goToStep(this.currentStep + 1, form); }
  prevStep(): void               { this.goToStep(this.currentStep - 1); }

  // ── Legacy kept for compatibility ─────────────────────────────────────────
  goToSpecifications(form: NgForm): void { this.nextStep(form); }
  goToBasics(): void                     { this.goToStep(1); }

  // ── Step 2 helpers ────────────────────────────────────────────────────────
  toggleSpecification(name: string, checked: boolean): void {
    this.property.specifications = checked
      ? [...this.property.specifications, name]
      : this.property.specifications.filter((i) => i !== name);
  }

  toggleAddOn(name: string, checked: boolean, defaultCharge: number): void {
    this.property.addOns = checked
      ? [...this.property.addOns, { name, charge: defaultCharge }]
      : this.property.addOns.filter((i) => i.name !== name);
  }

  updateAddOnCharge(name: string, charge: number): void {
    this.property.addOns = this.property.addOns.map((i) =>
      i.name === name ? { ...i, charge: Number(charge) || 0 } : i
    );
  }

  toggleFoodOption(name: string, checked: boolean): void {
    this.property.foodOptions = checked
      ? [...this.property.foodOptions, name]
      : this.property.foodOptions.filter((i) => i !== name);
  }

  hasSpecification(name: string): boolean { return this.property.specifications.includes(name); }
  selectedAddOn(name: string): AddOn | undefined { return this.property.addOns.find((i) => i.name === name); }
  hasFoodOption(name: string): boolean { return this.property.foodOptions.includes(name); }

  // ── Module 2: Amenity helpers ─────────────────────────────────────────────
  toggleAmenity(item: string, checked: boolean): void {
    checked ? this.selectedAmenities.add(item) : this.selectedAmenities.delete(item);
  }

  hasAmenity(item: string): boolean { return this.selectedAmenities.has(item); }

  removeAmenity(item: string): void { this.selectedAmenities.delete(item); }

  get selectedAmenitiesList(): string[] { return Array.from(this.selectedAmenities); }

  jumpToCategory(categoryLabel: string): void {
    const el = document.getElementById('cat-' + categoryLabel.replace(/\s+/g, '-'));
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Module 3: Rules helpers ───────────────────────────────────────────────
  toggleRule(rule: string, checked: boolean): void {
    checked ? this.selectedRules.add(rule) : this.selectedRules.delete(rule);
  }

  hasRule(rule: string): boolean { return this.selectedRules.has(rule); }

  get selectedRulesList(): string[] { return Array.from(this.selectedRules); }

  // ── Module 4: Calendar helpers ────────────────────────────────────────────
  get calendarDays(): Array<{ date: Date; iso: string; inMonth: boolean; status: BlockStatus | null; isRecurring: boolean }> {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ date: Date; iso: string; inMonth: boolean; status: BlockStatus | null; isRecurring: boolean }> = [];

    // Pad with previous month days
    for (let p = firstDay - 1; p >= 0; p--) {
      const d = new Date(year, month, -p);
      days.push({ date: d, iso: this.isoDate(d), inMonth: false, status: null, isRecurring: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = this.isoDate(date);
      const explicit = this.blockedDates.find((b) => b.date === iso);
      const recurring = this.recurringBlocks.find((r) => r.day === date.getDay());
      days.push({
        date,
        iso,
        inMonth: true,
        status: explicit?.status ?? recurring?.status ?? null,
        isRecurring: !explicit && !!recurring
      });
    }

    return days;
  }

  get calendarWeekDays(): Array<{ date: Date; iso: string; status: BlockStatus | null; isRecurring: boolean }> {
    const today = new Date(this.calendarDate);
    const sun = new Date(today);
    sun.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sun);
      d.setDate(sun.getDate() + i);
      const iso = this.isoDate(d);
      const explicit = this.blockedDates.find((b) => b.date === iso);
      const recurring = this.recurringBlocks.find((r) => r.day === d.getDay());
      return { date: d, iso, status: explicit?.status ?? recurring?.status ?? null, isRecurring: !explicit && !!recurring };
    });
  }

  prevCalendar(): void {
    if (this.calendarView === 'month') {
      this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() - 1, 1);
    } else {
      const d = new Date(this.calendarDate);
      d.setDate(d.getDate() - 7);
      this.calendarDate = d;
    }
  }

  nextCalendar(): void {
    if (this.calendarView === 'month') {
      this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 1);
    } else {
      const d = new Date(this.calendarDate);
      d.setDate(d.getDate() + 7);
      this.calendarDate = d;
    }
  }

  toggleDateBlock(iso: string, inMonth: boolean): void {
    if (!inMonth) return;
    if (this.bulkSelectMode) {
      this.bulkSelectedDates.has(iso) ? this.bulkSelectedDates.delete(iso) : this.bulkSelectedDates.add(iso);
      return;
    }
    const idx = this.blockedDates.findIndex((b) => b.date === iso);
    if (idx >= 0) {
      this.blockedDates = this.blockedDates.filter((_, i) => i !== idx);
    } else {
      this.blockedDates = [...this.blockedDates, { date: iso, status: this.selectedBlockStatus }];
    }
  }

  applyBulkBlock(): void {
    const newBlocks = Array.from(this.bulkSelectedDates)
      .filter((iso) => !this.blockedDates.some((b) => b.date === iso))
      .map((iso) => ({ date: iso, status: this.selectedBlockStatus }));
    this.blockedDates = [...this.blockedDates, ...newBlocks];
    this.bulkSelectedDates.clear();
    this.bulkSelectMode = false;
  }

  clearBulkSelection(): void {
    this.bulkSelectedDates.clear();
    this.bulkSelectMode = false;
  }

  addRecurringBlock(): void {
    const existing = this.recurringBlocks.findIndex((r) => r.day === this.recurringDay);
    if (existing >= 0) {
      this.recurringBlocks = this.recurringBlocks.map((r, i) =>
        i === existing ? { ...r, status: this.recurringStatus } : r
      );
    } else {
      this.recurringBlocks = [...this.recurringBlocks, { day: this.recurringDay, status: this.recurringStatus }];
    }
  }

  removeRecurring(day: number): void {
    this.recurringBlocks = this.recurringBlocks.filter((r) => r.day !== day);
  }

  removeBlockedDate(iso: string): void {
    this.blockedDates = this.blockedDates.filter((b) => b.date !== iso);
  }

  dateStatusColor(status: BlockStatus | null): string {
    return status ? this.statusColors[status] : '';
  }

  get calendarTitle(): string {
    if (this.calendarView === 'month') {
      return this.calendarDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    const days = this.calendarWeekDays;
    const first = days[0].date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const last  = days[6].date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${first} – ${last}`;
  }

  // ── Module 5: Pricing helpers ─────────────────────────────────────────────
  addSpecialEvent(): void {
    if (!this.newEventLabel.trim() || this.newEventPrice <= 0) return;
    this.specialEvents = [...this.specialEvents, { label: this.newEventLabel.trim(), price: this.newEventPrice }];
    this.newEventLabel = '';
    this.newEventPrice = 0;
  }

  removeSpecialEvent(idx: number): void {
    this.specialEvents = this.specialEvents.filter((_, i) => i !== idx);
  }

  get projectedMonthlyRevenue(): number {
    if (!this.weekdayPrice && !this.weekendPrice) return 0;
    const wd = (this.weekdayPrice || this.property.dailyPrice) * 22;
    const we = (this.weekendPrice  || this.property.dailyPrice) * 8;
    return wd + we;
  }

  // ── Module 6: Check-in helpers ────────────────────────────────────────────
  toggleCheckInCode(type: CheckInCodeType, enabled: boolean): void {
    if (!enabled) {
      this.checkInCodes = this.checkInCodes.map((c) => c.type === type ? { ...c, code: '' } : c);
    }
  }

  hasCheckInCode(type: CheckInCodeType): boolean {
    return !!this.checkInCodes.find((c) => c.type === type)?.code;
  }

  // ── Image handling (unchanged) ────────────────────────────────────────────
  async addPropertyImages(files: FileList | null): Promise<void> {
    this.imageError = '';
    if (!files?.length) return;
    const slots = this.maxPropertyImages - this.property.images.length;
    const selected = Array.from(files).slice(0, Math.max(slots, 0));
    if (files.length > slots) {
      this.imageError = `You can upload maximum ${this.maxPropertyImages} property images.`;
    }
    const images = await this.readValidImages(selected);
    this.property.images = [...this.property.images, ...images].slice(0, this.maxPropertyImages);
  }

  removePropertyImage(index: number): void {
    this.property.images = this.property.images.filter((_, i) => i !== index);
  }

  async addAddOnImage(name: string, files: FileList | null): Promise<void> {
    this.imageError = '';
    const file = files?.[0];
    if (!file) return;
    const [image] = await this.readValidImages([file]);
    if (!image) return;
    this.property.addOns = this.property.addOns.map((i) => i.name === name ? { ...i, image } : i);
  }

  removeAddOnImage(name: string): void {
    this.property.addOns = this.property.addOns.map((i) => {
      if (i.name !== name) return i;
      const { image, ...rest } = i;
      return rest;
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  submitProperty(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.isSubmitted = false;

    if (form.invalid) {
      form.form.markAllAsTouched();
      this.errorMessage = 'Please correct the highlighted fields.';
      return;
    }

    this.isSubmitting = true;

    const payload = {
      ...this.property,
      amenities: this.selectedAmenitiesList,
      rules: this.selectedRulesList,
      blockedDates: this.blockedDates,
      recurringBlocks: this.recurringBlocks,
      pricing: {
        weekday: this.weekdayPrice || this.property.dailyPrice,
        weekend: this.weekendPrice || this.property.dailyPrice,
        holiday: this.holidayPrice,
        festival: this.festivalPrice,
        specialEvents: this.specialEvents
      },
      selfCheckIn: this.selfCheckInEnabled
        ? {
            enabled: true,
            codes: this.checkInCodes.filter((c) => c.code.trim())
          }
        : { enabled: false, codes: [] }
    };

    this.propertyApi.publishProperty(payload as never).subscribe({
      next: ({ message, property }) => {
        this.successMessage = `${message}. Listing ID: ${property.id}. It is now visible first in rental listings.`;
        this.isSubmitting = false;
        this.isSubmitted = true;
      },
      error: (error) => {
        this.errorMessage =
          error?.status === 401
            ? 'Please login before publishing a property.'
            : error?.name === 'TimeoutError'
              ? 'The server is taking too long. Please try again.'
              : error?.error?.message || 'Unable to submit property.';
        this.isSubmitting = false;
        this.isSubmitted = false;
      }
    });
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private isoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private async readValidImages(files: File[]): Promise<string[]> {
    const valid = files.filter((f) => {
      const ok = f.type.startsWith('image/') && f.size <= this.maxUploadImageSizeBytes;
      if (!ok) this.imageError = 'Images must be image files and each must be 5MB or smaller.';
      return ok;
    });
    const images = await Promise.all(valid.map((f) => this.compressImage(f)));
    return images.filter((i): i is string => Boolean(i));
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private async compressImage(file: File): Promise<string> {
    const source = await this.readFileAsDataUrl(file);
    const image  = await this.loadImage(source);
    const scale  = Math.min(1, this.maxImageDimension / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width  = Math.max(1, Math.round(image.width  * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return source;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const q of [0.82, 0.72, 0.62, 0.52]) {
      const c = canvas.toDataURL('image/jpeg', q);
      if (this.estimateDataUrlBytes(c) <= this.targetImageSizeBytes || q === 0.52) return c;
    }
    return source;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to read selected image.'));
      img.src = src;
    });
  }

  private estimateDataUrlBytes(dataUrl: string): number {
    const b64 = dataUrl.split(',')[1] || '';
    return Math.ceil((b64.length * 3) / 4);
  }
}
