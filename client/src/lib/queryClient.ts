import { QueryClient, QueryFunction } from "@tanstack/react-query";

// URL base é diretamente a raiz atual
export const API_BASE_URL = "";

// Logging da URL base para debug
console.log("URL base para API:", API_BASE_URL || "URL relativa (raiz)");
console.log("URL da aplicação:", window.location.origin);

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Tenta primeiro interpretar como JSON
      const data = await res.json();
      if (data && data.message) {
        throw new Error(data.message);
      } else {
        throw new Error(JSON.stringify(data));
      }
    } catch (jsonError) {
      // Se não conseguir interpretar como JSON, usa o texto
      const text = await res.text();
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit
): Promise<Response> {
  // Remove barras duplicadas na URL (//api/...)
  const apiUrl = url.startsWith('/') ? url.substring(1) : url;
  // Adiciona a URL base se a URL não começar com http ou https
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${apiUrl}`;
  
  console.log(`Fazendo requisição para: ${fullUrl}`);
  
  // Verifica se é um FormData para não definir Content-Type
  const isFormData = data instanceof FormData;
  
  // Headers padrão para todas as requisições
  const headers: HeadersInit = {
    ...((!isFormData && data) ? { "Content-Type": "application/json" } : {}),
    // Garantir que o navegador aceite cookies
    "Accept": "application/json, text/plain, */*",
  };
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: isFormData ? data as FormData : data ? JSON.stringify(data) : undefined,
    credentials: "include", // Envia cookies para requests cross-origin
    cache: "no-cache", // Evitar cache de requisições
    mode: "cors", // Permitir CORS
    ...options
  });

  if (!res.ok) {
    console.error(`Erro na requisição: ${res.status} - ${res.statusText}`);
    console.error(`URL: ${fullUrl}, Método: ${method}`);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Remove barras duplicadas na URL (//api/...)
    const apiPath = typeof queryKey[0] === 'string' && queryKey[0].startsWith('/') 
      ? queryKey[0].substring(1) 
      : queryKey[0];
    
    // Adiciona a URL base se a queryKey[0] não começar com http ou https
    const url = typeof queryKey[0] === 'string' && !queryKey[0].startsWith('http') 
      ? `${API_BASE_URL}${apiPath}` 
      : queryKey[0] as string;
    
    console.log(`Fazendo consulta para: ${url}`);
      
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-cache",
      headers: {
        "Accept": "application/json, text/plain, */*",
      },
      mode: "cors",
    });

    if (!res.ok) {
      console.error(`Erro na consulta: ${res.status} - ${res.statusText}`);
      console.error(`URL: ${url}`);
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.warn("Usuário não autenticado, retornando null");
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
