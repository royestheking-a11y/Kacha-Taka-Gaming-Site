import { User } from '../App';

// Game History Entry
export interface GameHistoryEntry {
  id: string;
  userId: string;
  game: 'crash' | 'mines' | 'slots' | 'dice';
  roundId: string;
  betAmount: number;
  isDemo: boolean;
  result: any;
  winAmount: number;
  multiplier: number;
  serverSeed: string;
  seedHash: string;
  timestamp: string;
}

// Transaction Entry
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  method?: string;
  details?: string;
  timestamp: string;
}

// Message Entry
export interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  reply?: string;
  status: 'open' | 'replied' | 'closed';
  timestamp: string;
}

// Deposit/Withdraw Request
export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  method: string;
  accountDetails?: string;
  transactionId?: string;
  screenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  timestamp: string;
}

// Initialize storage
export function initializeStorage() {
  if (!localStorage.getItem('kachaTaka_users')) {
    // Create default admin user
    const adminUser: User & { password: string } = {
      id: 'admin-001',
      name: 'Super Admin',
      email: 'admin@kachataka.com',
      phone: '+8801700000000',
      password: 'kachataka',
      demoPoints: 100,
      realBalance: 100000,
      isAdmin: true,
      createdAt: new Date().toISOString(),
      kycStatus: 'verified',
      referralCode: 'ADMIN001',
      referralEarnings: 0
    };
    localStorage.setItem('kachaTaka_users', JSON.stringify([adminUser]));
  }
  
  if (!localStorage.getItem('kachaTaka_gameHistory')) {
    localStorage.setItem('kachaTaka_gameHistory', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('kachaTaka_transactions')) {
    localStorage.setItem('kachaTaka_transactions', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('kachaTaka_messages')) {
    localStorage.setItem('kachaTaka_messages', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('kachaTaka_paymentRequests')) {
    localStorage.setItem('kachaTaka_paymentRequests', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('kachaTaka_gameSettings')) {
    const defaultSettings = {
      crash: { enabled: true, minBet: 10, maxBet: 10000, houseFactor: 0.97 },
      mines: { enabled: true, minBet: 10, maxBet: 10000, minMines: 1, maxMines: 24 },
      slots: { enabled: true, minBet: 10, maxBet: 10000, rtp: 0.95 },
      dice: { enabled: true, minBet: 10, maxBet: 10000, houseEdge: 0.02 }
    };
    localStorage.setItem('kachaTaka_gameSettings', JSON.stringify(defaultSettings));
  }
  
  if (!localStorage.getItem('kachaTaka_referrals')) {
    localStorage.setItem('kachaTaka_referrals', JSON.stringify([]));
  }
}

// User operations
export function getAllUsers(): User[] {
  return JSON.parse(localStorage.getItem('kachaTaka_users') || '[]');
}

export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
}

export function updateUserBalance(userId: string, demoPoints?: number, realBalance?: number) {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    if (demoPoints !== undefined) users[userIndex].demoPoints = demoPoints;
    if (realBalance !== undefined) users[userIndex].realBalance = realBalance;
    localStorage.setItem('kachaTaka_users', JSON.stringify(users));
  }
}

// Game history operations
export function addGameHistory(entry: GameHistoryEntry) {
  const history = JSON.parse(localStorage.getItem('kachaTaka_gameHistory') || '[]');
  history.unshift(entry);
  if (history.length > 1000) history.pop(); // Keep last 1000 entries
  localStorage.setItem('kachaTaka_gameHistory', JSON.stringify(history));
}

export function getGameHistory(userId?: string, game?: string): GameHistoryEntry[] {
  let history = JSON.parse(localStorage.getItem('kachaTaka_gameHistory') || '[]');
  if (userId) history = history.filter((h: GameHistoryEntry) => h.userId === userId);
  if (game) history = history.filter((h: GameHistoryEntry) => h.game === game);
  return history;
}

// Transaction operations
export function addTransaction(transaction: Transaction) {
  const transactions = JSON.parse(localStorage.getItem('kachaTaka_transactions') || '[]');
  transactions.unshift(transaction);
  localStorage.setItem('kachaTaka_transactions', JSON.stringify(transactions));
}

export function getTransactions(userId?: string): Transaction[] {
  let transactions = JSON.parse(localStorage.getItem('kachaTaka_transactions') || '[]');
  if (userId) transactions = transactions.filter((t: Transaction) => t.userId === userId);
  return transactions;
}

// Message operations
export function addMessage(message: Message) {
  const messages = JSON.parse(localStorage.getItem('kachaTaka_messages') || '[]');
  messages.unshift(message);
  localStorage.setItem('kachaTaka_messages', JSON.stringify(messages));
}

export function getMessages(userId?: string): Message[] {
  let messages = JSON.parse(localStorage.getItem('kachaTaka_messages') || '[]');
  if (userId) messages = messages.filter((m: Message) => m.userId === userId);
  return messages;
}

export function updateMessage(id: string, updates: Partial<Message>) {
  const messages = JSON.parse(localStorage.getItem('kachaTaka_messages') || '[]');
  const index = messages.findIndex((m: Message) => m.id === id);
  if (index !== -1) {
    messages[index] = { ...messages[index], ...updates };
    localStorage.setItem('kachaTaka_messages', JSON.stringify(messages));
  }
}

// Payment request operations
export function addPaymentRequest(request: PaymentRequest) {
  const requests = JSON.parse(localStorage.getItem('kachaTaka_paymentRequests') || '[]');
  requests.unshift(request);
  localStorage.setItem('kachaTaka_paymentRequests', JSON.stringify(requests));
}

export function getPaymentRequests(status?: string): PaymentRequest[] {
  let requests = JSON.parse(localStorage.getItem('kachaTaka_paymentRequests') || '[]');
  if (status) requests = requests.filter((r: PaymentRequest) => r.status === status);
  return requests;
}

export function updatePaymentRequest(id: string, updates: Partial<PaymentRequest>) {
  const requests = JSON.parse(localStorage.getItem('kachaTaka_paymentRequests') || '[]');
  const index = requests.findIndex((r: PaymentRequest) => r.id === id);
  if (index !== -1) {
    requests[index] = { ...requests[index], ...updates };
    localStorage.setItem('kachaTaka_paymentRequests', JSON.stringify(requests));
  }
}

// Generate unique ID
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Platform Statistics with Fixed Base
export function getPlatformStats() {
  const stored = localStorage.getItem('kachaTaka_platformStats');
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with base values
  const defaultStats = {
    baseActiveUsers: 5000,
    baseDailyWithdrawals: 500000, // 5 lakh BDT
    baseTotalWithdrawn: 2000000, // 20 lakh BDT
    baseGamesPlayed: 35000,
    baseRecentWithdrawals: 50000,
    actualWithdrawals: 0 // Actual user withdrawals in BDT
  };
  localStorage.setItem('kachaTaka_platformStats', JSON.stringify(defaultStats));
  return defaultStats;
}

export function updatePlatformStats(updates: any) {
  const current = getPlatformStats();
  const updated = { ...current, ...updates };
  localStorage.setItem('kachaTaka_platformStats', JSON.stringify(updated));
  return updated;
}

// Global Settings
export function getGlobalSettings() {
  const stored = localStorage.getItem('kachaTaka_globalSettings');
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Default settings
  const defaultSettings = {
    siteName: 'Kacha Taka',
    minimumDepositBDT: 100,
    minimumDepositPoints: 500,
    minimumWithdrawalPoints: 2500,
    minimumWithdrawalBDT: 500,
    referralBonusPoints: 50,
    conversionRate: 5, // 1 BDT = 5 points
    initialDemoPoints: 100
  };
  localStorage.setItem('kachaTaka_globalSettings', JSON.stringify(defaultSettings));
  return defaultSettings;
}

export function updateGlobalSettings(updates: any) {
  const current = getGlobalSettings();
  const updated = { ...current, ...updates };
  localStorage.setItem('kachaTaka_globalSettings', JSON.stringify(updated));
  return updated;
}

// Mask username for public display
export function maskUsername(name: string): string {
  if (name.length <= 2) return '***';
  return '*'.repeat(name.length - 2) + name.slice(-2);
}

// Format currency
export function formatCurrency(points: number): string {
  return `${points.toLocaleString()} pts`;
}

export function formatBDT(points: number): string {
  const bdt = points * 0.20;
  return `৳${bdt.toFixed(2)}`;
}

// Referral system
export function generateReferralCode(userId: string): string {
  const code = userId.slice(-6).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  return code;
}

export function getUserByReferralCode(code: string): User | null {
  const users = getAllUsers();
  return users.find(u => u.referralCode === code) || null;
}

export function getReferrals(userId: string): User[] {
  const users = getAllUsers();
  return users.filter(u => u.referredBy === userId);
}

export function addReferralBonus(referrerId: string, amount: number) {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.id === referrerId);
  if (userIndex !== -1) {
    users[userIndex].referralEarnings = (users[userIndex].referralEarnings || 0) + amount;
    users[userIndex].demoPoints = (users[userIndex].demoPoints || 0) + amount;
    localStorage.setItem('kachaTaka_users', JSON.stringify(users));
    
    // Add transaction
    addTransaction({
      id: generateId('ref-'),
      userId: referrerId,
      type: 'bonus',
      amount: amount,
      status: 'completed',
      details: 'Referral bonus',
      timestamp: new Date().toISOString()
    });
  }
}

// Game Settings
export function getGameSettings() {
  return JSON.parse(localStorage.getItem('kachaTaka_gameSettings') || '{}');
}

export function updateGameSettings(settings: any) {
  localStorage.setItem('kachaTaka_gameSettings', JSON.stringify(settings));
}

export function getGameStats() {
  const history = getGameHistory();
  const stats = {
    crash: { totalBets: 0, totalWagered: 0, totalWon: 0, totalPlayers: new Set() },
    mines: { totalBets: 0, totalWagered: 0, totalWon: 0, totalPlayers: new Set() },
    slots: { totalBets: 0, totalWagered: 0, totalWon: 0, totalPlayers: new Set() },
    dice: { totalBets: 0, totalWagered: 0, totalWon: 0, totalPlayers: new Set() }
  };
  
  history.forEach((entry: GameHistoryEntry) => {
    if (stats[entry.game]) {
      stats[entry.game].totalBets++;
      stats[entry.game].totalWagered += entry.betAmount;
      stats[entry.game].totalWon += entry.winAmount;
      stats[entry.game].totalPlayers.add(entry.userId);
    }
  });
  
  return {
    crash: { ...stats.crash, totalPlayers: stats.crash.totalPlayers.size },
    mines: { ...stats.mines, totalPlayers: stats.mines.totalPlayers.size },
    slots: { ...stats.slots, totalPlayers: stats.slots.totalPlayers.size },
    dice: { ...stats.dice, totalPlayers: stats.dice.totalPlayers.size }
  };
}