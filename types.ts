export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING', // Payment is due but within grace period or promise made
  OVERDUE = 'OVERDUE', // Payment is late
  EXEMPT = 'EXEMPT' // Crossmark - no message sent
}

export interface Student {
  id: string;
  name: string;
  parentName: string;
  parentPhone: string; // Format: 919876543210 (No +)
  joiningDate: string; // ISO Date YYYY-MM-DD
  monthlyFee: number;
  status: PaymentStatus;
  lastPaymentDate?: string;
  nextDueDate?: string; // Computed or manually set
  notes?: string;
}

export interface GeneratedMessage {
  studentId: string;
  text: string;
  targetPhone: string;
  type: 'RECEIPT' | 'REMINDER' | 'WARNING';
}

export interface ActionLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  method: 'MANUAL' | 'AI_AUTO';
  syncedToSheet: boolean;
}

export interface SheetConfig {
  clientId: string;
  spreadsheetId: string;
  isConnected: boolean;
}