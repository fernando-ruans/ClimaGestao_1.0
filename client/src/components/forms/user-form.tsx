import { User } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Esquema de validação do formulário de usuário
const userFormSchema = z.object({
  username: z.string().min(3, 'O nome de usuário deve ter pelo menos 3 caracteres'),
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Digite um email válido'),
  password: z.string().optional(),
  role: z.enum(['admin', 'technician']),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!user;

  // Configuração do formulário
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: user?.username || '',
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role as 'admin' | 'technician' || 'technician',
    },
  });

  // Mutação para criar/editar usuário
  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      // Se for edição e a senha estiver vazia, remova-a do payload
      if (isEditing && !values.password) {
        const { password, ...dataWithoutPassword } = values;
        return await apiRequest(
          'PUT',
          `/api/users/${user.id}`,
          dataWithoutPassword
        ).then(res => res.json());
      }

      // Para criação ou edição com senha
      return isEditing
        ? await apiRequest('PUT', `/api/users/${user.id}`, values).then(res => res.json())
        : await apiRequest('POST', '/api/users', values).then(res => res.json());
    },
    onSuccess: () => {
      // Invalidar cache de usuários para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: isEditing ? 'Usuário atualizado' : 'Usuário criado',
        description: isEditing 
          ? 'O usuário foi atualizado com sucesso.'
          : 'O novo usuário foi criado com sucesso.',
      });
      
      // Limpar formulário e executar callback de sucesso
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: isEditing ? 'Erro ao atualizar usuário' : 'Erro ao criar usuário',
        description: `${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handler de submit
  function onSubmit(values: UserFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuário</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite o nome de usuário" 
                    {...field} 
                    disabled={isEditing || mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite o nome completo" 
                    {...field} 
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Digite o email" 
                  {...field} 
                  disabled={mutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditing ? 'Nova Senha (opcional)' : 'Senha'}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={isEditing ? "Deixe em branco para manter a senha atual" : "Digite a senha"}
                  {...field}
                  disabled={mutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={mutation.isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="technician">Técnico</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar Usuário' : 'Criar Usuário'}
          </Button>
        </div>
      </form>
    </Form>
  );
}