export function generatePin(): string {
  const pin = Math.floor(100000 + Math.random() * 900000);
  return pin.toString();
}