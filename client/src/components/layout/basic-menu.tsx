import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Menu, X } from "lucide-react";
import logoImg from "@/assets/logo.png";

// Menu super-simples sem qualquer dependência de CSS externo
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  const isAdmin = user?.role === 'admin';

  // Toggle menu
  function toggleMenu() {
    setIsOpen(!isOpen);
  }

  // Logout
  function handleLogout() {
    logoutMutation.mutate();
    setIsOpen(false);
  }

  // Navegação forçada via script
  function goTo(path: string) {
    const currentPath = window.location.pathname;
    
    // Se já estivermos nesta página, apenas fechamos o menu
    if (currentPath === path) {
      setIsOpen(false);
      return;
    }
    
    // Caso contrário, forçamos a navegação
    try {
      window.location.href = window.location.origin + path;
    } catch (e) {
      console.error("Erro ao navegar:", e);
      window.location.replace(path);
    }
  }

  return (
    <>
      {/* Menu wrapper */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 9999,
        display: window.innerWidth >= 1024 ? 'none' : 'block'
      }}>
        {/* Barra superior */}
        <div style={{
          background: 'linear-gradient(to right, #2563eb, #1e40af)',
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <img src={logoImg} alt="Logo" style={{
              height: '40px',
              marginRight: '8px'
            }} />
            <span style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>SAM Climatiza</span>
          </div>
          
          {/* Botão do menu */}
          <button onClick={toggleMenu} style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer'
          }}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Menu dropdown */}
        {isOpen && (
          <div style={{
            width: '100%',
            backgroundColor: '#1e40af',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Info do usuário */}
            <div style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1d4ed8'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                marginRight: '12px'
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{flex: 1}}>
                <div style={{
                  color: 'white',
                  fontWeight: 'bold'
                }}>{user?.name}</div>
                <div style={{
                  color: '#bfdbfe',
                  fontSize: '14px'
                }}>{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</div>
              </div>
              <button onClick={handleLogout} style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                padding: '8px',
                cursor: 'pointer'
              }}>
                <LogOut size={20} />
              </button>
            </div>
            
            {/* Links de navegação */}
            <div style={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <button onClick={() => goTo("/")} style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1d4ed8',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer'
              }}>
                Dashboard
              </button>
              
              <button onClick={() => goTo("/services")} style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1d4ed8',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer'
              }}>
                Serviços
              </button>
              
              <button onClick={() => goTo("/clients")} style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1d4ed8',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer'
              }}>
                Clientes
              </button>
              
              <button onClick={() => goTo("/quotes")} style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1d4ed8',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer'
              }}>
                Orçamentos
              </button>
              
              <button onClick={() => goTo("/work-orders")} style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1d4ed8',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer'
              }}>
                Ordens de Serviço
              </button>
              
              {isAdmin && (
                <>
                  <button onClick={() => goTo("/users")} style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1d4ed8',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}>
                    Usuários
                  </button>
                  
                  <button onClick={() => goTo("/settings")} style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1d4ed8',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}>
                    Configurações
                  </button>
                </>
              )}
            </div>
            
            {/* Rodapé */}
            <div style={{
              padding: '8px',
              backgroundColor: '#1e3a8a',
              color: '#bfdbfe',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              SAM Climatiza &copy; 2025
            </div>
          </div>
        )}
      </div>
      
      {/* Overlay para fechar o menu ao clicar fora */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            zIndex: 1000
          }}
        />
      )}
    </>
  );
}