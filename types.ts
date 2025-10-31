export type Currency = 'VND' | 'USD';

export enum TransactionType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
  PROFIT = 'profit',
  TOPUP = 'topup',
  WITHDRAWAL = 'withdrawal',
  LOAN = 'loan',
  // FIX: Renamed from LUCKY_MONMONEY to LUCKY_MONEY to fix typo and match usage.
  LUCKY_MONEY = 'lucky_money',
  COIN = 'coin',
  BILL_PAYMENT = 'bill_payment',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  recipient?: string;
  sender?: string;
  category?: string;
}

export interface User {
  name: string;
  avatarUrl: string;
  walletId: string; // Will be the 16-digit card number
  gender: 'Nam' | 'Nữ' | 'Khác';
  issueDate: string;
  expiryDate: string;
  coinBalance: number;
}

export interface SavingsGoal {
  name: string;
  targetAmount: number;
  imageUrl?: string;
}

export interface DefaultMessage {
  text: string;
  icon?: string;
}

// New type for linked bank accounts
export interface LinkedBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  logoUrl: string;
}


// New types for Chatbot
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}

export interface Loan {
    id: string;
    name: string;
    description: string;
    interestRate: number; // Annual rate
    maxAmount: number;
    minTerm: number; // in months
    maxTerm: number; // in months
    minCreditScore: number;
    provider: string;
    criteria: string[];
    terms: string[];
    tag?: 'Ngắn Hạn' | 'Trong Ngày';
}

// New type for recurring transactions
export interface RecurringTransaction {
  id: string;
  templateTransactionId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isActive: boolean;
  // Store a copy of the details for easy display and processing
  amount: number;
  description: string;
  recipient?: string;
  type: TransactionType.OUTGOING; // Recurring is only for outgoing
  category?: string;
}

// New types for Lucky Money
export interface Claim {
  userId: string;
  userName: string;
  userAvatar: string;
  amount: number;
  claimDate: string;
}

export interface LuckyMoneyPacket {
  id: string;
  shareId: string;
  creatorUserId: string;
  creatorName: string;
  creatorAvatar: string;
  totalAmount: number;
  quantity: number;
  type: 'equal' | 'random';
  message: string;
  claims: Claim[];
  creationDate: string;
  isAnonymous: boolean;
}

// New types for Rewards System
export interface RewardTask {
  id: string;
  title: string;
  description: string;
  coins: number;
  targetCount: number;
  currentCount: number;
  lastResetDate: string; // ISO Date YYYY-MM-DD
}

export interface Voucher {
  id: string;
  merchantName: string;
  merchantLogo: string;
  description: string;
  coinCost: number;
}

export interface UserVoucher {
  id: string;
  voucherId: string;
  merchantName: string;
  merchantLogo: string;
  description: string;
  code: string;
  expiryDate: string;
  isUsed: boolean;
}