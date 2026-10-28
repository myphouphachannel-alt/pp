/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a numeric amount into Lao Kip (LAK) representation.
 * Example: 100000 -> "100,000 LAK"
 */
export function formatLAK(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 LAK';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-US').format(rounded);
  return `${formatted} LAK`;
}

/**
 * Formats amount with symbol (₭)
 */
export function formatKip(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₭';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-US').format(rounded);
  return `${formatted} ₭`;
}

/**
 * Formats compact amount, e.g. 1,500,000 -> "1.5M LAK"
 */
export function formatCompactLAK(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M LAK`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k LAK`;
  }
  return formatLAK(amount);
}

/**
 * Parses user input string into clean integer
 */
export function parseLAK(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : Math.round(input);
  const cleaned = input.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}
