import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiBooking } from '../../core/models/api.models';
import { PropertyApiService } from '../../core/services/property-api.service';
import { orderItems } from '../../data/market-data';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit {
  private readonly propertyApi = inject(PropertyApiService);
  readonly orders = orderItems;
  bookings: ApiBooking[] = [];
  loadError = '';

  ngOnInit(): void {
    this.propertyApi.getBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
      },
      error: () => {
        this.loadError = 'Showing demo orders because live bookings could not be loaded.';
      }
    });
  }
}

export { MyOrdersComponent as MyOrders };
