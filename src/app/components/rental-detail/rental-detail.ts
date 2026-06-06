import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyApiService } from '../../core/services/property-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import {
  facilityList,
  feedbackNotes,
  landlordRules,
  rentalListings
} from '../../data/market-data';

@Component({
  selector: 'app-rental-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './rental-detail.html',
  styleUrls: ['./rental-detail.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RentalDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly propertyApi = inject(PropertyApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  listing = rentalListings[0];
  readonly relatedListings = rentalListings.slice(0, 4);
  readonly landlordRules = landlordRules;
  readonly facilities = facilityList;
  readonly feedbackNotes = feedbackNotes;
  private readonly starCache = new Map<number, boolean[]>();
  bookingForm = {
    tenantName: 'Demo Tenant',
    tenantEmail: 'tenant@unio.test',
    startDate: this.toDateInput(new Date()),
    endDate: this.toDateInput(new Date(Date.now() + 3 * 86_400_000))
  };
  bookingMessage = '';
  bookingError = '';
  isBooking = false;
  confirmedBooking:
    | {
        id: string;
        amount: number;
        invoiceNo: string;
        landlordContact: { name: string; phone: string; email: string };
      }
    | null = null;

  ngOnInit(): void {
    const currentUser = this.authApi.currentUser();
    if (currentUser) {
      this.bookingForm = {
        ...this.bookingForm,
        tenantName: currentUser.name,
        tenantEmail: currentUser.email
      };
    }

    const routeId = this.route.snapshot.paramMap.get('id');
    const localListing = rentalListings.find((item) => item.id === routeId);

    if (localListing) {
      this.listing = localListing;
    }

    if (routeId && /^\d+$/.test(routeId)) {
      this.propertyApi.getPropertyById(routeId).subscribe({
        next: (property) => {
          this.listing = property;
          this.changeDetector.markForCheck();
        }
      });
    }
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

  get selectedDurationDays(): number {
    const start = new Date(this.bookingForm.startDate).getTime();
    const end = new Date(this.bookingForm.endDate).getTime();
    const days = Math.ceil((end - start) / 86_400_000) + 1;
    return Number.isFinite(days) && days > 0 ? days : 0;
  }

  get estimatedAmount(): number {
    const days = this.selectedDurationDays;

    if (!days) {
      return 0;
    }

    if (days >= 28) {
      return Math.ceil(days / 30) * this.listing.price;
    }

    if (days >= 7) {
      return Math.ceil(days / 7) * (this.listing.weeklyPrice || this.listing.dailyPrice * 6);
    }

    return days * this.listing.dailyPrice;
  }

  confirmQuickRent(form: NgForm): void {
    this.bookingError = '';
    this.bookingMessage = '';
    this.confirmedBooking = null;

    if (form.invalid) {
      form.form.markAllAsTouched();
      this.bookingError = 'Please correct the highlighted fields.';
      return;
    }

    if (!this.selectedDurationDays) {
      this.bookingError = 'Please select valid check-in and check-out dates.';
      return;
    }

    this.isBooking = true;
    this.propertyApi
      .createBooking({
        propertyId: Number(this.listing.id),
        tenantName: this.bookingForm.tenantName,
        tenantEmail: this.bookingForm.tenantEmail,
        startDate: this.bookingForm.startDate,
        endDate: this.bookingForm.endDate
      })
      .subscribe({
        next: ({ message, booking }) => {
          this.bookingMessage = message;
          this.confirmedBooking = {
            id: booking.id,
            amount: booking.amount,
            invoiceNo: booking.invoiceNo,
            landlordContact: booking.landlordContact
          };
          this.isBooking = false;
          this.changeDetector.markForCheck();
        },
        error: (error) => {
          this.bookingError =
            error?.status === 401
              ? 'Please login before confirming a booking.'
              : error?.error?.message || 'Unable to confirm booking right now.';
          this.isBooking = false;
          this.changeDetector.markForCheck();
        }
      });
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
