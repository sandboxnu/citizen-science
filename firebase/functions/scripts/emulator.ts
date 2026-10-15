// Fails fast with a clear message instead of hanging on gRPC retries when the
// Firestore emulator isn't running.
export async function assertEmulatorRunning() {
  try {
    await fetch("http://127.0.0.1:8080");
  } catch {
    console.error("Firestore emulator isn't running. Start it with `npm run dev` from the repo root first.");
    process.exit(1);
  }
}
