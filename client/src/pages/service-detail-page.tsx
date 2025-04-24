import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Service, Client, ServiceItem } from "@shared/schema";
import { Loader2, ChevronLeft, Edit, Clock, User, Wrench, CalendarIcon, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PdfViewer } from "@/lib/pdf-viewer";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const serviceId = parseInt(id);

  // PDF generation mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      // Usar fetch diretamente em vez de apiRequest
      console.log("Fazendo requisição para:", `api/services/${serviceId}/generate-pdf`);
      const res = await fetch(`/api/services/${serviceId}/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ao gerar PDF: ${res.status} ${res.statusText}`);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services", serviceId] });
      toast({
        title: "PDF Gerado",
        description: "O PDF da ordem de serviço foi gerado com sucesso",
      });
      
      // Abrir o PDF usando o utilitário multiplataforma
      if (data.pdfPath) {
        PdfViewer.openPdf(data.pdfPath);
      }
    },
    onError: (error: any) => {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: `Falha ao gerar PDF: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Fetch service details
  const { 
    data: service, 
    isLoading: isLoadingService,
    error: serviceError
  } = useQuery<Service>({
    queryKey: ["/api/services", serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar os detalhes do serviço.");
      }
      return res.json();
    },
    enabled: !isNaN(serviceId)
  });

  // Fetch client details
  const {
    data: client,
    isLoading: isLoadingClient
  } = useQuery<Client>({
    queryKey: ["/api/clients", service?.clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${service?.clientId}`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar os dados do cliente.");
      }
      return res.json();
    },
    enabled: !!service?.clientId
  });

  // Fetch service items
  const {
    data: serviceItems = [],
    isLoading: isLoadingItems
  } = useQuery<ServiceItem[]>({
    queryKey: ["/api/services", serviceId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/services/${serviceId}/items`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar os itens do serviço.");
      }
      return res.json();
    },
    enabled: !isNaN(serviceId)
  });

  // Handle generate PDF
  const handleGeneratePDF = () => {
    if (serviceId) {
      generatePdfMutation.mutate(serviceId);
    }
  };

  // Get translated status string
  function getStatusLabel(status: string): string {
    switch (status) {
      case "pending": return "Pendente";
      case "scheduled": return "Agendado";
      case "in_progress": return "Em andamento";
      case "completed": return "Concluído";
      case "canceled": return "Cancelado";
      default: return status;
    }
  }

  // Get translated service type
  function getServiceTypeLabel(type: string): string {
    switch (type) {
      case "installation": return "Instalação";
      case "maintenance": return "Manutenção";
      case "repair": return "Reparo";
      case "inspection": return "Vistoria";
      default: return type;
    }
  }

  // Get appropriate status badge styling
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-800";
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "canceled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  // Handle error state
  if (serviceError) {
    return (
      <DashboardLayout>
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/services")} 
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar para serviços
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <div className="text-red-500 mb-4 flex items-center">
              <Wrench className="h-16 w-16" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao carregar serviço
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Não foi possível carregar os detalhes do serviço solicitado.
            </p>
            <Button onClick={() => navigate("/services")}>
              Voltar para lista de serviços
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Loading state
  if (isLoadingService || isLoadingClient || isLoadingItems) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando detalhes do serviço...</span>
        </div>
      </DashboardLayout>
    );
  }

  // If service not found
  if (!service) {
    return (
      <DashboardLayout>
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/services")} 
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar para serviços
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <div className="text-gray-400 mb-4 flex items-center">
              <Wrench className="h-16 w-16" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Serviço não encontrado
            </h2>
            <p className="text-gray-600 text-center mb-6">
              O serviço solicitado não existe ou não está disponível.
            </p>
            <Button onClick={() => navigate("/services")}>
              Voltar para lista de serviços
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Calculate total value
  const totalValue = serviceItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <DashboardLayout>
      {/* Header with navigation and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <Button variant="ghost" onClick={() => navigate("/services")} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">
            Serviço #{service.id}
          </h1>
          <Badge className={`ml-3 ${getStatusBadgeClass(service.status)}`}>
            {getStatusLabel(service.status)}
          </Badge>
        </div>
        <div className="flex">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={() => navigate(`/services?edit=${service.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          
          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={generatePdfMutation.isPending}
            className="mr-2"
          >
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          
          {service.pdfPath && (
            <Button 
              variant="default"
              onClick={() => PdfViewer.openPdf(service.pdfPath!)}
              className="inline-flex items-center h-10 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          )}
        </div>
      </div>

      {/* Service information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tipo de Serviço</h3>
                <p className="flex items-center">
                  <Wrench className="h-4 w-4 mr-2 text-gray-500" />
                  {getServiceTypeLabel(service.serviceType)}
                </p>
              </div>

              {service.scheduledDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Data Agendada</h3>
                  <p className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {new Date(service.scheduledDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Data de Criação</h3>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  {new Date(service.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Última Atualização</h3>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  {new Date(service.updatedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {service.description && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Descrição</h3>
                  <p className="text-gray-800 whitespace-pre-line">
                    {service.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Client info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {client ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Nome</h3>
                  <p className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    {client.name}
                  </p>
                </div>
                
                {client.contactName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Contato</h3>
                    <p>{client.contactName}</p>
                  </div>
                )}
                
                {client.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Telefone</h3>
                    <p>{client.phone}</p>
                  </div>
                )}
                
                {client.email && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p>{client.email}</p>
                  </div>
                )}
                
                {client.address && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Endereço</h3>
                    <p>
                      {client.address}
                      {(client.city || client.state) && (
                        <>
                          <br />
                          {client.city}{client.city && client.state && ', '}{client.state} {client.zip}
                        </>
                      )}
                    </p>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate(`/clients`)}
                >
                  Ver Detalhes do Cliente
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">Informações do cliente não disponíveis</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Itens do Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd.</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serviceItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.type === 'material' ? 'Material' : 'Mão de obra'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-6 py-4"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 text-right">Valor Total:</td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-primary-700 text-right">
                      {formatCurrency(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500">
              Este serviço não possui itens cadastrados
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}