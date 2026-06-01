import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminDashboardResponse,
  AuthApiService,
  DashboardResponse
} from '../../core/services/auth-api.service';
import { PropertyApiService } from '../../core/services/property-api.service';
import { RentalListing } from '../../data/market-data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthApiService);
  private readonly propertyApi = inject(PropertyApiService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  isFetchingDashboard = false;
  errorMessage = '';
  dashboardMessage = '';
  totalUsers: number | null = null;
  totalAdmins: number | null = null;
  totalProperties: number | null = null;
  pendingProperties: number | null = null;
  confirmedBookings: number | null = null;
  paidRevenue: number | null = null;
  myListings: RentalListing[] = [];
  listingError = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private loadDashboard(): void {
    this.isFetchingDashboard = true;
    this.errorMessage = '';

    this.authService
      .getDashboardData()
      .pipe(
        finalize(() => {
          this.isFetchingDashboard = false;
        })
      )
      .subscribe({
        next: (response: DashboardResponse) => {
          this.dashboardMessage = response.message;
          if ('stats' in response) {
            this.totalUsers = (response as AdminDashboardResponse).stats.totalUsers;
            this.totalAdmins = (response as AdminDashboardResponse).stats.totalAdmins;
            this.totalProperties = (response as AdminDashboardResponse).stats.totalProperties ?? null;
            this.pendingProperties = (response as AdminDashboardResponse).stats.pendingProperties ?? null;
            this.confirmedBookings = (response as AdminDashboardResponse).stats.confirmedBookings ?? null;
            this.paidRevenue = (response as AdminDashboardResponse).stats.paidRevenue ?? null;
          } else {
            this.totalUsers = null;
            this.totalAdmins = null;
            this.totalProperties = null;
            this.pendingProperties = null;
            this.confirmedBookings = null;
            this.paidRevenue = null;
          }
        },
        error: () => {
          this.authService.logout();
          this.errorMessage = 'Session expired. Please login again.';
          this.router.navigate(['/login']);
        }
      });

    this.propertyApi.getMyProperties().subscribe({
      next: (listings) => {
        this.myListings = listings;
      },
      error: () => {
        this.listingError = 'Your published listings could not be loaded right now.';
      }
    });
  }
}
