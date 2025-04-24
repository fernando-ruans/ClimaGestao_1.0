import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertWorkOrderSchema, Client, WorkOrder, Service, ServiceItem, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileText, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PDFPreview } from "@/components/pdf/pdf-preview";

interface WorkOrderFormProps {
  workOrder: WorkOrder | null;
  clients: Client[];
  users: User[];
  onClose: () => void;
}

// Extend schema with work order specific validations
const workOrderSchema = insertWorkOrderSchema
  .extend({
    clientId: z.coerce.number().min(1, "Cliente é obrigatório"),
    serviceId: z.coerce.number().nullable().optional(),
    status: z.string().min(1, "Status é obrigatório"),
    technicianIds: z.array(z.string()).optional(),
    scheduledDate: z.date().nullable().optional(),
    completedDate: z.date().nullable().optional(),
  });

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

export function WorkOrderForm({ workOrder, clients, users, onClose }: WorkOrderFormProps) {
  const { toast } = useToast();
  const isEditing = !!workOrder;
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(
    workOrder?.clientId
  );

  // Fetch services for selected client
  const { 
    data: services = [],
    isLoading: isLoadingServices,
  } = useQuery<Service[]>({
    queryKey: selectedClientId ? ["/api/services", selectedClientId] : null,
    queryFn: async () => {
      if (!selectedClientId) return [];
      const res = await fetch(`/api/services?clientId=${selectedClientId}`);
      if (!res.ok) throw new Error("Falha ao buscar serviços");
      return res.json();
    },
    enabled: !!selectedClientId,
  });

  // Fetch service items if a service is selected
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(
    workOrder?.serviceId || undefined
  );

  const { 
    data: serviceItems = [],
    isLoading: isLoadingServiceItems,
  } = useQuery<ServiceItem[]>({
    queryKey: selectedServiceId ? ["/api/services", selectedServiceId, "items"] : null,
    queryFn: async () => {
      if (!selectedServiceId) return [];
      const res = await fetch(`/api/services/${selectedServiceId}/items`);
      if (!res.ok) throw new Error("Falha ao buscar itens do serviço");
      return res.json();
    },
    enabled: !!selectedServiceId,
  });

  // Form setup
  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      clientId: workOrder?.clientId || 0,
      serviceId: workOrder?.serviceId || null,
      description: workOrder?.description || "",
      status: workOrder?.status || "pending",
      technicianIds: workOrder?.technicianIds || [],
      scheduledDate: workOrder?.scheduledDate ? new Date(workOrder.scheduledDate) : null,
      completedDate: workOrder?.completedDate ? new Date(workOrder.completedDate) : null,
    },
  });

  // Reset form when workOrder changes
  useEffect(() => {
    if (workOrder) {
      setSelectedClientId(workOrder.clientId);
      setSelectedServiceId(workOrder.serviceId || undefined);
      
      form.reset({
        clientId: workOrder.clientId,
        serviceId: workOrder.serviceId,
        description: workOrder.description || "",
        status: workOrder.status,
        technicianIds: workOrder.technicianIds || [],
        scheduledDate: workOrder.scheduledDate ? new Date(workOrder.scheduledDate) : null,
        completedDate: workOrder.completedDate ? new Date(workOrder.completedDate) : null,
      });
    } else {
      form.reset({
        clientId: 0,
        serviceId: null,
        description: "",
        status: "pending",
        technicianIds: [],
        scheduledDate: null,
        completedDate: null,
      });
    }
  }, [workOrder, form]);

  // Create work order mutation
  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: WorkOrderFormValues) => {
      const res = await apiRequest("POST", "/api/work-orders", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Ordem de serviço criada",
        description: "A ordem de serviço foi criada com sucesso",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao criar ordem de serviço: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update work order mutation
  const updateWorkOrderMutation = useMutation({
    mutationFn: async (data: WorkOrderFormValues) => {
      const res = await apiRequest("PUT", `/api/work-orders/${workOrder?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Ordem de serviço atualizada",
        description: "A ordem de serviço foi atualizada com sucesso",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar ordem de serviço: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Generate PDF mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (workOrderId: number) => {
      const res = await apiRequest("POST", `/api/work-orders/${workOrderId}/generate-pdf`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "PDF Gerado",
        description: "O PDF da ordem de serviço foi gerado com sucesso",
      });
      setPdfUrl(data.pdfPath);
      setIsPdfPreviewOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao gerar PDF: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  const onSubmit = (data: WorkOrderFormValues) => {
    // Make sure to exclude empty arrays or objects that would fail validation
    const formData = {
      ...data,
      technicianIds: data.technicianIds || [],
    };

    if (isEditing) {
      updateWorkOrderMutation.mutate(formData);
    } else {
      createWorkOrderMutation.mutate(formData);
    }
  };

  const isPending = 
    createWorkOrderMutation.isPending || 
    updateWorkOrderMutation.isPending || 
    generatePdfMutation.isPending;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h3 className="text-lg font-medium mb-4">Informações da Ordem</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        setSelectedClientId(parseInt(value));
                        // Reset service when client changes
                        form.setValue("serviceId", null);
                        setSelectedServiceId(undefined);
                      }} 
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
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
              
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço Associado</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        const serviceId = value === "none" ? null : parseInt(value);
                        field.onChange(serviceId);
                        setSelectedServiceId(serviceId || undefined);
                      }} 
                      defaultValue={field.value ? field.value.toString() : "none"}
                      disabled={!selectedClientId || isLoadingServices}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um serviço (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {`#${service.id} - ${service.serviceType} - ${service.description?.substring(0, 30) || ""}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
            </div>

            <FormField
              control={form.control}
              name="technicianIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Técnicos Designados</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {users
                      .filter(user => user.isActive)
                      .map((user) => (
                        <FormField
                          key={user.id}
                          control={form.control}
                          name="technicianIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={user.id}
                                className="flex flex-row items-start space-x-3 space-y-0 p-2 border rounded-md"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(user.id.toString())}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      const updatedValue = checked
                                        ? [...currentValue, user.id.toString()]
                                        : currentValue.filter((id) => id !== user.id.toString());
                                      field.onChange(updatedValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer text-sm">
                                  {user.name}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                  </div>
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
                      placeholder="Descreva a ordem de serviço"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedServiceId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Itens do Serviço Associado</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingServiceItems ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : serviceItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Descrição</th>
                            <th className="text-left py-2">Tipo</th>
                            <th className="text-right py-2">Qtd</th>
                            <th className="text-right py-2">Valor Unit.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceItems.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="py-2">{item.description}</td>
                              <td className="py-2">
                                {item.type === "material" ? "Material" : "Mão de obra"}
                              </td>
                              <td className="py-2 text-right">{item.quantity}</td>
                              <td className="py-2 text-right">
                                {(item.unitPrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-gray-500 text-sm">
                      Este serviço não possui itens cadastrados
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
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
        <h3 className="text-lg font-medium mb-4">Ações</h3>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {isEditing && (
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => generatePdfMutation.mutate(workOrder!.id)}
                disabled={isPending}
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
            )}
            
            {isEditing && workOrder?.status === "pending" && (
              <Button
                className="w-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                variant="outline"
                onClick={() => {
                  form.setValue("status", "in_progress");
                  form.handleSubmit(onSubmit)();
                }}
                disabled={isPending}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Iniciar Serviço
              </Button>
            )}
            
            {isEditing && workOrder?.status === "in_progress" && (
              <Button
                className="w-full bg-green-100 text-green-800 hover:bg-green-200"
                variant="outline"
                onClick={() => {
                  form.setValue("status", "completed");
                  form.setValue("completedDate", new Date());
                  form.handleSubmit(onSubmit)();
                }}
                disabled={isPending}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Concluir Serviço
              </Button>
            )}
            
            {isEditing && (workOrder?.status === "pending" || workOrder?.status === "in_progress") && (
              <Button
                className="w-full bg-red-100 text-red-800 hover:bg-red-200"
                variant="outline"
                onClick={() => {
                  form.setValue("status", "cancelled");
                  form.handleSubmit(onSubmit)();
                }}
                disabled={isPending}
              >
                Cancelar Serviço
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      
      <PDFPreview
        pdfUrl={pdfUrl}
        open={isPdfPreviewOpen}
        onOpenChange={setIsPdfPreviewOpen}
        title="Visualização da Ordem de Serviço"
      />
    </div>
  );
}