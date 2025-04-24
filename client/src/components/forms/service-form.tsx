import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertServiceSchema, Client, Service, ServiceItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";

interface ServiceFormProps {
  service: Service | null;
  clients: Client[];
  onClose: () => void;
}

// Extend schema with service-specific validations
const serviceSchema = insertServiceSchema
  .extend({
    clientId: z.coerce.number().min(1, "Cliente é obrigatório"),
    serviceType: z.string().min(1, "Tipo de serviço é obrigatório"),
    status: z.string().min(1, "Status é obrigatório"),
    scheduledDate: z.date().optional().nullable(),
  });

// Service item schema
const serviceItemSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.string().min(1, "Tipo é obrigatório"),
  quantity: z.coerce.number().min(1, "Quantidade deve ser maior que zero"),
  unitPrice: z.coerce.number().min(0, "Valor unitário deve ser maior ou igual a zero"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;
type ServiceItemFormValues = z.infer<typeof serviceItemSchema>;

export function ServiceForm({ service, clients, onClose }: ServiceFormProps) {
  const { toast } = useToast();
  const isEditing = !!service;
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemForm, setItemForm] = useState<ServiceItemFormValues>({
    description: "",
    type: "material",
    quantity: 1,
    unitPrice: 0,
  });

  // Fetch service items if editing
  const { data: fetchedItems = [], isLoading: isLoadingItems } = useQuery<ServiceItem[]>({
    queryKey: [isEditing ? `/api/services/${service?.id}/items` : null],
    enabled: isEditing,
  });

  // Set items when fetched
  useState(() => {
    if (fetchedItems.length > 0 && serviceItems.length === 0) {
      setServiceItems(fetchedItems);
    }
  });

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: isEditing
      ? {
          clientId: service.clientId,
          serviceType: service.serviceType,
          description: service.description || "",
          status: service.status,
          scheduledDate: service.scheduledDate ? new Date(service.scheduledDate) : null,
        }
      : {
          clientId: 0,
          serviceType: "installation",
          description: "",
          status: "pending",
          scheduledDate: null,
        },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const res = await apiRequest("POST", "/api/services", data);
      return await res.json();
    },
    onSuccess: async (newService) => {
      // Create service items if any
      if (serviceItems.length > 0) {
        for (const item of serviceItems) {
          await apiRequest("POST", `/api/services/${newService.id}/items`, {
            ...item,
            serviceId: newService.id,
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Serviço criado",
        description: "O serviço foi criado com sucesso",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao criar serviço: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const res = await apiRequest("PUT", `/api/services/${service?.id}`, data);
      return await res.json();
    },
    onSuccess: async (updatedService) => {
      // Handle items updates separately if needed
      // This is a simplified approach - in a real app we'd track added/removed items
      
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: [`/api/services/${service?.id}/items`] });
      toast({
        title: "Serviço atualizado",
        description: "O serviço foi atualizado com sucesso",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar serviço: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormValues) => {
    if (isEditing) {
      updateServiceMutation.mutate(data);
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleAddItem = () => {
    // Calculate total
    const total = itemForm.quantity * itemForm.unitPrice;
    
    // Add item to list
    setServiceItems([
      ...serviceItems,
      {
        ...itemForm,
        id: 0, // Temporary ID, will be set by backend
        serviceId: service?.id || 0,
        total,
      },
    ]);
    
    // Reset form
    setItemForm({
      description: "",
      type: "material",
      quantity: 1,
      unitPrice: 0,
    });
    
    setIsAddingItem(false);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...serviceItems];
    newItems.splice(index, 1);
    setServiceItems(newItems);
  };

  const isPending = createServiceMutation.isPending || updateServiceMutation.isPending;

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Serviço</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="installation">Instalação</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="repair">Reparo</SelectItem>
                        <SelectItem value="inspection">Vistoria</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="canceled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Agendada</FormLabel>
                  <DatePicker
                    date={field.value as Date | undefined}
                    setDate={(date) => field.onChange(date)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o serviço a ser realizado"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Service Items */}
            <div className="mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span>Materiais e Serviços</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingItem(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isAddingItem ? (
                    <div className="space-y-3 border rounded-md p-3 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Descrição</label>
                          <Input
                            value={itemForm.description}
                            onChange={(e) =>
                              setItemForm({ ...itemForm, description: e.target.value })
                            }
                            placeholder="Descrição do item"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Tipo</label>
                          <Select
                            value={itemForm.type}
                            onValueChange={(value) =>
                              setItemForm({ ...itemForm, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="material">Material</SelectItem>
                              <SelectItem value="labor">Mão de obra</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Quantidade</label>
                          <Input
                            type="number"
                            value={itemForm.quantity}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                quantity: parseInt(e.target.value) || 0,
                              })
                            }
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Valor Unitário (R$)</label>
                          <Input
                            type="number"
                            value={itemForm.unitPrice / 100}
                            onChange={(e) =>
                              setItemForm({
                                ...itemForm,
                                unitPrice: Math.round(parseFloat(e.target.value) * 100) || 0,
                              })
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingItem(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddItem}
                          disabled={
                            !itemForm.description ||
                            !itemForm.type ||
                            itemForm.quantity < 1
                          }
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {serviceItems.length > 0 ? (
                    <div className="mt-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Descrição</th>
                              <th className="text-left py-2">Tipo</th>
                              <th className="text-right py-2">Qtd</th>
                              <th className="text-right py-2">Valor Unit.</th>
                              <th className="text-right py-2">Total</th>
                              <th className="text-right py-2">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {serviceItems.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-2">{item.description}</td>
                                <td className="py-2">
                                  {item.type === "material" ? "Material" : "Mão de obra"}
                                </td>
                                <td className="py-2 text-right">{item.quantity}</td>
                                <td className="py-2 text-right">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="py-2 text-right">
                                  {formatCurrency(item.total)}
                                </td>
                                <td className="py-2 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveItem(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t font-medium">
                              <td colSpan={4} className="py-2 text-right">
                                Total:
                              </td>
                              <td className="py-2 text-right">
                                {formatCurrency(
                                  serviceItems.reduce((sum, item) => sum + item.total, 0)
                                )}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-gray-500 text-sm">
                      Nenhum item adicionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Atualizando..." : "Criando..."}
                  </>
                ) : (
                  isEditing ? "Atualizar" : "Criar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Cliente:</p>
                <p className="text-gray-600">
                  {clients.find(c => c.id === form.watch("clientId"))?.name || "Selecione um cliente"}
                </p>
              </div>
              <div>
                <p className="font-medium">Tipo de Serviço:</p>
                <p className="text-gray-600">
                  {form.watch("serviceType") === "installation" ? "Instalação" :
                   form.watch("serviceType") === "maintenance" ? "Manutenção" :
                   form.watch("serviceType") === "repair" ? "Reparo" :
                   form.watch("serviceType") === "inspection" ? "Vistoria" :
                   form.watch("serviceType")}
                </p>
              </div>
              <div>
                <p className="font-medium">Status:</p>
                <p className="text-gray-600">
                  {form.watch("status") === "pending" ? "Pendente" :
                   form.watch("status") === "scheduled" ? "Agendado" :
                   form.watch("status") === "in_progress" ? "Em andamento" :
                   form.watch("status") === "completed" ? "Concluído" :
                   form.watch("status") === "canceled" ? "Cancelado" :
                   form.watch("status")}
                </p>
              </div>
              {form.watch("scheduledDate") && (
                <div>
                  <p className="font-medium">Data Agendada:</p>
                  <p className="text-gray-600">
                    {form.watch("scheduledDate")?.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              <div>
                <p className="font-medium">Total de Itens:</p>
                <p className="text-gray-600">
                  {serviceItems.length} itens
                </p>
              </div>
              <div>
                <p className="font-medium">Valor Total:</p>
                <p className="font-medium text-primary-600">
                  {formatCurrency(serviceItems.reduce((sum, item) => sum + item.total, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
