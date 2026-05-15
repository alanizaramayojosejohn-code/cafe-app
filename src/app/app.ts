import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: 'app.html',
})
export class AppComponent {
  // Inyectado solo para que el servicio se inicialice (aplica clase .dark) al arrancar.
  private _theme = inject(ThemeService)
}
