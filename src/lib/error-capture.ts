// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

// Patterns for non-critical errors from browser extensions and third-party libraries
const IGNORED_ERROR_PATTERNS = [
  /Video element not found for attaching listeners/i,
  /Cannot set property ethereum/i,
  /message channel closed/i,
  /A listener indicated an asynchronous response/i,
  /^TypeError: Cannot read properties of undefined/i,
];

function isIgnoredError(error: unknown): boolean {
  if (!error) return false;
  
  const message = error instanceof Error ? error.message : String(error);
  return IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

function record(error: unknown) {
  // Skip recording ignored errors
  if (isIgnoredError(error)) {
    return;
  }
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
