import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Quote, Client, QuoteItem } from "@shared/schema";
import { QuoteForm } from "@/components/forms/quote-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlusCircle, Search, FileText, Download, Check, X, Trash2, AlertCircle } from "lucide-react";
import { PdfViewer } from "@/lib/pdf-viewer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function QuotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch quotes
  const { 
    data: quotes = [], 
    isLoading: isLoadingQuotes 
  } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  // Fetch clients
  const { 
    data: clients = [], 
    isLoading: isLoadingClients 
  } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async (quote: Partial<Quote> & { id: number }) => {
      const { id, ...data } = quote;
      const res = await apiRequest("PUT", `/api/quotes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Orçamento atualizado",
        description: "O orçamento foi atualizado com sucesso",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar orçamento: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const generatePdfMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      // Usar fetch diretamente em vez de apiRequest para evitar erros de parsing
      const response = await fetch(`/api/quotes/${quoteId}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao gerar PDF: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
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

  const changeQuoteStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/quotes/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Status atualizado",
        description: "O status do orçamento foi atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar status: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/quotes/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Orçamento excluído",
        description: "O orçamento foi excluído com sucesso",
      });
      setIsDeleteDialogOpen(false);
      setQuoteToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir orçamento: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filter quotes based on search and filters
  const filteredQuotes = quotes.filter(quote => {
    const client = clients.find(c => c.id === quote.clientId);
    const clientName = client?.name || "";
    const matchesSearch = !searchQuery || 
      quote.id.toString().includes(searchQuery) || 
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quote.description && quote.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !statusFilter || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort quotes
  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "value-high":
        return b.total - a.total;
      case "value-low":
        return a.total - b.total;
      case "client":
        const clientA = clients.find(c => c.id === a.clientId)?.name || "";
        const clientB = clients.find(c => c.id === b.clientId)?.name || "";
        return clientA.localeCompare(clientB);
      default:
        return 0;
    }
  });

  const openQuoteDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDialogOpen(true);
  };

  const generatePdf = (quoteId: number) => {
    generatePdfMutation.mutate(quoteId);
  };

  const handleStatusChange = (quoteId: number, status: string) => {
    changeQuoteStatusMutation.mutate({ id: quoteId, status });
  };
  
  const handleDelete = (quote: Quote) => {
    setQuoteToDelete(quote);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (quoteToDelete) {
      deleteQuoteMutation.mutate(quoteToDelete.id);
    }
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

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Orçamentos</h1>
          <p className="text-gray-600">Gerencie os orçamentos para seus clientes.</p>
        </div>
        <Button onClick={() => {
          setSelectedQuote(null);
          setIsDialogOpen(true);
        }}>
          <PlusCircle className="h-5 w-5 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Quote filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Input
              placeholder="Buscar orçamentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Recusado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por recentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Ordenar por recentes</SelectItem>
              <SelectItem value="oldest">Ordenar por antigos</SelectItem>
              <SelectItem value="value-high">Maior valor</SelectItem>
              <SelectItem value="value-low">Menor valor</SelectItem>
              <SelectItem value="client">Ordenar por cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Quotes List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingQuotes || isLoadingClients ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                  </tr>
                ))
              ) : sortedQuotes.length > 0 ? (
                sortedQuotes.map((quote) => {
                  const client = clients.find(c => c.id === quote.clientId);
                  return (
                    <tr key={quote.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #ORC-{quote.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client?.name || "Cliente não encontrado"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {quote.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(quote.total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(quote.status)}`}>
                          {getStatusLabel(quote.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => openQuoteDetails(quote)}
                          >
                            Detalhes
                          </Button>
                          {quote.status === "pending" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 px-2 text-green-600 hover:text-green-900"
                                onClick={() => handleStatusChange(quote.id, "approved")}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 px-2 text-red-600 hover:text-red-900"
                                onClick={() => handleStatusChange(quote.id, "rejected")}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Recusar
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-gray-600 hover:text-gray-900"
                            onClick={() => generatePdf(quote.id)}
                            disabled={generatePdfMutation.isPending}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          {quote.id && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-2 text-blue-600 hover:text-blue-900"
                              onClick={() => PdfViewer.regenerateAndOpenPdf(quote.id, 'quote')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Ver PDF
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-900"
                            onClick={() => handleDelete(quote)}
                            disabled={deleteQuoteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Nenhum orçamento encontrado. Crie um novo orçamento clicando no botão "Novo Orçamento".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sortedQuotes.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              Mostrando <span className="font-medium">{sortedQuotes.length}</span> de <span className="font-medium">{quotes.length}</span> orçamentos
            </div>
          </div>
        )}
      </Card>

      {/* Quote Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedQuote ? `Detalhes do Orçamento #ORC-${selectedQuote.id}` : "Novo Orçamento"}
            </DialogTitle>
            <DialogDescription>
              {selectedQuote 
                ? "Visualize e atualize os detalhes do orçamento" 
                : "Preencha os dados para criar um novo orçamento"}
            </DialogDescription>
          </DialogHeader>
          <QuoteForm 
            clients={clients} 
            quote={selectedQuote} 
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* PDF Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualização do PDF</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] w-full">
            {pdfUrl && (
              <iframe 
                src={pdfUrl} 
                className="w-full h-full border rounded"
                title="PDF Preview"
              />
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
              Fechar
            </Button>
            <Button asChild>
              <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              {quoteToDelete && (
                <>
                  Você tem certeza que deseja excluir o orçamento <strong>#{quoteToDelete.id}</strong>?
                  <br />
                  Esta ação não poderá ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteQuoteMutation.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteQuoteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteQuoteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
