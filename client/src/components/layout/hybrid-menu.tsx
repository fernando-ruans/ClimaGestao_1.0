import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Menu, X, LayoutDashboard, Users, ClipboardList, FileText, UserCircle, BarChart3, Settings } from "lucide-react";
import logoImg from "@/assets/logo.png";

// Menu ultra simples que usa tags <a> puras com href comuns
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

          {/* Links de navegação usando <a> padrão */}
          <nav className="p-3 flex flex-col gap-2">
            <a href="/" className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors">
              <LayoutDashboard className="w-5 h-5 mr-2" />
              <span>Dashboard</span>
            </a>
            
            <a href="/services" className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors">
              <ClipboardList className="w-5 h-5 mr-2" />
              <span>Serviços</span>
            </a>
            
            <a href="/clients" className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors">
              <UserCircle className="w-5 h-5 mr-2" />
              <span>Clientes</span>
            </a>
            
            <a href="/quotes" className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors">
              <BarChart3 className="w-5 h-5 mr-2" />
              <span>Orçamentos</span>
            </a>
            
            <a href="/work-orders" className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors">
              <FileText className="w-5 h-5 mr-2" />
              <span>Ordens de Serviço</span>
            </a>
            
            {isAdmin && (
              <>
                <a href="/users" className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors">
                  <Users className="w-5 h-5 mr-2" />
                  <span>Usuários</span>
                </a>
                
                <a href="/settings" className="flex items-center px-3 py-2 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors">
                  <Settings className="w-5 h-5 mr-2" />
                  <span>Configurações</span>
                </a>
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
          onClick={() => setIsOpen(false)}
        />
      )}
    </header>
  );
}