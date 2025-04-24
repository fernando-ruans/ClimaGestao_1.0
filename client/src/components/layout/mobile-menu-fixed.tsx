import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, Users, ClipboardList, FileText, UserCircle, 
  Settings, LogOut, BarChart3, Menu, X, Snowflake
} from "lucide-react";
import logoImg from "@/assets/logo.png";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isAdmin = user?.role === 'admin';

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    closeMenu();
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
    : '';

  return (
    <div className="lg:hidden fixed top-0 left-0 w-full z-20">
      {/* Barra superior com gradiente azul/vermelho */}
      <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-lg">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center">
            <img src={logoImg} alt="SAM Climatiza" className="h-10 mr-2" />
            <h1 className="text-lg font-bold">SAM Climatiza</h1>
          </div>
          <button 
            onClick={toggleMenu} 
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            className="text-white p-2 rounded-full hover:bg-white/20 focus:outline-none transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Menu dropdown com fundo em gradiente */}
      {isOpen && (
        <div className="absolute w-full bg-gradient-to-b from-blue-700 to-blue-900 border-b border-blue-700 shadow-lg animate-in slide-in-from-top-5 duration-200">
          {/* Perfil do usuário */}
          <div className="bg-gradient-to-r from-blue-600/50 to-blue-500/50 p-4 border-b border-blue-700/30">
            <div className="flex items-center">
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full border-2 border-white mr-3"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium mr-3 text-lg border-2 border-white shadow-md">
                  {initials}
                </div>
              )}
              <div>
                <div className="text-base font-bold text-white">{user?.name}</div>
                <div className="text-xs text-blue-100">{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
              </div>
              <button 
                onClick={handleLogout} 
                className="ml-auto text-white hover:text-red-200 bg-red-500/70 p-2 rounded-full hover:bg-red-600/80 transition-colors"
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Navegação */}
          <nav className="p-2">
            <ul className="grid grid-cols-1 gap-1">
              <li>
                <Link href="/"
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors text-white",
                    location === "/" 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-md" 
                      : "hover:bg-blue-900/60"
                  )}
                  onClick={closeMenu}
                >
                  <LayoutDashboard className="h-5 w-5 mr-3 text-white" />
                  <span className="font-medium text-white">Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/services"
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors text-white",
                    location === "/services" 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-md" 
                      : "hover:bg-blue-900/60"
                  )}
                  onClick={closeMenu}
                >
                  <ClipboardList className="h-5 w-5 mr-3 text-white" />
                  <span className="font-medium text-white">Serviços</span>
                </Link>
              </li>
              <li>
                <Link href="/clients"
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors text-white",
                    location === "/clients" 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-md" 
                      : "hover:bg-blue-900/60"
                  )}
                  onClick={closeMenu}
                >
                  <UserCircle className="h-5 w-5 mr-3 text-white" />
                  <span className="font-medium text-white">Clientes</span>
                </Link>
              </li>
              <li>
                <Link href="/quotes"
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors text-white",
                    location === "/quotes" 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-md" 
                      : "hover:bg-blue-900/60"
                  )}
                  onClick={closeMenu}
                >
                  <BarChart3 className="h-5 w-5 mr-3 text-white" />
                  <span className="font-medium text-white">Orçamentos</span>
                </Link>
              </li>
              <li>
                <Link href="/work-orders"
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors text-white",
                    location === "/work-orders" 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-md" 
                      : "hover:bg-blue-900/60"
                  )}
                  onClick={closeMenu}
                >
                  <FileText className="h-5 w-5 mr-3 text-white" />
                  <span className="font-medium text-white">Ordens de Serviço</span>
                </Link>
              </li>
              
              {isAdmin && (
                <>
                  <li>
                    <Link href="/users"
                      className={cn(
                        "flex items-center px-4 py-3 rounded-lg transition-colors text-white",
                        location === "/users" 
                          ? "bg-gradient-to-r from-red-600 to-red-700 shadow-md" 
                          : "hover:bg-red-900/60"
                      )}
                      onClick={closeMenu}
                    >
                      <Users className="h-5 w-5 mr-3 text-white" />
                      <span className="font-medium text-white">Usuários</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings"
                      className={cn(
                        "flex items-center px-4 py-3 rounded-lg transition-colors text-white",
                        location === "/settings" 
                          ? "bg-gradient-to-r from-red-600 to-red-700 shadow-md" 
                          : "hover:bg-red-900/60"
                      )}
                      onClick={closeMenu}
                    >
                      <Settings className="h-5 w-5 mr-3 text-white" />
                      <span className="font-medium text-white">Configurações</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
          
          {/* Rodapé */}
          <div className="p-3 bg-gradient-to-r from-blue-900 to-red-900 mt-2 flex justify-center items-center text-xs">
            <Snowflake className="h-4 w-4 text-white mr-1" />
            <span className="text-white">SAM Climatiza - Soluções para Ambientes Climatizados</span>
          </div>
        </div>
      )}
      
      {/* Overlay para fechar o menu quando clicado fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10" 
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </div>
  );
}