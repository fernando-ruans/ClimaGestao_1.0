import { WorkOrder, Client, Service, ServiceItem, User } from "@shared/schema";

interface WorkOrderTemplateProps {
  workOrder: WorkOrder;
  client: Client;
  service: Service;
  items: ServiceItem[];
  technicians: User[];
}

export default function WorkOrderTemplate({ 
  workOrder, 
  client, 
  service, 
  items, 
  technicians 
}: WorkOrderTemplateProps) {
  // Calculate totals
  const totalMaterials = items
    .filter(item => item.type === 'material')
    .reduce((sum, item) => sum + item.total, 0);
  
  const totalServices = items
    .filter(item => item.type === 'labor')
    .reduce((sum, item) => sum + item.total, 0);
  
  const grandTotal = totalMaterials + totalServices;

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
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

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case "installation":
        return "Instalação";
      case "maintenance":
        return "Manutenção";
      case "repair":
        return "Reparo";
      case "inspection":
        return "Vistoria";
      default:
        return type;
    }
  };

  // This component is meant to show how the PDF will look, 
  // but the actual PDF generation happens on the server
  return (
    <div className="p-8 max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary-600">SAM CLIMATIZA</h1>
        <p className="text-gray-800">Sistema de Gestão para Climatização</p>
        <div className="mt-4">
          <h2 className="text-2xl font-bold text-primary-600">ORDEM DE SERVIÇO</h2>
          <div className="flex justify-between mt-2">
            <p className="font-medium text-gray-800">Ordem de Serviço #OS-{workOrder.id}</p>
            <p className="text-gray-800">Data: {formatDate(workOrder.createdAt)}</p>
          </div>
          {workOrder.scheduledDate && (
            <p className="text-right text-gray-800">Data agendada: {formatDate(workOrder.scheduledDate)}</p>
          )}
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-primary-600 mb-2">Dados do Cliente</h3>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p><span className="font-medium">Nome:</span> {client.name}</p>
          <p><span className="font-medium">Contato:</span> {client.contactName || '-'}</p>
          <p><span className="font-medium">Email:</span> {client.email || '-'}</p>
          <p><span className="font-medium">Telefone:</span> {client.phone || '-'}</p>
          <p><span className="font-medium">Endereço:</span> {client.address || '-'}</p>
        </div>
      </div>

      {/* Service Info */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-primary-600 mb-2">Dados do Serviço</h3>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p><span className="font-medium">Tipo:</span> {getServiceTypeLabel(service.serviceType)}</p>
          <p><span className="font-medium">Status:</span> {getStatusLabel(workOrder.status)}</p>
          {service.description && (
            <p><span className="font-medium">Descrição:</span> {service.description}</p>
          )}
          {workOrder.description && (
            <p><span className="font-medium">Observações:</span> {workOrder.description}</p>
          )}
        </div>
      </div>

      {/* Technicians */}
      {technicians.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary-600 mb-2">Técnicos Responsáveis</h3>
          <div className="p-4 border rounded-lg bg-gray-50">
            {technicians.map((tech, index) => (
              <div key={tech.id} className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium text-sm mr-2">
                  {tech.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="font-medium">{tech.name}</p>
                  <p className="text-sm text-gray-600">{tech.role === 'technician' ? 'Técnico' : tech.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-primary-600 mb-2">Materiais e Serviços</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm">{item.description}</td>
                  <td className="px-4 py-2 text-sm">{item.type === 'material' ? 'Material' : 'Serviço'}</td>
                  <td className="px-4 py-2 text-sm">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-2 text-sm">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-medium">
                <td colSpan={4} className="px-4 py-2 text-right">Total Materiais:</td>
                <td className="px-4 py-2">{formatCurrency(totalMaterials)}</td>
              </tr>
              <tr className="bg-gray-100 font-medium">
                <td colSpan={4} className="px-4 py-2 text-right">Total Serviços:</td>
                <td className="px-4 py-2">{formatCurrency(totalServices)}</td>
              </tr>
              <tr className="bg-primary-50 font-bold">
                <td colSpan={4} className="px-4 py-2 text-right">Valor Total:</td>
                <td className="px-4 py-2">{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Completion Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-primary-600 mb-2">Conclusão do Serviço</h3>
        <div className="mt-4 flex justify-between">
          <div className="text-center">
            <div className="border-t border-gray-400 w-40"></div>
            <p className="text-sm mt-1">Assinatura do Cliente</p>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-40"></div>
            <p className="text-sm mt-1">Assinatura do Técnico</p>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Observações:</h3>
        <div className="border border-gray-300 rounded-md p-4 h-24"></div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-sm text-gray-500">
        <p>Este é apenas um modelo visual da versão PDF. A versão final pode variar ligeiramente.</p>
      </div>
    </div>
  );
}
