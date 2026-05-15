import { Injectable, inject } from '@angular/core'
import {
   Firestore,
   collection,
   collectionData,
   addDoc,
   doc,
   deleteDoc,
   query,
   orderBy,
   Timestamp,
} from '@angular/fire/firestore'
import { Observable } from 'rxjs'
import { Payment, PaymentCreate } from '../../models/user.model'

@Injectable({
   providedIn: 'root',
})
export class PaymentService {
   private firestore = inject(Firestore)

   getPaymentsForUser(uid: string): Observable<Payment[]> {
      const col = collection(this.firestore, `users/${uid}/payments`)
      const q = query(col, orderBy('paidAt', 'desc'))
      return collectionData(q, { idField: 'id' }) as Observable<Payment[]>
   }

   async createPayment(uid: string, data: PaymentCreate): Promise<void> {
      const col = collection(this.firestore, `users/${uid}/payments`)
      await addDoc(col, {
         type: data.type ?? 'pago',
         amount: data.amount,
         paidAt: data.paidAt ?? Timestamp.now(),
         periodStart: data.periodStart,
         periodEnd: data.periodEnd,
         reason: data.reason ?? '',
         note: data.note ?? '',
         createdBy: data.createdBy,
      })
   }

   async deletePayment(uid: string, paymentId: string): Promise<void> {
      await deleteDoc(doc(this.firestore, `users/${uid}/payments/${paymentId}`))
   }
}
