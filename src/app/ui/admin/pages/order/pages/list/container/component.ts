import { Component, inject, signal, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { AsyncPipe, DatePipe } from '@angular/common'
import { OrderService } from '../../../../../../../services/order/order.service'
import { Order } from '../../../../../../../models/order.model'
import { Observable } from 'rxjs'
import { ProductService } from '../../../../../../../services/product/product.service'
import { TableService } from '../../../../../../../services/order/table.service'
import { CategoryService } from '../../../../../../../services/category/category.service'
import { FileValidationService } from '../../../../../../../services/product/validation.service'
import { ImageCompressionService } from '../../../../../../../services/product/compression.service'
import { StorageService } from '../../../../../../../services/storage/storage.service'
import { ProductRepositoryService } from '../../../../../../../services/product/product-repository.service'

@Component({
   selector: 'app-orders-list',
   imports: [AsyncPipe, DatePipe],
   providers: [
      ProductService,
      TableService,
      OrderService,
      CategoryService,
      FileValidationService,
      ImageCompressionService,
      StorageService,
      ProductRepositoryService,
   ],
   templateUrl: './component.html',
})
export default class OrdersListComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  orders$!: Observable<Order[]>;
  selectedStatus = signal<'all' | 'pendiente' | 'preparando'>('all');

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orders$ = this.orderService.getOrders();
  }

  filterOrders(orders: Order[] | null): Order[] {
    if (!orders) return [];

    const status = this.selectedStatus();
    if (status === 'all') {
      return orders.filter(o => o.status === 'pendiente' || o.status === 'preparando');
    }
    return orders.filter(o => o.status === status);
  }

  getOrderSummary(order: Order): string {
    const items = order.items.map(item => `${item.quantity} ${item.product.name}`);
    const summary = items.join(', ');

    if (summary.length > 50) {
      return summary.substring(0, 50) + '......';
    }
    return summary;
  }

  selectOrder(orderId: string) {
    this.router.navigate([orderId, 'payment'], { relativeTo: this.route });
  }

  setFilter(status: 'all' | 'pendiente' | 'preparando') {
    this.selectedStatus.set(status);
  }
}
