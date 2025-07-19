import { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type User = {
  id: number;
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check auth status on mount
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
    meta: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  });

  // Set user from auth check
  useEffect(() => {
    if (authData?.user && !user) {
      setUser(authData.user);
    }
  }, [authData, user]);

  useEffect(() => {
    if (token) {
      // Set up axios interceptor to include token
      const interceptor = apiRequest;
      // You might want to set up axios interceptors here
    }
  }, [token]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      toast({
        title: "Success",
        description: "Welcome back!",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({
      name,
      email,
      password,
      confirmPassword,
    }: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      const response = await apiRequest("POST", "/api/auth/signup", {
        name,
        email,
        password,
        confirmPassword,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Signup failed",
        variant: "destructive",
      });
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    await signupMutation.mutateAsync({ name, email, password, confirmPassword });
  };

  const logout = () => {
    // Clear all authentication data
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("supabase_session");
    
    // Clear query cache
    queryClient.clear();
    
    // Clear any cookies if they exist
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
    
    // Redirect to landing page
    setLocation("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
