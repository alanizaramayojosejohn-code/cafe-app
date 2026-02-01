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
      { label: 'Productos', icon: 'inventory_2', route: '/admin/productos' },
      { label: 'Perfil', icon: 'person', route: '/admin/profile' },
      { label: 'Ventas', icon: 'shopping_cart', route: '/admin/sale' },
      { label: 'Ordenes', icon: 'receipt', route: '/admin/ordenes' },
   ]
}
// bar_chart

// pie_chart

// show_chart

// table_chart

// analytics

// assessment
// shopping_cart

// shopping_bag

// payment

// credit_card

// receipt

// price_check
