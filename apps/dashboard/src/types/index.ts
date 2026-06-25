export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface DimaCoinAccount {
  guildId: string;
  userId: string;
  wallet: string;
  bank: string;
  totalEarned: string;
  totalSpent: string;
  trustScore: number;
}

export interface DimaCoinTransaction {
  id: string;
  transactionId: string;
  type: string;
  amount: string;
  fee: string;
  createdAt: string;
}
