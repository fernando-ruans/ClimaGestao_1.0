import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Menu, X } from "lucide-react";
import logoImg from "@/assets/logo.png";

// Menu com navegação via HTML puro e JavaScript, ignorando completamente qualquer sistema de roteamento
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  const isAdmin = user?.role === 'admin';

  // Função para abrir/fechar o menu
  function toggleMenu() {
    setIsOpen(!isOpen);
  }

  // Função para fazer logout
  function handleLogout() {
    logoutMutation.mutate();
    setIsOpen(false);
  }

  // Esta função ignora completamente qualquer sistema de roteamento
  function forceNavigate(path: string) {
    // Prevenção de interceptação do roteador
    window.onbeforeunload = null; 
    window.location.replace(path);
    return false;
  }

  // Estilo inline para evitar conflitos com CSS externo
  const styles = {
    header: "position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;",
    topBar: "background: linear-gradient(to right, #2563eb, #1e40af); padding: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);",
    flexBetween: "display: flex; justify-content: space-between; align-items: center;",
    logo: "height: 40px; margin-right: 8px;",
    logoText: "color: white; font-size: 18px; font-weight: bold;",
    menuButton: "background: none; border: none; cursor: pointer; color: white;",
    menuContainer: "position: absolute; width: 100%; background-color: #1e40af; box-shadow: 0 2px 4px rgba(0,0,0,0.2);",
    userInfo: "display: flex; align-items: center; padding: 16px; background-color: #1d4ed8;",
    avatar: "width: 40px; height: 40px; border-radius: 20px; background-color: #3b82f6; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 12px;",
    userName: "color: white; font-weight: bold;",
    userRole: "color: #bfdbfe; font-size: 14px;",
    logoutBtn: "background-color: #2563eb; color: white; border: none; border-radius: 20px; padding: 8px; cursor: pointer;",
    nav: "padding: 12px; display: flex; flex-direction: column; gap: 8px;",
    navItem: "background-color: #1d4ed8; border: none; border-radius: 4px; padding: 8px 12px; color: white; font-weight: 500; text-align: left; cursor: pointer; width: 100%;",
    footer: "padding: 8px; font-size: 12px; text-align: center; color: #bfdbfe; background-color: #1e3a8a;",
    overlay: "position: fixed; inset: 0; background-color: rgba(0,0,0,0.2); z-index: 999;"
  };

  return (
    <div style={{display: window.innerWidth > 1024 ? 'none' : 'block'}}>
      <header style={{position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000}}>
        <div style={{background: 'linear-gradient(to right, #2563eb, #1e40af)', padding: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <img src={logoImg} alt="Logo" style={{height: '40px', marginRight: '8px'}} />
              <span style={{color: 'white', fontSize: '18px', fontWeight: 'bold'}}>SAM Climatiza</span>
            </div>
            <button 
              onClick={toggleMenu}
              style={{background: 'none', border: 'none', cursor: 'pointer', color: 'white'}}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div style={{position: 'absolute', width: '100%', backgroundColor: '#1e40af', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>
            <div style={{display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: '#1d4ed8'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '20px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', marginRight: '12px'}}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{flex: 1}}>
                <div style={{color: 'white', fontWeight: 'bold'}}>{user?.name}</div>
                <div style={{color: '#bfdbfe', fontSize: '14px'}}>{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
              </div>
              <button 
                onClick={handleLogout}
                style={{backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '20px', padding: '8px', cursor: 'pointer'}}
              >
                <LogOut size={20} />
              </button>
            </div>

            <div style={{padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <button 
                onClick={() => forceNavigate("/")}
                style={{backgroundColor: '#1d4ed8', border: 'none', borderRadius: '4px', padding: '8px 12px', color: 'white', fontWeight: 500, textAlign: 'left', cursor: 'pointer', width: '100%'}}
              >
                Dashboard
              </button>
              
              <button 
                onClick={() => forceNavigate("/services")}
                style={{backgroundColor: '#1d4ed8', border: 'none', borderRadius: '4px', padding: '8px 12px', color: 'white', fontWeight: 500, textAlign: 'left', cursor: 'pointer', width: '100%'}}
              >
                Serviços
              </button>
              
              <button 
                onClick={() => forceNavigate("/clients")}
                style={{backgroundColor: '#1d4ed8', border: 'none', borderRadius: '4px', padding: '8px 12px', color: 'white', fontWeight: 500, textAlign: 'left', cursor: 'pointer', width: '100%'}}
              >
                Clientes
              </button>
              
              <button 
                onClick={() => forceNavigate("/quotes")}
                style={{backgroundColor: '#1d4ed8', border: 'none', borderRadius: '4px', padding: '8px 12px', color: 'white', fontWeight: 500, textAlign: 'left', cursor: 'pointer', width: '100%'}}
              >
                Orçamentos
              </button>
              
              <button 
                onClick={() => forceNavigate("/work-orders")}
                style={{backgroundColor: '#1d4ed8', border: 'none', borderRadius: '4px', padding: '8px 12px', color: 'white', fontWeight: 500, textAlign: 'left', cursor: 'pointer', width: '100%'}}
              >
                Ordens de Serviço
              </button>
              
              {isAdmin && (
                <>
                  <button 
                    onClick={() => forceNavigate("/users")}
                    style={{backgroundColor: '#1d4ed8', border: 'none', borderRadius: '4px', padding: '8px 12px', color: 'white', fontWeight: 500, textAlign: 'left', cursor: 'pointer', width: '100%'}}
                  >
                    Usuários
                  </button>
                  
                  <button 
                    onClick={() => forceNavigate("/settings")}
                    style={{backgroundColor: '#1d4ed8', border: 'none', borderRadius: '4px', padding: '8px 12px', color: 'white', fontWeight: 500, textAlign: 'left', cursor: 'pointer', width: '100%'}}
                  >
                    Configurações
                  </button>
                </>
              )}
            </div>
            
            <div style={{padding: '8px', fontSize: '12px', textAlign: 'center', color: '#bfdbfe', backgroundColor: '#1e3a8a'}}>
              SAM Climatiza &copy; 2025
            </div>
          </div>
        )}
      </header>

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 999}}
        />
      )}
    </div>
  );
}