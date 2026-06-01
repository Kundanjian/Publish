import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home').then((m) => m.HomeComponent),
    data: {
      title: 'Unio Rentals | Flexible hostels, PGs, flats and apartments',
      description:
        'Search direct landlord rentals in Jabalpur and nearby cities. Compare hostels, PGs, flats, apartments and villas for daily, weekly or monthly stays.',
      canonical: '/',
      schemaType: 'WebSite'
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then((m) => m.LoginComponent),
    data: {
      title: 'Log in | Unio Rentals',
      description: 'Log in to manage bookings, rentals and landlord listings on Unio Rentals.',
      canonical: '/login'
    }
  },
  {
    path: 'admin-login',
    loadComponent: () => import('./components/admin-login/admin-login').then((m) => m.AdminLoginComponent),
    data: {
      title: 'Admin login | Unio Rentals',
      description: 'Secure admin login for Unio Rentals operations.',
      canonical: '/admin-login'
    }
  },
  {
    path: 'signup',
    loadComponent: () => import('./components/signup/signup').then((m) => m.SignupComponent),
    data: {
      title: 'Create account | Unio Rentals',
      description: 'Create a Unio Rentals account to book stays and publish property listings.',
      canonical: '/signup'
    }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
    data: {
      title: 'Dashboard | Unio Rentals',
      description: 'Manage your Unio Rentals profile, bookings and listings.',
      canonical: '/dashboard'
    }
  },
  {
    path: 'quick-rent',
    loadComponent: () => import('./components/quick-rent/quick-rent').then((m) => m.QuickRentComponent),
    data: {
      title: 'Quick rent accommodation | Unio Rentals',
      description:
        'Browse flexible hostels, PGs, flats, apartments and villas with direct landlord pricing and quick booking.',
      canonical: '/quick-rent',
      schemaType: 'CollectionPage'
    }
  },
  {
    path: 'publish-property',
    loadComponent: () =>
      import('./components/publish-property/publish-property').then((m) => m.PublishPropertyComponent),
    canActivate: [authGuard],
    data: {
      title: 'List your property | Unio Rentals',
      description:
        'Publish a room, PG, hostel, flat, apartment or villa for verified rental discovery on Unio.',
      canonical: '/publish-property'
    }
  },
  {
    path: 'accessories',
    loadComponent: () => import('./components/accessories/accessories').then((m) => m.AccessoriesComponent),
    data: {
      title: 'Rental accessories | Unio Rentals',
      description: 'Explore rental accessories and move-in essentials for tenants.',
      canonical: '/accessories'
    }
  },
  {
    path: 'rentals/:id',
    loadComponent: () => import('./components/rental-detail/rental-detail').then((m) => m.RentalDetailComponent),
    data: {
      title: 'Rental details | Unio Rentals',
      description: 'Review property facilities, rules, pricing and landlord details before booking.',
      canonical: '/quick-rent'
    }
  },
  {
    path: 'orders',
    loadComponent: () => import('./components/my-orders/my-orders').then((m) => m.MyOrdersComponent),
    canActivate: [authGuard],
    data: {
      title: 'My orders | Unio Rentals',
      description: 'View your Unio Rentals booking orders and invoices.',
      canonical: '/orders'
    }
  },
  {
    path: 'coins',
    loadComponent: () => import('./components/unio-coins/unio-coins').then((m) => m.UnioCoinsComponent),
    canActivate: [authGuard],
    data: {
      title: 'Unio Coins | Unio Rentals',
      description: 'Track Unio Coins rewards and account benefits.',
      canonical: '/coins'
    }
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
    data: {
      title: 'Settings | Unio Rentals',
      description: 'Customize your Unio Rentals account and display preferences.',
      canonical: '/settings'
    }
  },
  {
    path: 'help',
    loadComponent: () => import('./components/help/help').then((m) => m.HelpComponent),
    data: {
      title: 'Help | Unio Rentals',
      description: 'Get help with searching, booking and publishing rentals on Unio.',
      canonical: '/help'
    }
  },
  {
    path: 'about',
    loadComponent: () => import('./components/legal-page/legal-page').then((m) => m.LegalPageComponent),
    data: {
      page: 'about',
      title: 'About Unio Rentals',
      description:
        'Learn how Unio Rentals helps tenants and landlords connect through useful, local rental information.',
      canonical: '/about',
      schemaType: 'AboutPage'
    }
  },
  {
    path: 'contact',
    loadComponent: () => import('./components/legal-page/legal-page').then((m) => m.LegalPageComponent),
    data: {
      page: 'contact',
      title: 'Contact Unio Rentals',
      description: 'Contact Unio Rentals for support, listing questions and rental booking help.',
      canonical: '/contact',
      schemaType: 'ContactPage'
    }
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./components/legal-page/legal-page').then((m) => m.LegalPageComponent),
    data: {
      page: 'privacy',
      title: 'Privacy Policy | Unio Rentals',
      description: 'Read the Unio Rentals privacy policy for account, location, booking and listing data.',
      canonical: '/privacy-policy',
      schemaType: 'PrivacyPolicy'
    }
  },
  {
    path: 'terms',
    loadComponent: () => import('./components/legal-page/legal-page').then((m) => m.LegalPageComponent),
    data: {
      page: 'terms',
      title: 'Terms of Service | Unio Rentals',
      description: 'Read the terms for using Unio Rentals tenant booking and landlord listing services.',
      canonical: '/terms',
      schemaType: 'TermsOfService'
    }
  },
  { path: '**', redirectTo: '' }
];
