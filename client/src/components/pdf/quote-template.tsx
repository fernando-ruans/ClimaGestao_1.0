import { Quote, QuoteItem, Client } from "@shared/schema";

interface QuoteTemplateProps {
  quote: Quote;
  client: Client;
  items: QuoteItem[];
}

export default function QuoteTemplate({ quote, client, items }: QuoteTemplateProps) {
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

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
          <h2 className="text-2xl font-bold text-primary-600">ORÇAMENTO</h2>
          <div className="flex justify-between mt-2">
            <p className="font-medium text-gray-800">Orçamento #ORC-{quote.id}</p>
            <p className="text-gray-800">Data: {formatDate(quote.createdAt)}</p>
          </div>
          {quote.validUntil && (
            <p className="text-right text-gray-800">Validade: {formatDate(quote.validUntil)}</p>
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

      {/* Quote Description */}
      {quote.description && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-primary-600 mb-2">Descrição</h3>
          <div className="p-4 border rounded-lg bg-gray-50">
            <p>{quote.description}</p>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-primary-600 mb-2">Itens do Orçamento</h3>
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

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Termos e Condições:</h3>
        <ol className="list-decimal pl-8 text-sm">
          <li className="mb-1">Orçamento válido pelo prazo informado acima.</li>
          <li className="mb-1">Valores sujeitos a alteração após o prazo de validade.</li>
          <li className="mb-1">Pagamento conforme negociação com o cliente.</li>
        </ol>
      </div>

      {/* Signature Fields */}
      <div className="mt-12 flex justify-between">
        <div className="text-center">
          <div className="border-t border-gray-400 w-40"></div>
          <p className="text-sm mt-1">Assinatura do Cliente</p>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 w-40"></div>
          <p className="text-sm mt-1">Data</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-sm text-gray-500">
        <p>Este é apenas um modelo visual da versão PDF. A versão final pode variar ligeiramente.</p>
      </div>
    </div>
  );
}
