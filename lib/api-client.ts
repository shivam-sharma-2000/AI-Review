/**
 * Reusable client-side API client.
 * Automatically attaches the JWT bearer token to outbound request headers
 * and handles 401 Unauthorized errors by logging out the user.
 */

let authToken: string | null = null;

if (typeof window !== "undefined") {
  authToken = localStorage.getItem("auth_token");
}

export function setToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }
}

export function getToken(): string | null {
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("auth_token");
  }
  return authToken;
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuthErrorHandling?: boolean;
}

export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const token = getToken();

  // Create Headers object and copy existing ones
  const headers = new Headers(options.headers || {});
  
  // Attach token explicitly if available
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Handle JSON request formatting automatically if body is a plain object
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: body as BodyInit | null | undefined,
    });

    // Handle session expiration automatically
    if (response.status === 401 && !options.skipAuthErrorHandling) {
      setToken(null);
      if (typeof window !== "undefined") {
        // Expire cookie
        document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        
        // Redirect to login if on a protected page
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    return response;
  } catch (error) {
    console.error("API call network error:", error);
    throw error;
  }
}
