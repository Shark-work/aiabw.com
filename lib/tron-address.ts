/** TRON 主网地址（USDT-TRC20）校验：以 T 开头、34 位 Base58 */
const TRON_ADDRESS_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export function normalizeTronAddress(input: string): string {
  return input.trim();
}

export function isValidTronPayoutAddress(address: string): boolean {
  return TRON_ADDRESS_RE.test(normalizeTronAddress(address));
}

export function maskTronAddress(address: string): string {
  const a = normalizeTronAddress(address);
  if (a.length <= 12) return a;
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}
