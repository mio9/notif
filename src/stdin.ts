export async function readStdin(): Promise<string> {
  return Bun.stdin.text();
}
