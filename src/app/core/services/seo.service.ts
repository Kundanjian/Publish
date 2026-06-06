import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

type SeoRouteData = {
  title?: string;
  description?: string;
  canonical?: string;
  schemaType?: 'WebSite' | 'CollectionPage' | 'AboutPage' | 'ContactPage' | 'PrivacyPolicy' | 'TermsOfService';
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly siteName = 'Unio Rentals';
  private readonly defaultDescription =
    'Find verified hostels, PGs, flats, apartments and villas for daily, weekly or monthly rent with direct landlord details on Unio Rentals.';

  init(): void {
    this.applyCurrentRoute();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.applyCurrentRoute());
  }

  private applyCurrentRoute(): void {
    const data = this.deepestRouteData();
    const url = this.router.url.split('#')[0] || '/';
    const title = data.title || 'Unio Rentals | Flexible hostels, flats and apartments';
    const description = data.description || this.defaultDescription;
    const canonical = data.canonical || url.split('?')[0] || '/';

    this.title.setTitle(title);
    this.setTag('name', 'description', description);
    this.setTag('name', 'robots', 'index, follow, max-image-preview:large');
    this.setTag('property', 'og:title', title);
    this.setTag('property', 'og:description', description);
    this.setTag('property', 'og:url', canonical);
    this.setTag('name', 'twitter:title', title);
    this.setTag('name', 'twitter:description', description);
    this.setCanonical(canonical);
    this.setJsonLd(data, canonical, title, description);
  }

  private deepestRouteData(): SeoRouteData {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.data as SeoRouteData;
  }

  private setTag(attribute: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attribute]: key, content });
  }

  private setCanonical(path: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      head.appendChild(link);
    }
    link.href = path;
  }

  private setJsonLd(data: SeoRouteData, url: string, title: string, description: string): void {
    const id = 'unio-route-schema';
    this.document.getElementById(id)?.remove();

    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': data.schemaType || 'WebSite',
      name: this.siteName,
      headline: title,
      description,
      url,
      publisher: {
        '@type': 'Organization',
        name: this.siteName,
        logo: '/unio-logo.png'
      }
    });
    this.document.head.appendChild(script);
  }
}
