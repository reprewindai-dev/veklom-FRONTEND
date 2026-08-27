// wagmi.ts — Stub
// @reown/appkit-adapter-wagmi contains a broken mppx/zod shim that fails under
// Turbopack. The QuantumTerminal wallet features are deferred until the mppx
// package is fixed upstream. All exports are stubs so pglLoader.ts compiles.
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();
export const projectId = 'b2123ccbf471a2b0c3f09ba9624be206';
export const networks = [] as unknown[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const wagmiAdapter = null as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const config = null as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const modal = { open: () => {}, close: () => {} } as any;
