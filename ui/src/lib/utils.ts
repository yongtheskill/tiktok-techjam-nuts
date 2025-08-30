import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TOKEN_DECIMALS } from '../components/wallet/contracts';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertCoins(coins: number | bigint) {
  if (typeof coins === 'bigint') {
    const divisor = BigInt(10 ** TOKEN_DECIMALS);
    const wholePart = coins / divisor;
    const fractionalPart = coins % divisor;
    return Number(wholePart) + Number(fractionalPart) / 10 ** TOKEN_DECIMALS;
  }
  return coins / 10 ** TOKEN_DECIMALS;
}

export function formatCoins(coins: number | bigint) {
  if (typeof coins === 'bigint') {
    const divisor = BigInt(10 ** TOKEN_DECIMALS);
    const wholePart = coins / divisor;
    const fractionalPart = coins % divisor;
    const decimal = Number(fractionalPart) / 10 ** TOKEN_DECIMALS;
    return (Number(wholePart) + decimal).toFixed(2);
  }
  return (coins / 10 ** TOKEN_DECIMALS).toFixed(2);
}
