import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  Menu, X, LayoutDashboard, Users, ClipboardList, 
  FileText, UserCircle, Settings, LogOut, BarChart3
} from "lucide-react";
import logoImg from "@/assets/logo.png";

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

  const menuItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    { href: "/services", label: "Serviços", icon: <ClipboardList className="w-5 h-5 mr-3" /> },
    { href: "/clients", label: "Clientes", icon: <UserCircle className="w-5 h-5 mr-3" /> },
    { href: "/quotes", label: "Orçamentos", icon: <BarChart3 className="w-5 h-5 mr-3" /> },
    { href: "/work-orders", label: "Ordens de Serviço", icon: <FileText className="w-5 h-5 mr-3" /> },
  ];

  const adminItems = [
    { href: "/users", label: "Usuários", icon: <Users className="w-5 h-5 mr-3" /> },
    { href: "/settings", label: "Configurações", icon: <Settings className="w-5 h-5 mr-3" /> },
  ];

  return (
    <header className="lg:hidden fixed top-0 left-0 w-full z-20">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-lg">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center">
            <img src={logoImg} alt="SAM Climatiza" className="h-10 mr-2" />
            <h1 className="text-lg font-bold">SAM Climatiza</h1>
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
        <nav className="absolute w-full bg-gradient-to-b from-blue-700 to-blue-900 shadow-lg">
          {/* Perfil */}
          <div className="bg-blue-600/50 p-4 border-b border-blue-700/30 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <div className="text-white font-bold">{user?.name}</div>
              <div className="text-blue-100 text-xs">{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white p-2 rounded-full"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Itens do menu */}
          <div className="p-2 space-y-1">
            {menuItems.map((item) => (
              <a 
                key={item.href}
                href={item.href}
                className="block p-3 rounded bg-blue-800 text-white font-medium flex items-center"
              >
                {item.icon}
                {item.label}
              </a>
            ))}

            {isAdmin && adminItems.map((item) => (
              <a 
                key={item.href}
                href={item.href}
                className="block p-3 rounded bg-blue-800 text-white font-medium flex items-center"
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </div>
        </nav>
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