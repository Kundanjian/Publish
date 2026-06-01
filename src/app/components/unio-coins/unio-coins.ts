import { Component } from '@angular/core';

@Component({
  selector: 'app-unio-coins',
  standalone: true,
  templateUrl: './unio-coins.html',
  styleUrls: ['./unio-coins.css']
})
export class UnioCoinsComponent {
  readonly coins = 250;
}

export { UnioCoinsComponent as UnioCoins };
