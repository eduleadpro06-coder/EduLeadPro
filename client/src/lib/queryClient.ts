import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      const error = new Error(errorData.message || `${res.status}: ${res.statusText}`);
      (error as any).errorData = errorData;
      (error as any).status = res.status;
      throw error;
    } catch (parseError) {
      const text = await res.text() || res.statusText;
      const error = new Error(`${res.status}: ${text}`);
      (error as any).status = res.status;
      throw error;
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    // Clone the response before reading it to avoid "body stream already read" error
    const clonedRes = res.clone();
    try {
      const errorData = await clonedRes.json();
      const error = new Error(errorData.message || `${res.status}: ${res.statusText}`);
      (error as any).errorData = errorData;
      (error as any).status = res.status;
      throw error;
    } catch (parseError) {
      // If JSON parsing fails, try to read as text
      try {
        const clonedRes2 = res.clone();
        const text = await clonedRes2.text() || res.statusText;
        const error = new Error(`${res.status}: ${text}`);
        (error as any).status = res.status;
        throw error;
      } catch (textError) {
        // If all else fails, create a generic error
        const error = new Error(`${res.status}: ${res.statusText}`);
        (error as any).status = res.status;
        throw error;
      }
    }
  }

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
