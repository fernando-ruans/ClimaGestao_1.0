import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, Users, ClipboardList, FileText, UserCircle, 
  Settings, LogOut, BarChart3, Wifi, WifiOff, Snowflake
} from "lucide-react";
import { OfflineModeToggle } from "@/components/offline-mode-toggle";
import { Capacitor } from '@capacitor/core';
import logoImg from "@/assets/logo.png";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation, isOfflineMode } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isNative = Capacitor.isNativePlatform();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
    : '';

  return (
    <div className={cn(
      "fixed left-0 top-0 w-64 h-full hidden lg:block overflow-y-auto",
      "bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg",
      className
    )}>
      {/* Cabeçalho com logo */}
      <div className="p-4 border-b border-blue-700/50 bg-gradient-to-r from-blue-800 to-blue-900">
        <div className="flex items-center justify-center mb-2">
          <img src={logoImg} alt="SAM Climatiza" className="h-16" />
        </div>
        <h1 className="text-xl font-bold text-center bg-gradient-to-r from-blue-200 to-blue-100 text-transparent bg-clip-text">
          SAM CLIMATIZA
        </h1>
        <p className="text-xs text-center text-white mt-1">Soluções para Ambientes Climatizados</p>
      </div>
      
      {/* Modo offline - mostrado apenas em dispositivos móveis */}
      {isNative && (
        <div className="px-4 py-3 border-b border-blue-700/30">
          <OfflineModeToggle />
        </div>
      )}
      
      {/* Perfil do usuário */}
      <div className="p-4 border-b border-blue-700/30 flex items-center bg-gradient-to-r from-blue-800/50 to-blue-700/30">
        {user?.photoUrl ? (
          <img 
            src={user.photoUrl} 
            alt={user.name} 
            className="w-12 h-12 rounded-full border-2 border-blue-500 mr-3 shadow-lg"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-medium mr-3 text-lg border-2 border-blue-400 shadow-md">
            {initials}
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-white">{user?.name}</div>
          <div className="text-xs text-white">{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
        </div>
        <button 
          onClick={handleLogout} 
          className="ml-auto text-white hover:text-white bg-blue-800/50 p-2 rounded-full hover:bg-blue-700 transition-colors"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
      
      {/* Navegação */}
      <nav className="p-3">
        <div className="mb-2 text-xs uppercase text-white font-medium px-3">Principal</div>
        <ul className="space-y-1">
          <li>
            <Link href="/" className={cn(
                "flex items-center px-3 py-2.5 text-sm rounded-lg",
                location === "/" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" 
                  : "text-white hover:bg-blue-700/50"
              )}>
                <LayoutDashboard className="h-5 w-5 mr-3 text-white" />
                Dashboard
            </Link>
          </li>
          <li>
            <Link href="/services" className={cn(
                "flex items-center px-3 py-2.5 text-sm rounded-lg",
                location === "/services"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" 
                  : "text-white hover:bg-blue-700/50"
              )}>
                <ClipboardList className="h-5 w-5 mr-3 text-white" />
                Serviços
            </Link>
          </li>
          <li>
            <Link href="/clients" className={cn(
                "flex items-center px-3 py-2.5 text-sm rounded-lg",
                location === "/clients"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" 
                  : "text-white hover:bg-blue-700/50"
              )}>
                <UserCircle className="h-5 w-5 mr-3 text-white" />
                Clientes
            </Link>
          </li>
          <li>
            <Link href="/quotes" className={cn(
                "flex items-center px-3 py-2.5 text-sm rounded-lg",
                location === "/quotes"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" 
                  : "text-white hover:bg-blue-700/50"
              )}>
                <BarChart3 className="h-5 w-5 mr-3 text-white" />
                Orçamentos
            </Link>
          </li>
          <li>
            <Link href="/work-orders" className={cn(
                "flex items-center px-3 py-2.5 text-sm rounded-lg",
                location === "/work-orders"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" 
                  : "text-white hover:bg-blue-700/50"
              )}>
                <FileText className="h-5 w-5 mr-3 text-white" />
                Ordens de Serviço
            </Link>
          </li>
        </ul>

        {isAdmin && (
          <>
            <div className="mt-6 mb-2 text-xs uppercase text-white font-medium px-3">Administração</div>
            <ul className="space-y-1">
              <li>
                <Link href="/users" className={cn(
                    "flex items-center px-3 py-2.5 text-sm rounded-lg",
                    location === "/users"
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md" 
                      : "text-white hover:bg-red-800/40"
                  )}>
                    <Users className="h-5 w-5 mr-3 text-white" />
                    Usuários
                </Link>
              </li>
              <li>
                <Link href="/settings" className={cn(
                    "flex items-center px-3 py-2.5 text-sm rounded-lg",
                    location === "/settings"
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md" 
                      : "text-white hover:bg-red-800/40"
                  )}>
                    <Settings className="h-5 w-5 mr-3 text-white" />
                    Configurações
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>
      
      {/* Indicador de modo */}
      {isNative && (
        <div className="px-4 mt-4">
          <div className={cn(
            "py-2 px-3 text-xs rounded flex items-center",
            isOfflineMode 
              ? "bg-orange-700/20 text-white border border-orange-700/30" 
              : "bg-green-700/20 text-white border border-green-700/30"
          )}>
            {isOfflineMode ? (
              <>
                <WifiOff className="h-3.5 w-3.5 mr-2 text-white" />
                Modo Offline
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 mr-2 text-white" />
                Modo Online
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Rodapé */}
      <div className="mt-12 w-full p-3 text-center text-xs">
        <div className="flex items-center justify-center">
          <Snowflake className="h-4 w-4 mr-2 text-white" />
          <span className="text-white">SAM Climatiza &copy; 2025</span>
        </div>
      </div>
    </div>
  );
}
