export function generatePNR(): string {
  let candidate: string;
  do {
    const n = Math.floor(Math.random() * 1_000_000_000);
    candidate = String(n).padStart(10, "0");
  } while (candidate.length !== 10);
  return candidate;
}