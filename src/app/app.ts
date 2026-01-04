import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav style="padding: 20px; background: #f5f5f5; margin-bottom: 20px;">
      <a routerLink="/categories-rtdb" routerLinkActive="active" style="margin-right: 20px;">
        Realtime Database
      </a>
      <a routerLink="/categories-firestore" routerLinkActive="active" style="margin-right: 20px;">
        Firestore Default
      </a>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [
    `
      a {
        text-decoration: none;
        color: #333;
        padding: 8px 16px;
        border-radius: 4px;
      }
      a:hover {
        background: #ddd;
      }
      a.active {
        background: #4caf50;
        color: white;
      }
    `,
  ],
})
export class AppComponent {}
