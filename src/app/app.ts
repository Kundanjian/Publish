import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { LocationPermissionComponent } from './components/location-permission/location-permission';
import { SeoService } from './core/services/seo.service';
import { PwaInstallService } from './core/services/pwa-install.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavbarComponent, LocationPermissionComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly pwaInstall = inject(PwaInstallService);

  ngOnInit(): void {
    this.seo.init();
    this.pwaInstall.init();
  }
}
