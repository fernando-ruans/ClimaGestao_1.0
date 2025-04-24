import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Client } from "@shared/schema";
import { ClientForm } from "@/components/forms/client-form";
import { PlusCircle, Search, Phone, Mail, MapPin } from "lucide-react";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Fetch clients
  const { 
    data: clients = [], 
    isLoading: isLoadingClients 
  } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Filter clients based on search
  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.contactName && client.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.phone && client.phone.includes(searchQuery)) ||
      (client.city && client.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.state && client.state.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const openClientDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Clientes</h1>
          <p className="text-gray-600">Gerencie os clientes da sua empresa.</p>
        </div>
        <Button onClick={() => {
          setSelectedClient(null);
          setIsDialogOpen(true);
        }}>
          <PlusCircle className="h-5 w-5 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Client filters */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Input
            placeholder="Buscar clientes por nome, contato, email, telefone ou localização..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full md:max-w-md"
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingClients ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
              <div className="mt-4">
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <Card key={client.id} className="p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{client.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
              <div className="space-y-3 text-sm">
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <span>
                      {client.address}
                      {(client.city || client.state) && (
                        <>, {client.city} {client.state && `- ${client.state}`}</>
                      )}
                      {client.zip && `, ${client.zip}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => openClientDetails(client)}
                >
                  Ver Detalhes
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center p-8">
            <p className="text-gray-500 mb-4">Nenhum cliente encontrado. Crie um novo cliente clicando no botão "Novo Cliente".</p>
          </div>
        )}
      </div>

      {/* Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {selectedClient 
                ? "Atualize os dados do cliente" 
                : "Preencha os dados para cadastrar um novo cliente"}
            </DialogDescription>
          </DialogHeader>
          <ClientForm 
            client={selectedClient} 
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
