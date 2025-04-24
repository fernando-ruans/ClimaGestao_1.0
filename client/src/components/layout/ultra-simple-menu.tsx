import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Menu, X } from "lucide-react";
import logoImg from "@/assets/logo.png";

// Componente de menu extremamente simplificado para resolver problemas de navegação
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  const isAdmin = user?.role === 'admin';

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 w-full z-20">
      <div className="bg-gradient-to-r from-blue-600 to-blue-900 shadow-lg">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center">
            <img src={logoImg} alt="Logo" className="h-10 mr-2" />
            <span className="text-lg font-bold text-white">SAM Climatiza</span>
          </div>
          <button 
            onClick={toggleMenu}
            className="text-white p-2 rounded-full"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute w-full bg-blue-800 shadow-md">
          <div className="bg-blue-700 p-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1">
              <div className="text-white font-bold">{user?.name}</div>
              <div className="text-blue-100 text-sm">{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-blue-600 text-white p-2 rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-3 space-y-2">
            {/* Links HTML básicos em vez de componentes fancy */}
            <a 
              href="/"
              className="block px-3 py-2 rounded bg-blue-700 text-white font-medium"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </a>
            
            <a 
              href="/services"
              className="block px-3 py-2 rounded bg-blue-700 text-white font-medium"
              onClick={() => setIsOpen(false)}
            >
              Serviços
            </a>
            
            <a 
              href="/clients"
              className="block px-3 py-2 rounded bg-blue-700 text-white font-medium"
              onClick={() => setIsOpen(false)}
            >
              Clientes
            </a>
            
            <a 
              href="/quotes"
              className="block px-3 py-2 rounded bg-blue-700 text-white font-medium"
              onClick={() => setIsOpen(false)}
            >
              Orçamentos
            </a>
            
            <a 
              href="/work-orders"
              className="block px-3 py-2 rounded bg-blue-700 text-white font-medium"
              onClick={() => setIsOpen(false)}
            >
              Ordens de Serviço
            </a>
            
            {isAdmin && (
              <>
                <a 
                  href="/users"
                  className="block px-3 py-2 rounded bg-blue-700 text-white font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Usuários
                </a>
                
                <a 
                  href="/settings"
                  className="block px-3 py-2 rounded bg-blue-700 text-white font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Configurações
                </a>
              </>
            )}
          </nav>
          
          <div className="p-2 text-xs text-center text-blue-200 bg-blue-900">
            SAM Climatiza &copy; 2025
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </header>
  );
}