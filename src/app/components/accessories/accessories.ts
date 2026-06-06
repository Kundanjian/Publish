import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { accessoryItems } from '../../data/market-data';

@Component({
  selector: 'app-accessories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accessories.html',
  styleUrls: ['./accessories.css']
})
export class AccessoriesComponent {
  readonly accessories = accessoryItems;
}
