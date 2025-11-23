// MongoDB-backed storage using API
// This file replaces localStorage operations with API calls
import api from './api.js';
import { User } from '../App';

// Keep interfaces for compatibility
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

export interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  reply?: string;
  status: 'open' | 'replied' | 'closed';
  timestamp: string;
}

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

// Initialize storage - no longer needed but kept for compatibility
export async function initializeStorage() {
  return Promise.resolve();
}

// Transform MongoDB document to app format
function transformDoc(doc: any) {
  if (!doc) return null;
  
  // Handle both MongoDB document format and plain object format
  const docObj = doc.toJSON ? doc.toJSON() : doc;
  
  return {
    id: docObj._id?.toString() || docObj.id?.toString() || docObj.id,
    ...docObj,
    timestamp: docObj.createdAt || docObj.timestamp || new Date().toISOString(),
  };
}

// Transform MongoDB user to app format
function transformUser(user: any): User {
  if (!user) return null as any;
  
  // Handle both MongoDB document format and plain object format
  const userObj = user.toJSON ? user.toJSON() : user;
  
  return {
    id: userObj._id?.toString() || userObj.id?.toString() || userObj.id,
    name: userObj.name || '',
    email: userObj.email || '',
    phone: userObj.phone || '',
    demoPoints: Number(userObj.demoPoints) || 0,
    realBalance: Number(userObj.realBalance) || 0,
    isAdmin: Boolean(userObj.isAdmin) || false,
    createdAt: userObj.createdAt || userObj.timestamp || new Date().toISOString(),
    kycStatus: userObj.kycStatus || 'pending',
    referralCode: userObj.referralCode || undefined,
    referredBy: userObj.referredBy?.toString() || userObj.referredBy || '',
    referralEarnings: Number(userObj.referralEarnings) || 0,
    lastDailySpin: userObj.lastDailySpin || undefined,
  };
}

// User operations
export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await api.users.getAll();
    return users.map(transformUser);
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await api.users.getById(id);
    return transformUser(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function updateUserBalance(userId: string, demoPoints?: number, realBalance?: number) {
  try {
    await api.users.updateBalance(userId, demoPoints, realBalance);
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
}

// Game history operations
export async function addGameHistory(entry: Omit<GameHistoryEntry, 'id' | 'timestamp'>) {
  try {
    const result = await api.games.addHistory(entry);
    return transformDoc(result);
  } catch (error) {
    console.error('Error adding game history:', error);
    throw error;
  }
}

export async function getGameHistory(userId?: string, game?: string): Promise<GameHistoryEntry[]> {
  try {
    const history = await api.games.getHistory(game, 1000);
    let filtered = history;
    
    if (userId) {
      filtered = filtered.filter((h: any) => 
        (h.userId?._id || h.userId)?.toString() === userId
      );
    }
    
    return filtered.map((h: any) => ({
      ...transformDoc(h),
      userId: h.userId?._id?.toString() || h.userId?.toString() || h.userId,
    }));
  } catch (error) {
    console.error('Error fetching game history:', error);
    return [];
  }
}

// Transaction operations
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>) {
  try {
    const result = await api.transactions.add(transaction);
    return transformDoc(result);
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
}

export async function getTransactions(userId?: string): Promise<Transaction[]> {
  try {
    const transactions = await api.transactions.getAll(userId);
    return transactions.map((t: any) => ({
      ...transformDoc(t),
      userId: t.userId?._id?.toString() || t.userId?.toString() || t.userId,
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// Message operations
export async function addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
  try {
    const result = await api.messages.add(message);
    return transformDoc(result);
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

export async function getMessages(userId?: string): Promise<Message[]> {
  try {
    const messages = await api.messages.getAll();
    let filtered = messages;
    
    if (userId) {
      filtered = filtered.filter((m: any) => 
        (m.userId?._id || m.userId)?.toString() === userId
      );
    }
    
    return filtered.map((m: any) => ({
      ...transformDoc(m),
      userId: m.userId?._id?.toString() || m.userId?.toString() || m.userId,
      userName: m.userName || m.userId?.name,
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function updateMessage(id: string, updates: Partial<Message>) {
  try {
    const result = await api.messages.update(id, updates);
    return transformDoc(result);
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
}

// Payment request operations
export async function addPaymentRequest(request: Omit<PaymentRequest, 'id' | 'timestamp'>) {
  try {
    const result = await api.payments.add(request);
    return transformDoc(result);
  } catch (error) {
    console.error('Error adding payment request:', error);
    throw error;
  }
}

export async function getPaymentRequests(status?: string): Promise<PaymentRequest[]> {
  try {
    const requests = await api.payments.getAll(status);
    return requests.map((r: any) => ({
      ...transformDoc(r),
      userId: r.userId?._id?.toString() || r.userId?.toString() || r.userId,
      userName: r.userName || r.userId?.name,
    }));
  } catch (error) {
    console.error('Error fetching payment requests:', error);
    return [];
  }
}

export async function updatePaymentRequest(id: string, updates: Partial<PaymentRequest>) {
  try {
    const result = await api.payments.update(id, updates);
    return transformDoc(result);
  } catch (error) {
    console.error('Error updating payment request:', error);
    throw error;
  }
}

export async function deletePaymentRequest(id: string) {
  try {
    await api.payments.delete(id);
  } catch (error) {
    console.error('Error deleting payment request:', error);
    throw error;
  }
}

// Generate unique ID (for compatibility)
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Platform Statistics
export async function getPlatformStats() {
  try {
    return await api.settings.getPlatformStats();
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return {
      baseActiveUsers: 5000,
      baseDailyWithdrawals: 500000,
      baseTotalWithdrawn: 2000000,
      baseGamesPlayed: 35000,
      baseRecentWithdrawals: 50000,
      actualWithdrawals: 0
    };
  }
}

export async function updatePlatformStats(updates: any) {
  try {
    const current = await getPlatformStats();
    const updated = { ...current, ...updates };
    await api.settings.updatePlatformStats(updated);
    return updated;
  } catch (error) {
    console.error('Error updating platform stats:', error);
    throw error;
  }
}

// Global Settings
export async function getGlobalSettings() {
  try {
    return await api.settings.getGlobalSettings();
  } catch (error) {
    console.error('Error fetching global settings:', error);
    return {
      siteName: 'Kacha Taka',
      minimumDepositBDT: 100,
      minimumDepositPoints: 500,
      minimumWithdrawalPoints: 2500,
      minimumWithdrawalBDT: 500,
      referralBonusPoints: 50,
      conversionRate: 5,
      initialDemoPoints: 100
    };
  }
}

export async function updateGlobalSettings(updates: any) {
  try {
    const current = await getGlobalSettings();
    const updated = { ...current, ...updates };
    await api.settings.updateGlobalSettings(updated);
    return updated;
  } catch (error) {
    console.error('Error updating global settings:', error);
    throw error;
  }
}

// Utility functions
export function maskUsername(name: string): string {
  if (name.length <= 2) return '***';
  return '*'.repeat(name.length - 2) + name.slice(-2);
}

export function formatCurrency(points: number): string {
  return `${points.toLocaleString()} pts`;
}

// Convert points to BDT using conversion rate
// If conversionRate = 5 (1 BDT = 5 points), then 1 point = 1/5 BDT = 0.2 BDT
export function pointsToBDT(points: number, conversionRate: number = 5): number {
  return points / conversionRate;
}

// Convert BDT to points using conversion rate
export function bdtToPoints(bdt: number, conversionRate: number = 5): number {
  return bdt * conversionRate;
}

export function formatBDT(points: number, conversionRate: number = 5): string {
  const bdt = pointsToBDT(points, conversionRate);
  return `৳${bdt.toFixed(2)}`;
}

// Referral system
export function generateReferralCode(userId: string): string {
  const code = userId.slice(-6).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  return code;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  try {
    const user = await api.users.getByReferralCode(code);
    return user ? transformUser(user) : null;
  } catch (error) {
    console.error('Error fetching user by referral code:', error);
    return null;
  }
}

export async function getReferrals(userId: string): Promise<User[]> {
  try {
    const referrals = await api.users.getReferrals(userId);
    return referrals.map(transformUser);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }
}

export async function addReferralBonus(referrerId: string, amount: number) {
  try {
    const referrer = await getUserById(referrerId);
    if (referrer) {
      await updateUserBalance(referrerId, referrer.demoPoints + amount);
      await addTransaction({
        userId: referrerId,
        type: 'bonus',
        amount: amount,
        status: 'completed',
        details: 'Referral bonus',
      });
    }
  } catch (error) {
    console.error('Error adding referral bonus:', error);
    throw error;
  }
}

// Game Settings
export async function getGameSettings() {
  try {
    return await api.settings.getGameSettings();
  } catch (error) {
    console.error('Error fetching game settings:', error);
    return {
      crash: { enabled: true, minBet: 10, maxBet: 10000, houseFactor: 0.97 },
      mines: { enabled: true, minBet: 10, maxBet: 10000, minMines: 1, maxMines: 24 },
      slots: { enabled: true, minBet: 10, maxBet: 10000, rtp: 0.95 },
      dice: { enabled: true, minBet: 10, maxBet: 10000, houseEdge: 0.02 }
    };
  }
}

export async function updateGameSettings(settings: any) {
  try {
    // Clean the settings object - only send game settings, not MongoDB fields
    const cleanSettings = {
      crash: settings.crash,
      mines: settings.mines,
      slots: settings.slots,
      dice: settings.dice
    };
    await api.settings.updateGameSettings(cleanSettings);
  } catch (error) {
    console.error('Error updating game settings:', error);
    throw error;
  }
}

export async function getGameStats() {
  try {
    return await api.games.getStats();
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return {
      crash: { totalBets: 0, totalWagered: 0, totalWon: 0, totalPlayers: 0 },
      mines: { totalBets: 0, totalWagered: 0, totalWon: 0, totalPlayers: 0 },
      slots: { totalBets: 0, totalWagered: 0, totalWon: 0, totalPlayers: 0 },
      dice: { totalBets: 0, totalWagered: 0, totalWon: 0, totalPlayers: 0 }
    };
  }
}

