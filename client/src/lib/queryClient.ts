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

// Helper to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  try {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.email) {
        return { 'x-user-name': user.email };
      }
    }
  } catch (e) {
    console.error("Error parsing auth user for headers:", e);
  }
  return {};
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...getAuthHeaders() // Inject auth header
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    console.log("🔍 Response not ok, status:", res.status);

    // Try to get JSON response first
    let errorData: any = null;
    let responseText = '';

    try {
      const responseClone = res.clone();
      errorData = await responseClone.json();
    } catch (jsonError) {
      try {
        responseText = await res.text();
      } catch (textError) {
        responseText = res.statusText;
      }
    }

    // Create the error object
    let error: any;
    if (errorData) {
      // We have JSON error data
      error = new Error(errorData.message || `${res.status}: ${res.statusText}`);
      error.errorData = errorData;
      error.code = errorData.code;
      error.details = errorData.details;
      error.cannotDelete = errorData.cannotDelete;
      error.status = res.status;
    } else {
      // Fallback to text error
      error = new Error(`${res.status}: ${responseText}`);
      error.status = res.status;
    }

    throw error;
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
        headers: getAuthHeaders(), // Inject auth header
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
      retry: false, // Don't retry on error
    },
    mutations: {
      retry: false,
    },
  },
});
