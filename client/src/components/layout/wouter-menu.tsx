import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { LogOut, Menu, X, LayoutDashboard, Users, ClipboardList, FileText, UserCircle, BarChart3, Settings } from "lucide-react";
import logoImg from "@/assets/logo.png";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

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

  const navigate = (path: string) => {
    // Chamamos closeMenu antes para evitar problemas com a navegação
    closeMenu();
    // Usamos setTimeout para garantir que o menu esteja fechado antes da navegação
    setTimeout(() => {
      setLocation(path);
    }, 10);
  };

  // Helper function to get initials
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 w-full z-20">
      {/* Barra do topo */}
      <div className="bg-gradient-to-r from-blue-600 to-red-600 shadow-lg">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center">
            <img src={logoImg} alt="SAM Climatiza" className="h-10 mr-2" />
            <h1 className="text-lg font-bold text-white">SAM Climatiza</h1>
          </div>
          <button 
            onClick={toggleMenu} 
            className="text-white p-2 rounded-full hover:bg-white/20"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute w-full bg-blue-800 shadow-lg">
          {/* Perfil do usuário */}
          <div className="bg-blue-700 p-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1">
              <div className="text-white font-bold">{user?.name}</div>
              <div className="text-blue-100 text-xs">{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-blue-600 text-white p-2 rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Menu de navegação usando componente Link do wouter */}
          <nav className="p-3 flex flex-col gap-2">
            <Link href="/" onClick={closeMenu}>
              <a className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors w-full">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                <span>Dashboard</span>
              </a>
            </Link>
            
            <Link href="/services" onClick={closeMenu}>
              <a className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors w-full">
                <ClipboardList className="w-5 h-5 mr-2" />
                <span>Serviços</span>
              </a>
            </Link>
            
            <Link href="/clients" onClick={closeMenu}>
              <a className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors w-full">
                <UserCircle className="w-5 h-5 mr-2" />
                <span>Clientes</span>
              </a>
            </Link>
            
            <Link href="/quotes" onClick={closeMenu}>
              <a className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors w-full">
                <BarChart3 className="w-5 h-5 mr-2" />
                <span>Orçamentos</span>
              </a>
            </Link>
            
            <Link href="/work-orders" onClick={closeMenu}>
              <a className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors w-full">
                <FileText className="w-5 h-5 mr-2" />
                <span>Ordens de Serviço</span>
              </a>
            </Link>
            
            {isAdmin && (
              <>
                <Link href="/users" onClick={closeMenu}>
                  <a className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors w-full">
                    <Users className="w-5 h-5 mr-2" />
                    <span>Usuários</span>
                  </a>
                </Link>
                
                <Link href="/settings" onClick={closeMenu}>
                  <a className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors w-full">
                    <Settings className="w-5 h-5 mr-2" />
                    <span>Configurações</span>
                  </a>
                </Link>
              </>
            )}
          </nav>
          
          {/* Rodapé do menu */}
          <div className="text-center p-2 text-xs text-blue-200 bg-blue-900">
            © SAM Climatiza 2025
          </div>
        </div>
      )}

      {/* Overlay para fechar o menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10" 
          onClick={closeMenu}
        />
      )}
    </header>
  );
}