export function rawDigits(masked: string): string {
  return masked.replace(/\D/g, '');
}

function normalizeBR(digits: string): string {
  let d = digits;
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2);
  if (d.length === 12 && d.startsWith('55')) d = d.slice(2);
  return d.slice(0, 11);
}

export function maskPhone(raw: string): string {
  const digits = normalizeBR(raw.replace(/\D/g, ''));
  if (digits.length === 0) return '';
  if (digits.length <= 2)  return `(${digits}`;

  const ddd  = digits.slice(0, 2);
  const rest = digits.slice(2);
  const isMobile = rest[0] === '9';

  if (isMobile) {
    if (rest.length <= 5) return `(${ddd}) ${rest}`;
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  }

  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

export function isValidBRPhone(digits: string): boolean {
  if (digits.length !== 10 && digits.length !== 11) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (Number.isNaN(ddd) || ddd < 11 || ddd > 99) return false;
  if (digits.length === 11 && digits[2] !== '9') return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}
