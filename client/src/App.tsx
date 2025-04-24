import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ServicesPage from "@/pages/services-page";
import ServiceDetailPage from "@/pages/service-detail-page";
import ClientsPage from "@/pages/clients-page";
import QuotesPage from "@/pages/quotes-page";
import QuoteDetailPage from "@/pages/quote-detail-page";
import WorkOrdersPage from "@/pages/work-orders-page";
import UsersPage from "@/pages/users-page";
import { SQLiteProvider } from "@/hooks/use-sqlite-context";
import { useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { Loader2 } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/services" component={ServicesPage} />
      <ProtectedRoute path="/services/:id" component={ServiceDetailPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/quotes" component={QuotesPage} />
      <ProtectedRoute path="/quotes/:id" component={QuoteDetailPage} />
      <ProtectedRoute path="/work-orders" component={WorkOrdersPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

function App() {
  const [isNative, setIsNative] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Detectar se estamos em plataforma nativa (Android/iOS)
    const checkPlatform = async () => {
      const isNativePlatform = Capacitor.isNativePlatform();
      setIsNative(isNativePlatform);
      setIsLoading(false);
    };
    
    checkPlatform();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando aplicativo...</span>
      </div>
    );
  }
  
  // Se estivermos em plataforma nativa, inicializamos o SQLite
  if (isNative) {
    return (
      <QueryClientProvider client={queryClient}>
        <SQLiteProvider>
          <AppContent />
        </SQLiteProvider>
      </QueryClientProvider>
    );
  }
  
  // Em ambiente web, não precisamos do SQLiteProvider
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
