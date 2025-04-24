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
import { WorkOrder, Client, Service, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { WorkOrderForm } from "@/components/forms/work-order-form";
import { 
  PlusCircle, Search, FileText, Download, CheckCircle, 
  Clock, AlertCircle, Calendar, User as UserIcon, Trash2
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function WorkOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch work orders
  const { 
    data: workOrders = [], 
    isLoading: isLoadingWorkOrders 
  } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  // Fetch clients
  const { 
    data: clients = [], 
    isLoading: isLoadingClients 
  } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch services
  const { 
    data: services = [], 
    isLoading: isLoadingServices 
  } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  // Fetch users (technicians)
  const { 
    data: users = [], 
    isLoading: isLoadingUsers 
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateWorkOrderMutation = useMutation({
    mutationFn: async (workOrder: Partial<WorkOrder> & { id: number }) => {
      const { id, ...data } = workOrder;
      const res = await apiRequest("PUT", `/api/work-orders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Ordem de serviço atualizada",
        description: "A ordem de serviço foi atualizada com sucesso",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar ordem de serviço: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const generatePdfMutation = useMutation({
    mutationFn: async (workOrderId: number) => {
      const res = await apiRequest("POST", `/api/work-orders/${workOrderId}/generate-pdf`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "PDF Gerado",
        description: "O PDF da ordem de serviço foi gerado com sucesso",
      });
      setPdfUrl(data.pdfPath);
      setPdfDialogOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao gerar PDF: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/work-orders/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Status atualizado",
        description: "O status da ordem de serviço foi atualizado com sucesso",
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
  
  const deleteWorkOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/work-orders/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Ordem de serviço excluída",
        description: "A ordem de serviço foi excluída com sucesso",
      });
      setIsDeleteDialogOpen(false);
      setWorkOrderToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir ordem de serviço: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filter work orders based on search and filters
  const filteredWorkOrders = workOrders.filter(workOrder => {
    const client = clients.find(c => c.id === workOrder.clientId);
    const service = services.find(s => s.id === workOrder.serviceId);
    const clientName = client?.name || "";
    const serviceDesc = service?.description || "";
    
    const matchesSearch = !searchQuery || 
      workOrder.id.toString().includes(searchQuery) || 
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serviceDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workOrder.description && workOrder.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !statusFilter || workOrder.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort work orders
  const sortedWorkOrders = [...filteredWorkOrders].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "scheduled":
        if (!a.scheduledDate && !b.scheduledDate) return 0;
        if (!a.scheduledDate) return 1;
        if (!b.scheduledDate) return -1;
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      case "client":
        const clientA = clients.find(c => c.id === a.clientId)?.name || "";
        const clientB = clients.find(c => c.id === b.clientId)?.name || "";
        return clientA.localeCompare(clientB);
      default:
        return 0;
    }
  });

  const openWorkOrderDetails = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setIsDialogOpen(true);
  };

  const generatePdf = (workOrderId: number) => {
    generatePdfMutation.mutate(workOrderId);
  };

  const handleStatusChange = (workOrderId: number, status: string) => {
    changeStatusMutation.mutate({ id: workOrderId, status });
  };
  
  const handleDelete = (workOrder: WorkOrder) => {
    setWorkOrderToDelete(workOrder);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (workOrderToDelete) {
      deleteWorkOrderMutation.mutate(workOrderToDelete.id);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "in_progress":
        return <Clock className="h-4 w-4 mr-1" />;
      case "pending":
        return <Calendar className="h-4 w-4 mr-1" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "in_progress":
        return "Em andamento";
      case "pending":
        return "Pendente";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const isLoading = isLoadingWorkOrders || isLoadingClients || isLoadingServices || isLoadingUsers;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Ordens de Serviço</h1>
          <p className="text-gray-600">Gerencie as ordens de serviço da sua empresa.</p>
        </div>
        <Button onClick={() => {
          setSelectedWorkOrder(null);
          setIsDialogOpen(true);
        }}>
          <PlusCircle className="h-5 w-5 mr-2" />
          Nova Ordem de Serviço
        </Button>
      </div>

      {/* Work Order filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Input
              placeholder="Buscar ordens de serviço..."
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
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por recentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Ordenar por recentes</SelectItem>
              <SelectItem value="oldest">Ordenar por antigos</SelectItem>
              <SelectItem value="scheduled">Ordenar por agendamento</SelectItem>
              <SelectItem value="client">Ordenar por cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Work Orders List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agendado para</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Técnicos</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-32" />
                    </td>
                  </tr>
                ))
              ) : sortedWorkOrders.length > 0 ? (
                sortedWorkOrders.map((workOrder) => {
                  const client = clients.find(c => c.id === workOrder.clientId);
                  const assignedTechnicians = users.filter(user => 
                    workOrder.technicianIds && workOrder.technicianIds.includes(user.id.toString())
                  );
                  
                  return (
                    <tr key={workOrder.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #OS-{workOrder.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client?.name || "Cliente não encontrado"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(workOrder.status)}`}>
                          {getStatusIcon(workOrder.status)}
                          {getStatusLabel(workOrder.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {workOrder.scheduledDate 
                          ? new Date(workOrder.scheduledDate).toLocaleDateString('pt-BR')
                          : "-"
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {assignedTechnicians.length > 0 ? (
                          <div className="flex -space-x-2 overflow-hidden">
                            {assignedTechnicians.slice(0, 3).map((tech, index) => (
                              <div 
                                key={tech.id}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-primary-600 text-white text-xs flex items-center justify-center font-medium"
                                title={tech.name}
                              >
                                {tech.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                            ))}
                            {assignedTechnicians.length > 3 && (
                              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-400 text-white text-xs flex items-center justify-center font-medium">
                                +{assignedTechnicians.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => openWorkOrderDetails(workOrder)}
                          >
                            Detalhes
                          </Button>
                          {workOrder.status === "pending" && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-2 text-yellow-600 hover:text-yellow-900"
                              onClick={() => handleStatusChange(workOrder.id, "in_progress")}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Iniciar
                            </Button>
                          )}
                          {workOrder.status === "in_progress" && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-2 text-green-600 hover:text-green-900"
                              onClick={() => handleStatusChange(workOrder.id, "completed")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Concluir
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-gray-600 hover:text-gray-900"
                            onClick={() => generatePdf(workOrder.id)}
                            disabled={generatePdfMutation.isPending}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          {workOrder.pdfPath && (
                            <a 
                              href={workOrder.pdfPath} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center h-8 px-2 text-blue-600 hover:text-blue-900"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar
                            </a>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-900"
                            onClick={() => handleDelete(workOrder)}
                            disabled={deleteWorkOrderMutation.isPending}
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
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma ordem de serviço encontrada. Crie uma nova clicando no botão "Nova Ordem de Serviço".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sortedWorkOrders.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              Mostrando <span className="font-medium">{sortedWorkOrders.length}</span> de <span className="font-medium">{workOrders.length}</span> ordens de serviço
            </div>
          </div>
        )}
      </Card>

      {/* Work Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkOrder ? `Detalhes da Ordem de Serviço #OS-${selectedWorkOrder.id}` : "Nova Ordem de Serviço"}
            </DialogTitle>
            <DialogDescription>
              {selectedWorkOrder 
                ? "Visualize e atualize os detalhes da ordem de serviço" 
                : "Preencha os dados para criar uma nova ordem de serviço"}
            </DialogDescription>
          </DialogHeader>
          <WorkOrderForm 
            workOrder={selectedWorkOrder} 
            clients={clients} 
            users={users} 
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
            <AlertDialogTitle>
              <div className="flex items-center text-red-600">
                <Trash2 className="mr-2 h-5 w-5" />
                Excluir Ordem de Serviço
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {workOrderToDelete && (
                <>
                  <p>Tem certeza que deseja excluir a ordem de serviço <strong>#{workOrderToDelete.id}</strong>?</p>
                  <p className="mt-2">Esta ação não pode ser desfeita.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteWorkOrderMutation.isPending ? (
                <div className="flex items-center">
                  <span className="mr-2">Excluindo...</span>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : (
                "Sim, excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
