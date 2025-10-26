export function generateFamCode(): string {
  const code = `FAM${Math.floor(100 + Math.random() * 900)}`;
  return code
}