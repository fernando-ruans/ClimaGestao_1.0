import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowLeft, Download } from "lucide-react";
import { Quote, QuoteItem, Client } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PdfViewer } from "@/lib/pdf-viewer";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const quoteId = parseInt(id);

  // Fetch quote details
  const { 
    data: quote,
    isLoading: isLoadingQuote,
    isError: isQuoteError
  } = useQuery<Quote>({
    queryKey: ["/api/quotes", quoteId],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/${quoteId}`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar os detalhes do orçamento.");
      }
      return res.json();
    },
    enabled: !!quoteId && !isNaN(quoteId)
  });

  // Fetch quote items
  const { 
    data: quoteItems = [],
    isLoading: isLoadingItems 
  } = useQuery<QuoteItem[]>({
    queryKey: ["/api/quotes", quoteId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/${quoteId}/items`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar os itens do orçamento.");
      }
      return res.json();
    },
    enabled: !!quoteId && !isNaN(quoteId)
  });

  // Fetch client details
  const { 
    data: client,
    isLoading: isLoadingClient
  } = useQuery<Client>({
    queryKey: ["/api/clients", quote?.clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${quote?.clientId}`);
      if (!res.ok) {
        throw new Error("Não foi possível carregar os dados do cliente.");
      }
      return res.json();
    },
    enabled: !!quote?.clientId
  });

  const generatePdfMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      // Usar fetch diretamente em vez de apiRequest
      console.log("Fazendo requisição para:", `api/quotes/${quoteId}/generate-pdf`);
      const res = await fetch(`/api/quotes/${quoteId}/generate-pdf`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", quoteId] });
      toast({
        title: "PDF Gerado",
        description: "O PDF do orçamento foi gerado com sucesso",
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

  // Handle generate PDF
  const handleGeneratePDF = () => {
    if (quoteId) {
      generatePdfMutation.mutate(quoteId);
    }
  };

  // Return to quotes page
  const handleBack = () => {
    navigate("/quotes");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprovado";
      case "pending":
        return "Pendente";
      case "rejected":
        return "Recusado";
      default:
        return status;
    }
  };

  // If error
  if (isQuoteError) {
    return (
      <DashboardLayout>
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para orçamentos
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <div className="text-red-500 mb-4 flex items-center">
              <FileText className="h-16 w-16" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao carregar orçamento
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Não foi possível carregar os detalhes do orçamento solicitado.
            </p>
            <Button onClick={handleBack}>
              Voltar para lista de orçamentos
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Loading state
  if (isLoadingQuote || isLoadingItems || isLoadingClient) {
    return (
      <DashboardLayout>
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para orçamentos
          </Button>
          <div>
            <Skeleton className="h-7 w-64 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        
        <Skeleton className="h-80 mb-4" />
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para orçamentos
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <div className="text-gray-400 mb-4 flex items-center">
              <FileText className="h-16 w-16" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Orçamento não encontrado
            </h2>
            <p className="text-gray-600 text-center mb-6">
              O orçamento solicitado não existe ou não está disponível.
            </p>
            <Button onClick={handleBack}>
              Voltar para lista de orçamentos
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Orçamento #{quote.id}
            </h1>
            <p className="text-gray-600">
              Criado em {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex">
          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={generatePdfMutation.isPending}
            className="mr-2"
          >
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          
          {quote.pdfPath && (
  <div className="flex gap-2">
    <Button 
      variant="default"
      onClick={() => PdfViewer.openPdf(quote.pdfPath!)}
      className="inline-flex items-center h-10 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
    >
      <Download className="h-4 w-4 mr-2" />
      Baixar PDF
    </Button>
    <Button 
      variant="outline"
      onClick={() => PdfViewer.regenerateAndOpenPdf(quote.id, 'quote')}
      className="inline-flex items-center h-10 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm"
      title="Use esta opção se o PDF não abrir corretamente"
    >
      <FileText className="h-4 w-4 mr-2" />
      Abrir PDF Direto
    </Button>
  </div>
)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mt-1 ${getStatusBadgeClass(quote.status)}`}>
                    {getStatusLabel(quote.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.description || "Nenhuma descrição"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Valor Total</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(quote.total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </dd>
              </div>
              {/* Remover observações se não existir no modelo */}
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {client ? (
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contato</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.phone || client.contactName || "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.email || "Não informado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Endereço</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.address || "Não informado"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-gray-500">Cliente não encontrado</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Itens do Orçamento</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unitário</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quoteItems.length > 0 ? (
                quoteItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(item.unitPrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(item.total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum item encontrado para este orçamento
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <th scope="row" colSpan={4} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {(quote.total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}