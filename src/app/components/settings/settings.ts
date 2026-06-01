import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { settingGroups } from '../../data/market-data';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css']
})
export class SettingsComponent {
  readonly settings = settingGroups;
}

export { SettingsComponent as Settings };
