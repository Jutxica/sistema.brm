export const validateCpf = (cpf: string): boolean => {
  const cleaned = (cpf || '').replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
  let rev = 11 - (sum % 11);
  const d1 = (rev === 10 || rev === 11) ? 0 : rev;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
  rev = 11 - (sum % 11);
  const d2 = (rev === 10 || rev === 11) ? 0 : rev;

  return cleaned.endsWith(`${d1}${d2}`);
};
