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
    console.log("🔍 Response not ok, status:", res.status);
    
    // Try to get JSON response first
    let errorData: any = null;
    let responseText = '';
    
    try {
      const responseClone = res.clone();
      errorData = await responseClone.json();
      console.log("✅ Successfully parsed JSON error data:", errorData);
    } catch (jsonError) {
      console.log("❌ Failed to parse JSON, trying text...");
      try {
        responseText = await res.text();
        console.log("📄 Got text response:", responseText);
      } catch (textError) {
        console.log("❌ Failed to get text response too");
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
      
      console.log("✅ Created error with JSON data:", {
        message: error.message,
        code: error.code,
        details: !!error.details,
        status: error.status
      });
    } else {
      // Fallback to text error
      error = new Error(`${res.status}: ${responseText}`);
      error.status = res.status;
      
      console.log("⚠️ Created fallback error:", error.message);
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
