import React, { useState } from 'react';
import { User } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ImageUpload } from '@/components/ui/image-upload';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, User as UserIcon, Camera, UserPlus } from 'lucide-react';
import { UserForm } from '@/components/forms/user-form';

export function UserManagement({ users }: { users: User[] }) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openPhotoDialog, setOpenPhotoDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openNewUserDialog, setOpenNewUserDialog] = useState(false);

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ userId, file }: { userId: number; file: File }) => {
      try {
        const formData = new FormData();
        formData.append('photo', file);
        
        console.log(`Enviando foto para usuário ${userId}`);
        
        const response = await fetch(`/api/users/${userId}/photo`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro no upload da foto: ${response.status} - ${errorText || response.statusText}`);
          throw new Error(errorText || `Erro ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Upload de foto bem-sucedido:', result);
        return result;
      } catch (error: any) {
        console.error('Erro ao processar upload de foto:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Foto atualizada',
        description: 'A foto do usuário foi atualizada com sucesso.',
      });
      
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Fechar o diálogo
      setOpenPhotoDialog(false);
    },
    onError: (error) => {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: `Ocorreu um erro: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setOpenEditDialog(true);
  };

  const handleOpenPhotoDialog = (user: User) => {
    setSelectedUser(user);
    setOpenPhotoDialog(true);
  };

  const handleImageUpload = (file: File | null) => {
    if (!selectedUser) return;
    if (!file) return;
    
    uploadPhotoMutation.mutate({ userId: selectedUser.id, file });
  };

  const handleFormSuccess = () => {
    setOpenEditDialog(false);
    setOpenNewUserDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        <Button onClick={() => setOpenNewUserDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>
      
      <ResponsiveContainer columns={{ sm: 1, md: 2, lg: 3 }}>
        {users.map(user => (
          <Card key={user.id} className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{user.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2" 
                  onClick={() => handleOpenPhotoDialog(user)}
                >
                  <Camera size={16} className="mr-1" />
                  {isMobile ? '' : 'Foto'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={user.photoUrl || undefined} alt={user.name} />
                  <AvatarFallback>
                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role === 'admin' ? 'Administrador' : 'Técnico'}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-2 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleUserSelect(user)}
                  className="w-full sm:w-auto"
                >
                  <Pencil size={16} className="mr-2" />
                  Editar Usuário
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </ResponsiveContainer>

      {/* Diálogo para upload de foto */}
      <Dialog open={openPhotoDialog} onOpenChange={setOpenPhotoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar foto de perfil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <ImageUpload 
              defaultImage={selectedUser?.photoUrl || null}
              onImageUpload={handleImageUpload}
              disabled={uploadPhotoMutation.isPending}
            />
            
            {uploadPhotoMutation.isPending && (
              <div className="text-center text-sm text-muted-foreground">
                Enviando foto...
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenPhotoDialog(false)}
              disabled={uploadPhotoMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para edição de usuário */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <UserForm 
              user={selectedUser} 
              onSuccess={handleFormSuccess}
              onCancel={() => setOpenEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para novo usuário */}
      <Dialog open={openNewUserDialog} onOpenChange={setOpenNewUserDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          
          <UserForm 
            onSuccess={handleFormSuccess}
            onCancel={() => setOpenNewUserDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}