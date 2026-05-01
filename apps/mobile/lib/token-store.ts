// Bridges Clerk's useAuth().getToken() (React context) to non-component API code.
// AuthGate registers the getter once; api.ts calls it on every request.
let _getToken: (() => Promise<string | null>) | null = null;

export function registerTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

export async function getClerkToken(): Promise<string | null> {
  return _getToken?.() ?? null;
}
