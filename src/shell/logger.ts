export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV === 'production') {
    const id = Math.random().toString(36).slice(2, 10);
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ level: 'error', context, message, id, ts: new Date().toISOString() }));
  } else {
    console.error(`[${context}]`, error);
  }
}
