import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { LocationPermissionComponent } from './components/location-permission/location-permission';
<<<<<<< HEAD
import { SeoService } from './core/services/seo.service';
=======
import { PwaInstallService } from './core/services/pwa-install.service';
>>>>>>> 7f9ea7109b049d12a3c0d98ac96604b20594d1a6

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavbarComponent, LocationPermissionComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
<<<<<<< HEAD
export class AppComponent implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.init();
  }
}

export { AppComponent as App };
=======
export class AppComponent {
  constructor(pwaInstallService: PwaInstallService) {
    pwaInstallService.init();
  }
}
>>>>>>> 7f9ea7109b049d12a3c0d98ac96604b20594d1a6
