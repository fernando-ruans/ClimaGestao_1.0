import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { sqliteRepository } from '@/lib/sqlite-repository';
import { useToast } from './use-toast';

// Interface para o contexto
interface SQLiteContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

// Criando o contexto
const SQLiteContext = createContext<SQLiteContextType | undefined>(undefined);

// Provedor do contexto
export function SQLiteProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function initSQLite() {
      try {
        // Inicializa o SQLite
        const result = await sqliteRepository.initialize();
        
        if (result) {
          setIsInitialized(true);
          // Log apenas para desenvolvimento
          console.log('SQLite inicializado com sucesso!');
          
          if (Capacitor.isNativePlatform()) {
            toast({
              title: 'Banco de dados local inicializado',
              description: 'Aplicativo pronto para uso offline',
              duration: 3000
            });
          }
        } else {
          throw new Error('Falha ao inicializar o SQLite');
        }
      } catch (err: any) {
        console.error('Erro ao inicializar SQLite:', err);
        setError(err.message || 'Erro desconhecido ao inicializar o banco de dados');
        
        toast({
          title: 'Erro de inicialização',
          description: 'Não foi possível inicializar o banco de dados local',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }

    initSQLite();

    // Limpeza ao desmontar o componente
    return () => {
      // Fecha a conexão com o SQLite, se necessário
      if (isInitialized) {
        // Implementar se necessário
      }
    };
  }, [toast]);

  return (
    <SQLiteContext.Provider value={{ isInitialized, isLoading, error }}>
      {children}
    </SQLiteContext.Provider>
  );
}

// Hook para usar o contexto
export function useSQLite() {
  const context = useContext(SQLiteContext);
  if (context === undefined) {
    throw new Error('useSQLite deve ser usado dentro de um SQLiteProvider');
  }
  return context;
}