import { Component, OnInit, inject } from '@angular/core';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  selector: 'app-unio-coins',
  standalone: true,
  templateUrl: './unio-coins.html',
  styleUrls: ['./unio-coins.css']
})
export class UnioCoinsComponent implements OnInit {
  private readonly authService = inject(AuthApiService);

  coins = 0;

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.coins = user?.unioCoins ?? 0;

    if (this.authService.isLoggedIn()) {
      this.authService.syncProfile().subscribe((profile) => {
        this.coins = profile?.unioCoins ?? this.coins;
      });
    }
  }
}

export { UnioCoinsComponent as UnioCoins };
