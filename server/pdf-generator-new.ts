import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { Client, Quote, QuoteItem, WorkOrder, Service, ServiceItem, User } from "@shared/schema";

// Tipos para os dados que serão usados nos PDFs
interface QuoteData {
  quote: Quote;
  client: Client;
  items: QuoteItem[];
}

interface WorkOrderData {
  workOrder: WorkOrder;
  service: Service;
  client: Client;
  items: ServiceItem[];
  technicians: User[];
}

/**
 * Função auxiliar para adicionar a logo no cabeçalho
 */
function addLogoToHeader(doc: PDFKit.PDFDocument): void {
  try {
    // Caminho correto para a logo
    const logoPath = path.resolve("./attached_assets/SAM_CLIMATIZA.png");
    
    if (fs.existsSync(logoPath)) {
      // Adiciona a logo no canto superior esquerdo (tamanho reduzido)
      doc.image(logoPath, 50, 40, { 
        width: 100 // Tamanho reduzido, não muito grande
      });
      
      // Posiciona o cursor após a logo
      doc.moveDown(3);
    } else {
      console.warn("Logo não encontrada:", logoPath);
      // Fallback caso a imagem não esteja disponível
      doc.fontSize(16)
         .fillColor('#1a56db')
         .text('SAM CLIMATIZA', 50, 50);
    }
  } catch (error) {
    console.error("Erro ao adicionar logo:", error);
    // Não propaga o erro para não interromper a geração do PDF
  }
}

/**
 * Versão profissional da geração de PDF para orçamentos
 */
export async function generateQuotePDF(data: QuoteData): Promise<string> {
  console.log("Iniciando geração de PDF profissional para orçamento");
  const { quote, client, items } = data;
  
  // Create a unique filename
  const filename = `quote_${quote.id}_${Date.now()}.pdf`;
  const outputDir = path.resolve("./public/pdf");
  const outputPath = path.join(outputDir, filename);
  
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  return new Promise<string>((resolve, reject) => {
    try {
      // Create a professional-looking PDF document
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      const stream = fs.createWriteStream(outputPath);
      
      // Set up event handlers
      stream.on('finish', () => {
        console.log("PDF gerado com sucesso:", filename);
        resolve(`/pdf/${filename}`);
      });
      
      stream.on('error', (err) => {
        console.error("Erro no stream:", err);
        reject(err);
      });
      
      // Pipe the document to the stream
      doc.pipe(stream);
      
      // Adiciona a logo no canto superior esquerdo
      addLogoToHeader(doc);
      
      // Título do documento no cabeçalho - centralizado à direita
      doc
        .fontSize(20)
        .fillColor('#1a56db')
        .text('ORÇAMENTO', { align: 'right' })
        .fontSize(12)
        .fillColor('#666666')
        .text('Sistema de Gestão para Climatização', { align: 'right' })
        .moveDown(0.5);
        
      // Linha decorativa horizontal
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .strokeColor('#1a56db')
        .strokeOpacity(0.5)
        .stroke()
        .moveDown(1);
      
      // Informações do orçamento em uma tabela simples
      const infoStartY = doc.y;
      
      // Coluna esquerda
      doc
        .fontSize(12)
        .fillColor('#000')
        .text(`Orçamento #ORC-${quote.id}`, 50, infoStartY)
        .text(`Data: ${new Date(quote.createdAt).toLocaleDateString('pt-BR')}`, 50, infoStartY + 20);
        
      // Coluna direita - status
      let statusText = '';
      let statusColor = '';
      
      switch (quote.status) {
        case 'approved':
          statusText = 'APROVADO';
          statusColor = '#22c55e';
          break;
        case 'rejected':
          statusText = 'RECUSADO';
          statusColor = '#ef4444';
          break;
        default:
          statusText = 'PENDENTE';
          statusColor = '#f59e0b';
      }
      
      doc
        .fontSize(12)
        .fillColor(statusColor)
        .text(`Status: ${statusText}`, 350, infoStartY, { align: 'right' });
        
      if (quote.validUntil) {
        doc
          .fillColor('#000')
          .text(`Validade: ${new Date(quote.validUntil).toLocaleDateString('pt-BR')}`, 350, infoStartY + 20, { align: 'right' });
      }
      
      doc.moveDown(2);
      
      // Dados do cliente com fundo colorido leve
      const clientBoxY = doc.y;
      doc
        .rect(50, clientBoxY, 500, 90)
        .fillColor('#f0f5ff')
        .fillOpacity(0.5)
        .fill();
        
      doc
        .fillOpacity(1)
        .fontSize(14)
        .fillColor('#1a56db')
        .text('DADOS DO CLIENTE', 70, clientBoxY + 10)
        .moveDown(0.5);
        
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(`Nome: ${client.name}`, 70, doc.y)
        .text(`Contato: ${client.contactName || '-'}`, 70, doc.y + 15)
        .text(`Email: ${client.email || '-'}`, 70, doc.y + 30)
        .text(`Telefone: ${client.phone || '-'}`, 350, clientBoxY + 40)
        .text(`Endereço: ${client.address || '-'}`, 350, clientBoxY + 55);
      
      doc.moveDown(3);
      
      // Descrição do orçamento (se houver)
      if (quote.description) {
        doc
          .fontSize(14)
          .fillColor('#1a56db')
          .text('DESCRIÇÃO', { underline: true })
          .moveDown(0.5)
          .fontSize(11)
          .fillColor('#333')
          .text(quote.description)
          .moveDown(1);
      }
      
      // Tabela de itens com grid
      doc
        .fontSize(14)
        .fillColor('#1a56db')
        .text('ITENS DO ORÇAMENTO', { underline: true })
        .moveDown(0.5);
      
      // Cabeçalhos da tabela
      const tableTop = doc.y + 10;
      const colWidths = [40, 260, 70, 70, 70];
      const colPositions = [
        50, // Item
        50 + colWidths[0], // Descrição 
        50 + colWidths[0] + colWidths[1], // Quantidade
        50 + colWidths[0] + colWidths[1] + colWidths[2], // Preço Unitário
        50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] // Total
      ];
      
      // Fundo do cabeçalho
      doc
        .rect(50, tableTop - 5, 500, 20)
        .fillColor('#1a56db')
        .fill();
        
      // Texto do cabeçalho
      doc
        .fontSize(10)
        .fillColor('#ffffff')
        .text('Item', colPositions[0] + 5, tableTop)
        .text('Descrição', colPositions[1], tableTop)
        .text('Qtd', colPositions[2], tableTop, { width: colWidths[2], align: 'center' })
        .text('Preço', colPositions[3], tableTop, { width: colWidths[3], align: 'center' })
        .text('Total', colPositions[4], tableTop, { width: colWidths[4], align: 'center' });
      
      let rowY = tableTop + 20;
      
      // Células da tabela com alternância de cores
      items.forEach((item, i) => {
        // Fundo alternado
        const fillColor = i % 2 === 0 ? '#f8fafc' : '#ffffff';
        const rowHeight = 25;
        
        doc
          .rect(50, rowY, 500, rowHeight)
          .fillColor(fillColor)
          .fill();
          
        doc
          .fontSize(10)
          .fillColor('#333333')
          .text((i + 1).toString(), colPositions[0] + 5, rowY + 7)
          .text(item.description, colPositions[1], rowY + 7, { width: colWidths[1] })
          .text(item.quantity.toString(), colPositions[2], rowY + 7, { width: colWidths[2], align: 'center' })
          .text((item.unitPrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                colPositions[3], rowY + 7, { width: colWidths[3], align: 'center' })
          .text((item.total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                colPositions[4], rowY + 7, { width: colWidths[4], align: 'center' });
        
        rowY += rowHeight;
      });
      
      // Borda da tabela
      doc
        .rect(50, tableTop - 5, 500, rowY - tableTop + 5)
        .strokeColor('#cccccc')
        .stroke();
      
      // Total
      doc
        .rect(350, rowY, 200, 30)
        .fillColor('#f0f5ff')
        .fill();
        
      doc
        .fontSize(12)
        .fillColor('#1a56db')
        .text('TOTAL:', 360, rowY + 10)
        .fillColor('#000')
        .fontSize(12)
        .text((quote.total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
              colPositions[4], rowY + 10, { width: colWidths[4], align: 'center' });
      
      // Se estiver perto do fim da página, avançar para a próxima
      if (doc.y > 650) {
        doc.addPage();
      } else {
        doc.moveDown(2);
      }
      
      // Área para observações e termos em formato horizontal (caixa com observações lado a lado)
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('OBSERVAÇÕES:', { underline: true })
        .moveDown(0.3);
      
      // Caixa para as observações com mais economia de espaço
      const notesBoxY = doc.y;
      doc
        .rect(50, notesBoxY, 500, 50)
        .fillColor('#f9fafb')
        .fillOpacity(0.7)
        .fill()
        .strokeColor('#e5e7eb')
        .stroke();
      
      doc
        .fillOpacity(1)
        .fontSize(8.5)
        .fillColor('#444444');
      
      // Colocamos as observações lado a lado em duas colunas
      doc.text('• Os preços incluem mão de obra e material, conforme especificado.', 60, notesBoxY + 10, { width: 230 });
      doc.text('• Valores sujeitos a alteração após visita técnica.', 300, notesBoxY + 10, { width: 230 });
      doc.text('• Condições de pagamento: a combinar.', 60, notesBoxY + 30, { width: 230 });
      doc.text('• Validade da proposta: 15 dias.', 300, notesBoxY + 30, { width: 230 });
      
      // Ajustar a posição para o próximo conteúdo
      doc.y = notesBoxY + 60;
      
      // Área para assinaturas - corrigido para alinhamento adequado
      const signatureY = doc.y;
      
      // Preparar área para assinaturas com alinhamento centralizado
      const signatureWidth = 180;
      const signaturePad = 30;
      const leftSignatureX = 50 + signaturePad;
      const rightSignatureX = 300 + signaturePad;
      
      // Assinatura do responsável (esquerda)
      doc
        .moveTo(leftSignatureX, signatureY + 40)
        .lineTo(leftSignatureX + signatureWidth, signatureY + 40)
        .strokeColor('#888888')
        .stroke();
        
      // Assinatura do cliente (direita)
      doc
        .moveTo(rightSignatureX, signatureY + 40)
        .lineTo(rightSignatureX + signatureWidth, signatureY + 40)
        .stroke();
        
      // Texto de cada assinatura centralizado sob a linha
      doc
        .fontSize(10)
        .fillColor('#666')
        .text('Responsável', leftSignatureX, signatureY + 45, { width: signatureWidth, align: 'center' })
        .text('Cliente', rightSignatureX, signatureY + 45, { width: signatureWidth, align: 'center' });
      
      // Rodapé
      const pageHeight = doc.page.height;
      doc
        .fontSize(8)
        .fillColor('#666666')
        .text('SAM CLIMATIZA - CNPJ: XX.XXX.XXX/0001-XX', 50, pageHeight - 40, { align: 'center', width: 500 })
        .text('Rua Exemplo, 123 - Bairro - Cidade - Estado - CEP: 00000-000', 50, pageHeight - 30, { align: 'center', width: 500 })
        .text('Tel: (XX) XXXX-XXXX | Email: contato@samclimatiza.com.br', 50, pageHeight - 20, { align: 'center', width: 500 });
      
      // Finalizar documento
      doc.end();
      
    } catch (error) {
      console.error("Erro na geração do PDF:", error);
      reject(error);
    }
  });
}

/**
 * Versão profissional da geração de PDF para ordens de serviço
 */
export async function generateWorkOrderPDF(data: WorkOrderData): Promise<string> {
  console.log("Iniciando geração de PDF profissional para ordem de serviço");
  const { workOrder, service, client, items, technicians } = data;
  
  // Create a unique filename
  const filename = `workorder_${workOrder.id}_${Date.now()}.pdf`;
  const outputDir = path.resolve("./public/pdf");
  const outputPath = path.join(outputDir, filename);
  
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  return new Promise<string>((resolve, reject) => {
    try {
      // Create a professional PDF document
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      const stream = fs.createWriteStream(outputPath);
      
      // Set up event handlers
      stream.on('finish', () => {
        console.log("PDF gerado com sucesso:", filename);
        resolve(`/pdf/${filename}`);
      });
      
      stream.on('error', (err) => {
        console.error("Erro no stream:", err);
        reject(err);
      });
      
      // Pipe the document to the stream
      doc.pipe(stream);
      
      // Adiciona a logo no canto superior esquerdo
      addLogoToHeader(doc);
      
      // Título do documento no cabeçalho - centralizado à direita
      doc
        .fontSize(20)
        .fillColor('#1a56db')
        .text('ORDEM DE SERVIÇO', { align: 'right' })
        .fontSize(12)
        .fillColor('#666666')
        .text('Sistema de Gestão para Climatização', { align: 'right' })
        .moveDown(0.5);
        
      // Linha decorativa horizontal
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .strokeColor('#1a56db')
        .strokeOpacity(0.5)
        .stroke()
        .moveDown(1);
      
      // Informações da OS em um box
      const infoStartY = doc.y;
      
      // Box de informações da OS com grid
      doc
        .rect(50, infoStartY, 500, 70)
        .fillColor('#f0f9ff')
        .fillOpacity(0.5)
        .fill()
        .strokeColor('#cccccc')
        .stroke();
        
      doc
        .fillOpacity(1)
        .fontSize(12)
        .fillColor('#000');
        
      // Grid de informações em duas colunas
      doc.text(`Ordem de Serviço: #OS-${workOrder.id}`, 70, infoStartY + 15);
      doc.text(`Data de Criação: ${new Date(workOrder.createdAt).toLocaleDateString('pt-BR')}`, 70, infoStartY + 35);
      
      // Status na coluna direita com cor correspondente
      let statusText = '';
      let statusColor = '';
      
      switch (workOrder.status) {
        case 'completed':
          statusText = 'CONCLUÍDA';
          statusColor = '#22c55e';
          break;
        case 'in_progress':
          statusText = 'EM ANDAMENTO';
          statusColor = '#f59e0b';
          break;
        case 'cancelled':
          statusText = 'CANCELADA';
          statusColor = '#ef4444';
          break;
        default:
          statusText = 'PENDENTE';
          statusColor = '#3b82f6';
      }
      
      doc
        .fontSize(12)
        .fillColor(statusColor)
        .text(`Status: ${statusText}`, 350, infoStartY + 15, { align: 'left' });
        
      if (workOrder.scheduledDate) {
        doc
          .fillColor('#000')
          .text(`Data Agendada: ${new Date(workOrder.scheduledDate).toLocaleDateString('pt-BR')}`, 350, infoStartY + 35, { align: 'left' });
      }
      
      doc.moveDown(4);
      
      // Dados do cliente em box destacado
      const clientBoxY = doc.y;
      doc
        .rect(50, clientBoxY, 500, 90)
        .fillColor('#f0f5ff')
        .fillOpacity(0.5)
        .fill()
        .strokeColor('#cccccc')
        .stroke();
        
      doc
        .fillOpacity(1)
        .fontSize(14)
        .fillColor('#1a56db')
        .text('DADOS DO CLIENTE', 70, clientBoxY + 10)
        .moveDown(0.5);
        
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(`Nome: ${client.name}`, 70, doc.y)
        .text(`Contato: ${client.contactName || '-'}`, 70, doc.y + 15)
        .text(`Email: ${client.email || '-'}`, 70, doc.y + 30)
        .text(`Telefone: ${client.phone || '-'}`, 350, clientBoxY + 40)
        .text(`Endereço: ${client.address || '-'}`, 350, clientBoxY + 55);
      
      doc.moveDown(4);
      
      // Dados do serviço com ícones
      const serviceBoxY = doc.y;
      doc
        .rect(50, serviceBoxY, 500, 100)
        .fillColor('#f0f7ff')
        .fillOpacity(0.5)
        .fill()
        .strokeColor('#cccccc')
        .stroke();
        
      doc
        .fillOpacity(1)
        .fontSize(14)
        .fillColor('#1a56db')
        .text('DADOS DO SERVIÇO', 70, serviceBoxY + 10)
        .moveDown(0.5);
      
      // Traduzir o tipo de serviço
      let serviceTypeText = '';
      switch (service.serviceType) {
        case 'installation':
          serviceTypeText = 'Instalação';
          break;
        case 'maintenance':
          serviceTypeText = 'Manutenção';
          break;
        case 'repair':
          serviceTypeText = 'Reparo';
          break;
        case 'inspection':
          serviceTypeText = 'Vistoria';
          break;
        default:
          serviceTypeText = service.serviceType || '-';
      }
        
      doc
        .fontSize(11)
        .fillColor('#333')
        .text(`Tipo: ${serviceTypeText}`, 70, doc.y)
        .text(`Descrição: ${service.description || '-'}`, 70, doc.y + 20, { width: 450 });
        
      // Verificar a descrição da OS
      if (workOrder.description) {
        doc
          .text(`Observações da OS: ${workOrder.description}`, 70, doc.y + 40, { width: 450 });
      }
      
      doc.moveDown(5);
      
      // Técnicos responsáveis com foto estilizada
      if (technicians && technicians.length > 0) {
        const techBoxY = doc.y;
        doc
          .fontSize(14)
          .fillColor('#1a56db')
          .text('TÉCNICOS RESPONSÁVEIS', { underline: true })
          .moveDown(0.5);
        
        // Cria uma grid para os técnicos
        const techPerRow = 2;
        const techWidth = 200;
        const techHeight = 40;
        const techMargin = 20;
        
        technicians.forEach((tech, i) => {
          const row = Math.floor(i / techPerRow);
          const col = i % techPerRow;
          const techX = 70 + (col * (techWidth + techMargin));
          const techY = techBoxY + 30 + (row * (techHeight + 10));
          
          // Box para cada técnico
          doc
            .roundedRect(techX, techY, techWidth, techHeight, 5)
            .fillColor('#f8fafc')
            .fill()
            .strokeColor('#e2e8f0')
            .stroke();
            
          // Nome e informações do técnico
          doc
            .fontSize(11)
            .fillColor('#333')
            .text(tech.name, techX + 10, techY + 10)
            .fontSize(9)
            .fillColor('#666')
            .text(tech.email || '', techX + 10, techY + 25);
        });
        
        // Ajustar posição vertical para próxima seção
        doc.y = techBoxY + 30 + (Math.ceil(technicians.length / techPerRow) * (techHeight + 10)) + 20;
      }
      
      // Itens de serviço com tabela estilizada
      if (items && items.length > 0) {
        doc
          .fontSize(14)
          .fillColor('#1a56db')
          .text('ITENS DO SERVIÇO', { underline: true })
          .moveDown(0.5);
        
        // Verificar espaço disponível para a tabela
        if (doc.y > 620) {
          doc.addPage();
        }
        
        // Cabeçalhos da tabela com valores (inclui preço unitário e total)
        const tableTop = doc.y;
        const tableWidths = [30, 220, 40, 70, 70, 70];
        const colPositions = [
          50, // Item
          50 + tableWidths[0], // Descrição
          50 + tableWidths[0] + tableWidths[1], // Quantidade
          50 + tableWidths[0] + tableWidths[1] + tableWidths[2], // Tipo
          50 + tableWidths[0] + tableWidths[1] + tableWidths[2] + tableWidths[3], // Preço Unitário
          50 + tableWidths[0] + tableWidths[1] + tableWidths[2] + tableWidths[3] + tableWidths[4] // Total
        ];
        
        // Fundo do cabeçalho
        doc
          .rect(50, tableTop, 500, 20)
          .fillColor('#1a56db')
          .fill();
          
        // Texto do cabeçalho
        doc
          .fontSize(10)
          .fillColor('#ffffff')
          .text('Item', colPositions[0] + 5, tableTop + 6)
          .text('Descrição', colPositions[1], tableTop + 6)
          .text('Qtd', colPositions[2], tableTop + 6, { width: tableWidths[2], align: 'center' })
          .text('Tipo', colPositions[3], tableTop + 6, { width: tableWidths[3], align: 'center' })
          .text('Preço', colPositions[4], tableTop + 6, { width: tableWidths[4], align: 'center' })
          .text('Total', colPositions[5], tableTop + 6, { width: tableWidths[5], align: 'center' });
        
        // Itens da tabela com alternância de cores
        let rowY = tableTop + 20;
        let totalValue = 0;
        
        items.forEach((item, i) => {
          const rowHeight = 25;
          const fillColor = i % 2 === 0 ? '#f8fafc' : '#ffffff';
          
          // Tipo formatado
          let typeText = item.type === 'material' ? 'Material' : 'Mão de obra';
          
          // Calcular o valor total para cada item
          const unitPrice = item.unitPrice || 0;
          const quantity = item.quantity || 1;
          const itemTotal = (unitPrice * quantity);
          
          // Acumular o total geral
          totalValue += itemTotal;
          
          doc
            .rect(50, rowY, 500, rowHeight)
            .fillColor(fillColor)
            .fill();
            
          doc
            .fontSize(10)
            .fillColor('#333')
            .text((i + 1).toString(), colPositions[0] + 5, rowY + 8)
            .text(item.description, colPositions[1], rowY + 8, { width: tableWidths[1] })
            .text(quantity.toString(), colPositions[2], rowY + 8, { width: tableWidths[2], align: 'center' })
            .text(typeText, colPositions[3], rowY + 8, { width: tableWidths[3], align: 'center' })
            .text((unitPrice / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                colPositions[4], rowY + 8, { width: tableWidths[4], align: 'center' })
            .text((itemTotal / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                colPositions[5], rowY + 8, { width: tableWidths[5], align: 'center' });
            
          rowY += rowHeight;
        });
        
        // Borda da tabela
        doc
          .rect(50, tableTop, 500, rowY - tableTop)
          .strokeColor('#cccccc')
          .stroke();
        
        // Adicionar o valor total geral
        doc
          .rect(350, rowY, 200, 30)
          .fillColor('#f0f5ff')
          .fill();
          
        doc
          .fontSize(12)
          .fillColor('#1a56db')
          .text('TOTAL:', 360, rowY + 10)
          .fillColor('#000')
          .fontSize(12)
          .text((totalValue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                colPositions[5], rowY + 10, { width: tableWidths[5], align: 'center' });
          
        doc.y = rowY + 40;
      }
      
      // Se já estiver no fim da página, avançar
      if (doc.y > 650) {
        doc.addPage();
      }
      
      // Área para assinaturas com linhas - corrigido para alinhamento adequado
      doc
        .fontSize(12)
        .fillColor('#1a56db')
        .text('CONFIRMAÇÃO DE SERVIÇO', { align: 'center' })
        .moveDown(1.5);
        
      const signatureY = doc.y;
      
      // Preparar área para assinaturas com alinhamento centralizado
      const signatureWidth = 180;
      const signaturePad = 30;
      const leftSignatureX = 50 + signaturePad;
      const rightSignatureX = 300 + signaturePad;
      
      // Assinatura do técnico (esquerda)
      doc
        .moveTo(leftSignatureX, signatureY + 40)
        .lineTo(leftSignatureX + signatureWidth, signatureY + 40)
        .strokeColor('#888888')
        .stroke();
        
      // Assinatura do cliente (direita)
      doc
        .moveTo(rightSignatureX, signatureY + 40)
        .lineTo(rightSignatureX + signatureWidth, signatureY + 40)
        .stroke();
        
      // Texto de cada assinatura centralizado sob a linha
      doc
        .fontSize(10)
        .fillColor('#666')
        .text('Assinatura do Técnico', leftSignatureX, signatureY + 45, { width: signatureWidth, align: 'center' })
        .text('Assinatura do Cliente', rightSignatureX, signatureY + 45, { width: signatureWidth, align: 'center' });
      
      // Campo para observações
      doc
        .moveDown(3)
        .fontSize(11)
        .fillColor('#1a56db')
        .text('OBSERVAÇÕES:')
        .moveDown(0.3);
        
      // Box para observações
      doc
        .rect(50, doc.y, 500, 60)
        .strokeColor('#cccccc')
        .stroke()
        .moveDown(4);
      
      // Rodapé
      const pageHeight = doc.page.height;
      doc
        .fontSize(8)
        .fillColor('#666666')
        .text('SAM CLIMATIZA - CNPJ: XX.XXX.XXX/0001-XX', 50, pageHeight - 40, { align: 'center', width: 500 })
        .text('Rua Exemplo, 123 - Bairro - Cidade - Estado - CEP: 00000-000', 50, pageHeight - 30, { align: 'center', width: 500 })
        .text('Tel: (XX) XXXX-XXXX | Email: contato@samclimatiza.com.br', 50, pageHeight - 20, { align: 'center', width: 500 });
      
      // Finalizar documento
      doc.end();
      
    } catch (error) {
      console.error("Erro na geração do PDF:", error);
      reject(error);
    }
  });
}