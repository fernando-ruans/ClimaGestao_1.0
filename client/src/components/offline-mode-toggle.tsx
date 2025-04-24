import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Wifi, WifiOff } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export function OfflineModeToggle() {
  const { isOfflineMode, toggleOfflineMode } = useAuth();
  
  // Só mostrar esse componente em plataformas nativas (Android/iOS)
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  
  return (
    <div className="flex items-center space-x-2 mt-4 mb-4 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-center w-8 h-8">
        {isOfflineMode ? (
          <WifiOff className="h-5 w-5 text-orange-500" />
        ) : (
          <Wifi className="h-5 w-5 text-green-500" />
        )}
      </div>
      <div className="flex-1">
        <Label htmlFor="offline-mode">Modo Offline</Label>
        <p className="text-xs text-muted-foreground">
          {isOfflineMode 
            ? "Usando banco de dados local" 
            : "Conectado ao servidor"}
        </p>
      </div>
      <Switch
        id="offline-mode"
        checked={isOfflineMode}
        onCheckedChange={toggleOfflineMode}
      />
    </div>
  );
}