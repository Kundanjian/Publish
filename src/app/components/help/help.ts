import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { helpTopics } from '../../data/market-data';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help.html',
  styleUrls: ['./help.css']
})
export class HelpComponent {
  readonly topics = helpTopics;
}

export { HelpComponent as Help };
