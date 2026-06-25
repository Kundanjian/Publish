import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';
import { ApiBooking } from '../../core/models/api.models';
import { PropertyApiService } from '../../core/services/property-api.service';
import { orderItems } from '../../data/market-data';
import {
  AuthApiService,
  OrderUtilityMode,
  OrderUtilitySection
} from '../../core/services/auth-api.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit {
  private readonly propertyApi = inject(PropertyApiService);
  private readonly authService = inject(AuthApiService);
  
  readonly orders = orderItems;
  bookings: ApiBooking[] = [];
  loadError = '';
  activeMode: OrderUtilityMode = 'RENTEE';
  sections: OrderUtilitySection[] = [];
  loading = false;
  errorMessage = '';

  readonly modeOptions: Array<{ key: OrderUtilityMode; label: string }> = [
    { key: 'LANDLORD', label: 'As Landlord' },
    { key: 'RENTEE', label: 'As Rentee' }
  ];

  ngOnInit(): void {
    this.loadUtilities();
  }

  switchMode(mode: OrderUtilityMode): void {
    if (this.activeMode === mode || this.loading) {
      return;
    }

    this.activeMode = mode;
    this.loadUtilities();
  }

  private loadUtilities(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService
      .getOrderUtilities(this.activeMode)
      .pipe(
        timeout(7000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.sections = response.sections;
          this.activeMode = response.mode;
        },
        error: (error: unknown) => {
          this.sections = [];
          this.errorMessage = this.extractError(error);
        }
      });
  }

  private extractError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Backend service is not reachable. Please ensure backend is running on port 5003.';
      }

      return error.error?.message ?? 'Unable to load order utilities right now.';
    }

    return 'Request timed out quickly. Please try again.';
  }
}

export { MyOrdersComponent as MyOrders };
