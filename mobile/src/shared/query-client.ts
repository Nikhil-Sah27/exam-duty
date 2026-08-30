import { QueryClient } from "@tanstack/react-query";

/**
 * The app's single QueryClient, created at module scope rather than inside a
 * component.
 *
 * Sign-out has to be able to empty this cache, and sign-out is reachable from
 * places that are not React — the axios 401 interceptor calls it directly. A
 * client owned by `useState` inside Providers is unreachable from there, which
 * left every user-scoped query (notifications, my change requests, my DCS
 * groups) sitting in memory under a user-agnostic key after the user signed
 * out. On a shared department handset the next person to sign in within the
 * 60s staleTime was served the previous user's data before any refetch.
 *
 * Defaults mirror frontend/src/shared/lib/providers.tsx. Keep in sync.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});
