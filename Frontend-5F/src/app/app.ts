import { Component, signal } from '@angular/core';
import { Base } from './base/base';

@Component({
  selector: 'app-root',
  imports: [Base],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Frontend-5F');
}
