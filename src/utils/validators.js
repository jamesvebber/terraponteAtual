/**
 * Brazilian validation utilities: CPF, CNPJ, phone, full name
 */

const INVALID_CPFS = new Set([
  "00000000000","11111111111","22222222222","33333333333",
  "44444444444","55555555555","66666666666","77777777777",
  "88888888888","99999999999","12345678909",
]);

export function validateCPF(cpf) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || INVALID_CPFS.has(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(digits[10]);
}

const INVALID_CNPJS = new Set([
  "00000000000000","11111111111111","22222222222222","33333333333333",
  "44444444444444","55555555555555","66666666666666","77777777777777",
  "88888888888888","99999999999999",
]);

export function validateCNPJ(cnpj) {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14 || INVALID_CNPJS.has(digits)) return false;
  const calcDigit = (d, weights) => {
    const sum = d.reduce((acc, n, i) => acc + n * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const nums = digits.split("").map(Number);
  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  if (calcDigit(nums.slice(0,12), w1) !== nums[12]) return false;
  if (calcDigit(nums.slice(0,13), w2) !== nums[13]) return false;
  return true;
}

export function validatePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  // Brazilian: 10 (landline) or 11 (mobile with 9) digits, optionally prefixed with 55
  const normalized = digits.startsWith("55") ? digits.slice(2) : digits;
  return normalized.length === 10 || normalized.length === 11;
}

export function validateFullName(name) {
  return name.trim().split(/\s+/).length >= 2;
}

export function maskCPF(cpf) {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0,3)}.***.**${d.slice(9,11)}-${d.slice(9,11)}`.replace(/\d+/, (m, o) =>
    o === 0 ? d.slice(0,3) : m
  );
}

export function formatCNPJ(cnpj) {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
}

export function formatCPF(cpf) {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
}