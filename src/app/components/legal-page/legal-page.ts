import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

type LegalPageKey = 'about' | 'contact' | 'privacy' | 'terms';

const pages: Record<LegalPageKey, { eyebrow: string; title: string; sections: Array<{ title: string; body: string }> }> = {
  about: {
    eyebrow: 'About',
    title: 'Local rental discovery built around useful information',
    sections: [
      {
        title: 'What Unio does',
        body:
          'Unio Rentals helps tenants compare flexible rentals such as hostels, PGs, flats, apartments and villas with clear pricing, facilities, rules and landlord details.'
      },
      {
        title: 'How listings are presented',
        body:
          'Each listing is designed to provide original local context, practical stay details and booking information so users can make a better rental decision before contacting or paying.'
      }
    ]
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Get help with rentals, bookings and listings',
    sections: [
      {
        title: 'Support',
        body:
          'For account, listing or booking support, contact the Unio Rentals team at support@uniorentals.in or use the help page inside the app.'
      },
      {
        title: 'Landlord enquiries',
        body:
          'Property owners can publish rental details from the List property page and keep tenant-facing information accurate, current and useful.'
      }
    ]
  },
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    sections: [
      {
        title: 'Information we use',
        body:
          'Unio Rentals may use account details, booking details, listing details, selected location and optional browser geolocation to provide rental search, booking and listing features.'
      },
      {
        title: 'Advertising and analytics readiness',
        body:
          'If advertising is enabled later, ad partners may use cookies or similar technologies subject to their policies. Users should receive clear consent controls where required by law.'
      },
      {
        title: 'Control',
        body:
          'Users can update account information, avoid optional location access, clear browser storage and contact support for data questions.'
      }
    ]
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Terms of Service',
    sections: [
      {
        title: 'Use of Unio Rentals',
        body:
          'Users agree to provide accurate account, booking and listing information and to use the service only for lawful rental discovery and property listing purposes.'
      },
      {
        title: 'Listings and bookings',
        body:
          'Landlords are responsible for truthful listing details. Tenants should review rent, rules, facilities, dates and landlord contact information before confirming a booking.'
      },
      {
        title: 'Content quality',
        body:
          'Unio aims to publish helpful, original and navigable rental information. Misleading, unsafe, copied or prohibited content may be removed.'
      }
    ]
  }
};

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './legal-page.html',
  styleUrls: ['./legal-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly page = pages[(this.route.snapshot.data['page'] as LegalPageKey) || 'about'];
}
