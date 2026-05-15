import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { NavbarComponent } from '../components/nav-bar/nav-bar'

@Component({
   selector: 'x-chef',
   templateUrl: './component.html',
   imports: [RouterOutlet, NavbarComponent],
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChefComponent {}
