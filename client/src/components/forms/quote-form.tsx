import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuoteSchema, Client, Quote, QuoteItem, Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PDFPreview } from "@/components/pdf/pdf-preview";

interface QuoteFormProps {
  quote: Quote | null;
  clients: Client[];
  onClose: () => void;
}

// Extend schema with quote-specific validations
const quoteSchema = insertQuoteSchema
  .extend({
    clientId: z.coerce.number().min(1, "Cliente é obrigatório"),
    total: z.coerce.number().default(0),
    status: z.string().min(1, "Status é obrigatório"),
    validUntil: z.date().optional().nullable(),
  });

// Quote item schema
const quoteItemSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.string().min(1, "Tipo é obrigatório"),
  quantity: z.coerce.number().min(1, "Quantidade deve ser maior que zero"),
  unitPrice: z.coerce.number().min(0, "Valor unitário deve ser maior ou igual a zero"),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;
type QuoteItemFormValues = z.infer<typeof quoteItemSchema>;

export function QuoteForm({ quote, clients, onClose }: QuoteFormProps) {
  const { toast } = useToast();
  const isEditing = !!quote;
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [itemForm, setItemForm] = useState<QuoteItemFormValues>({
    description: "",
    type: "material",
    quantity: 1,
    unitPrice: 0,
  });

  // Fetch services for the selected client
  const [selectedClientId, setSelectedClientId] = useState<number>(quote?.clientId || 0);
  
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: selectedClientId ? [`/api/services?clientId=${selectedClientId}`] : null,
    enabled: !!selectedClientId,
  });

  // Fetch quote items if editing
  const { data: fetchedItems = [], isLoading: isLoadingItems } = useQuery<QuoteItem[]>({
    queryKey: [isEditing ? `/api/quotes/${quote?.id}/items` : null],
    enabled: isEditing,
  });

  // Set items when fetched
  useState(() => {
    if (fetchedItems.length > 0 && quoteItems.length === 0) {
      setQuoteItems(fetchedItems);
    }
  });

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: isEditing
      ? {
          clientId: quote.clientId,
          serviceId: quote.serviceId,
          description: quote.description || "",
          status: quote.status,
          validUntil: quote.validUntil ? new Date(quote.validUntil) : null,
          total: quote.total,
        }
      : {
          clientId: 0,
          serviceId: undefined,
          description: "",
          status: "pending",
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          total: 0,
        },
  });

  // Update total when quote items change
  useState(() => {
    const total = quoteItems.reduce((sum, item) => sum + item.total, 0);
    form.setValue("total", total);
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormValues) => {
      const res = await apiRequest("POST", "/api/quotes", data);
      return await res.json();
    },
    onSuccess: async (newQuote) => {
      // Create quote items if any
      if (quoteItems.length > 0) {
        for (const item of quoteItems) {
          await apiRequest("POST", `/api/quotes/${newQuote.id}/items`, {
            ...item,
            quoteId: newQuote.id,
          });
        }
      }
      
      // Generate PDF if items exist
      if (quoteItems.length > 0) {
        try {
          const pdfRes = await apiRequest("POST", `/api/quotes/${newQuote.id}/generate-pdf`);
          const pdfData = await pdfRes.json();
          setPdfUrl(pdfData.pdfPath);
        } catch (error) {
          console.error("Failed to generate PDF:", error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Orçamento criado",
        description: "O orçamento foi criado com sucesso",
      });
      
      if (quoteItems.length > 0) {
        setIsPdfPreviewOpen(true);
      } else {
        onClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao criar orçamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormValues) => {
      const res = await apiRequest("PUT", `/api/quotes/${quote?.id}`, data);
      return await res.json();
    },
    onSuccess: async (updatedQuote) => {
      // Handle items updates separately if needed
      
      // Generate updated PDF if items exist
      if (quoteItems.length > 0) {
        try {
          const pdfRes = await apiRequest("POST", `/api/quotes/${updatedQuote.id}/generate-pdf`);
          const pdfData = await pdfRes.json();
          setPdfUrl(pdfData.pdfPath);
        } catch (error) {
          console.error("Failed to generate PDF:", error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotes/${quote?.id}/items`] });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento foi atualizado com sucesso",
      });
      
      if (quoteItems.length > 0) {
        setIsPdfPreviewOpen(true);
      } else {
        onClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar orçamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuoteFormValues) => {
    // Calculate total from items
    const total = quoteItems.reduce((sum, item) => sum + item.total, 0);
    data.total = total;
    
    if (isEditing) {
      updateQuoteMutation.mutate(data);
    } else {
      createQuoteMutation.mutate(data);
    }
  };

  const handleAddItem = () => {
    // Calculate total
    const total = itemForm.quantity * itemForm.unitPrice;
    
    // Add item to list
    setQuoteItems([
      ...quoteItems,
      {
        ...itemForm,
        id: 0, // Temporary ID, will be set by backend
        quoteId: quote?.id || 0,
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
    const newItems = [...quoteItems];
    newItems.splice(index, 1);
    setQuoteItems(newItems);
    
    // Update form total
    const total = newItems.reduce((sum, item) => sum + item.total, 0);
    form.setValue("total", total);
  };

  const handleClientChange = (clientId: number) => {
    setSelectedClientId(clientId);
    form.setValue("clientId", clientId);
    
    // Reset service ID when client changes
    form.setValue("serviceId", undefined);
  };

  const isPending = createQuoteMutation.isPending || updateQuoteMutation.isPending;

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <>
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
                      onValueChange={(value) => handleClientChange(parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
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
              
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço Relacionado (Opcional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
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
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="rejected">Recusado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Válido até</FormLabel>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o orçamento"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Quote Items */}
              <div className="mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <span>Itens do Orçamento</span>
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

                    {quoteItems.length > 0 ? (
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
                              {quoteItems.map((item, index) => (
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
                                    quoteItems.reduce((sum, item) => sum + item.total, 0)
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
              <CardTitle>Detalhes do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Cliente:</p>
                  <p className="text-gray-600">
                    {clients.find(c => c.id === form.watch("clientId"))?.name || "Selecione um cliente"}
                  </p>
                </div>
                {form.watch("serviceId") && (
                  <div>
                    <p className="font-medium">Serviço Relacionado:</p>
                    <p className="text-gray-600">
                      {`#${form.watch("serviceId")}`}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-medium">Status:</p>
                  <p className="text-gray-600">
                    {form.watch("status") === "pending" ? "Pendente" :
                     form.watch("status") === "approved" ? "Aprovado" :
                     form.watch("status") === "rejected" ? "Recusado" :
                     form.watch("status")}
                  </p>
                </div>
                {form.watch("validUntil") && (
                  <div>
                    <p className="font-medium">Válido até:</p>
                    <p className="text-gray-600">
                      {form.watch("validUntil")?.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-medium">Total de Itens:</p>
                  <p className="text-gray-600">
                    {quoteItems.length} itens
                  </p>
                </div>
                <div>
                  <p className="font-medium">Valor Total:</p>
                  <p className="font-medium text-primary-600">
                    {formatCurrency(quoteItems.reduce((sum, item) => sum + item.total, 0))}
                  </p>
                </div>
              </div>

              {isEditing && quote.pdfPath && (
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      setPdfUrl(quote.pdfPath || "");
                      setIsPdfPreviewOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Visualizar PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PDFPreview
        pdfUrl={pdfUrl}
        open={isPdfPreviewOpen}
        onOpenChange={setIsPdfPreviewOpen}
        title="Visualização do Orçamento"
      />
    </>
  );
}
