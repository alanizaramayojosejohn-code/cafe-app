import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
@Component({
   selector: 'app-navbar-options',
   standalone: true,
   imports: [CommonModule, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule],
   templateUrl: './navbar-options.html',
   styleUrls: ['./navbar-options.css'],
})
export class NavbarOptionsComponent {
   menuItems = [
      { label: 'Inicio', icon: 'home', route: '/admin/home' },
      { label: 'Productos', icon: 'shopping_cart', route: '/admin/productos' },
      { label: 'Perfil', icon: 'person', route: '/profile' },
      { label: 'Venta', icon: 'shopping_cart', route: '/admin/sale' },
      { label: 'Ordenes', icon: 'dollar', route: '/profile/ordenes' },
   ]
}
