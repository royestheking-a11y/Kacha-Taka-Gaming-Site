// Provably Fair System - HMAC SHA256 based RNG

export function generateServerSeed(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hmacSHA256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToFloat(hex: string, precision: number = 12): number {
  const subset = hex.slice(0, 13);
  const num = parseInt(subset, 16);
  const modulo = Math.pow(10, precision);
  return (num % modulo) / modulo;
}

// Crash Game - Calculate crash multiplier
export async function calculateCrashMultiplier(serverSeed: string, roundId: string, houseFactor: number = 0.97): Promise<number> {
  return hmacSHA256(serverSeed, roundId).then(hmac => {
    const r = hexToFloat(hmac);
    if (r === 0) return 1.00;
    
    const fair = 1 / (1 - r);
    const adjusted = fair * houseFactor;
    const crash = Math.max(1.00, Math.floor(adjusted * 100) / 100);
    
    return crash;
  });
}

// Mines - Generate mine positions
export async function generateMinePositions(
  serverSeed: string,
  roundId: string,
  gridSize: number,
  mineCount: number
): Promise<Set<number>> {
  const hmac = await hmacSHA256(serverSeed, roundId + ':mines');
  const cells = Array.from({ length: gridSize * gridSize }, (_, i) => i);
  
  // Seeded shuffle using Fisher-Yates
  let seed = parseInt(hmac.slice(0, 13), 16);
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  
  return new Set(cells.slice(0, mineCount));
}

// Dice - Generate dice result (0-100.00)
export async function generateDiceResult(serverSeed: string, roundId: string): Promise<number> {
  const hmac = await hmacSHA256(serverSeed, roundId + ':dice');
  const num = parseInt(hmac.slice(0, 8), 16);
  const value = (num % 10001) / 100;
  return Math.floor(value * 100) / 100;
}

// Slots - Generate reel results
export type SlotSymbol = 'SEVEN' | 'BAR' | 'CHERRY' | 'LEMON' | 'ORANGE' | 'WILD';

export interface ReelConfig {
  symbols: SlotSymbol[];
  weights: number[];
}

export async function generateSlotResult(
  serverSeed: string,
  roundId: string,
  reels: ReelConfig[]
): Promise<SlotSymbol[]> {
  const results: SlotSymbol[] = [];
  
  for (let i = 0; i < reels.length; i++) {
    const hmac = await hmacSHA256(serverSeed, `${roundId}:slot:${i}`);
    const reel = reels[i];
    const totalWeight = reel.weights.reduce((a, b) => a + b, 0);
    const num = parseInt(hmac.slice(0, 8), 16);
    const r = num % totalWeight;
    
    let cumulative = 0;
    for (let j = 0; j < reel.symbols.length; j++) {
      cumulative += reel.weights[j];
      if (r < cumulative) {
        results.push(reel.symbols[j]);
        break;
      }
    }
  }
  
  return results;
}

// Calculate Mines Multiplier
export function calculateMinesMultiplier(
  openedTiles: number,
  totalMines: number,
  gridSize: number
): number {
  const totalTiles = gridSize * gridSize;
  const safeTiles = totalTiles - totalMines;
  
  let multiplier = 1;
  for (let i = 0; i < openedTiles; i++) {
    const remaining = safeTiles - i;
    const total = totalTiles - i;
    multiplier *= total / remaining;
  }
  
  return Math.floor(multiplier * 100) / 100;
}

// Calculate Dice Payout
export function calculateDiceMultiplier(threshold: number, isOver: boolean, houseEdge: number = 0.02): number {
  const winProbability = isOver ? (100 - threshold) / 100 : threshold / 100;
  const rawMultiplier = 1 / winProbability;
  const adjustedMultiplier = rawMultiplier * (1 - houseEdge);
  return Math.floor(adjustedMultiplier * 100) / 100;
}

// Verify result
export async function verifyResult(
  serverSeed: string,
  clientSeed: string,
  expectedHash: string
): Promise<boolean> {
  const hash = await sha256(serverSeed);
  return hash === expectedHash;
}

// Generic Game Result Generator
export async function generateGameResult(
  game: 'crash' | 'mines' | 'dice' | 'slots',
  clientSeed: string,
  params: any = {}
): Promise<any> {
  const serverSeed = generateServerSeed(); // In a real app, this should be persistent/validated
  
  switch (game) {
    case 'crash':
      return calculateCrashMultiplier(serverSeed, clientSeed);
    case 'mines':
      return generateMinePositions(serverSeed, clientSeed, 5, params.minesCount || 3);
    case 'dice':
      return generateDiceResult(serverSeed, clientSeed);
    case 'slots':
      // Slots requires reel config, normally passed or hardcoded
      return [];
    default:
      throw new Error('Unknown game type');
  }
}
