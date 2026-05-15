import { Timestamp } from '@angular/fire/firestore'

export type UserRole = 'admin' | 'cajero' | 'cocinero'
export type SalaryPeriod = 'mensual' | 'quincenal' | 'semanal'

export interface AppUser {
   id: string
   email: string
   displayName: string
   role: UserRole
   isActive: boolean
   salary: number
   salaryPeriod: SalaryPeriod
   claimedAt?: Timestamp
   createdAt: Timestamp
   updatedAt: Timestamp
}

export interface PendingUser {
   id: string
   email: string
   displayName: string
   role: UserRole
   isActive: boolean
   salary: number
   salaryPeriod: SalaryPeriod
   invitedAt: Timestamp
   invitedBy: string
}

export type PaymentType = 'pago' | 'descuento'

export interface Payment {
   id: string
   type: PaymentType
   amount: number
   paidAt: Timestamp
   periodStart: Timestamp
   periodEnd: Timestamp
   reason?: string
   note?: string
   createdBy: string
}

export interface UserCreate extends Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'> { }
export interface PendingUserCreate extends Omit<PendingUser, 'id' | 'invitedAt'> { }
export interface PaymentCreate extends Omit<Payment, 'id'> { }
