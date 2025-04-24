import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { Client, Quote, QuoteItem, WorkOrder, Service, ServiceItem, User } from "@shared/schema";

// Função auxiliar para adicionar o cabeçalho com logo em todos os PDFs
function addHeaderWithLogo(doc: PDFKit.PDFDocument, title: string): void {
  const logoPath = path.resolve("./public/img/logo.png");
  
  // Verificar se o logo existe
  if (fs.existsSync(logoPath)) {
    // Posicionar o logo no canto superior esquerdo
    const logoWidth = 80; // Largura reduzida para o logo
    
    doc.image(logoPath, 50, 40, { 
      width: logoWidth
    });
    
    // Adicionar espaço após o logo
    doc.moveDown(4); 
  } else {
    // Fallback para texto caso o logo não seja encontrado
    doc
      .fontSize(20)
      .fillColor('#1a56db')
      .text('SAM CLIMATIZA', { align: 'left' })
      .moveDown(3);
  }
    
  // Título do documento (Orçamento ou Ordem de Serviço)
  doc
    .fontSize(16)
    .fillColor('#1a56db')
    .text(title, { align: 'center' })
    .moveDown();
}

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

export async function generateQuotePDF(data: QuoteData): Promise<string> {
  const { quote, client, items } = data;
  
  // Create a unique filename
  const filename = `quote_${quote.id}_${Date.now()}.pdf`;
  const outputDir = path.resolve("./public/pdf");
  const outputPath = path.join(outputDir, filename);
  
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create the PDF document
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  
  doc.pipe(stream);
  
  // Add header with logo and company info
  addHeaderWithLogo(doc, 'ORÇAMENTO');
  
  doc
    .fontSize(12)
    .fillColor('#000')
    .text(`Orçamento #ORC-${quote.id}`, { continued: true })
    .text(`Data: ${new Date(quote.createdAt).toLocaleDateString('pt-BR')}`, { align: 'right' })
    .moveDown();
  
  if (quote.validUntil) {
    doc
      .text(`Validade: ${new Date(quote.validUntil).toLocaleDateString('pt-BR')}`)
      .moveDown();
  }
  
  // Add client info
  doc
    .fontSize(14)
    .fillColor('#1d4ed8')
    .text('Dados do Cliente')
    .moveDown(0.5);
    
  doc
    .fontSize(12)
    .fillColor('#000')
    .text(`Nome: ${client.name}`)
    .text(`Contato: ${client.contactName || '-'}`)
    .text(`Email: ${client.email || '-'}`)
    .text(`Telefone: ${client.phone || '-'}`)
    .text(`Endereço: ${client.address || '-'}`)
    .moveDown();
  
  // Add quote description
  if (quote.description) {
    doc
      .fontSize(14)
      .fillColor('#1d4ed8')
      .text('Descrição')
      .moveDown(0.5);
      
    doc
      .fontSize(12)
      .fillColor('#000')
      .text(quote.description)
      .moveDown();
  }
  
  // Add items table
  doc
    .fontSize(14)
    .fillColor('#1d4ed8')
    .text('Itens do Orçamento')
    .moveDown(0.5);
  
  // Table headers
  const tableTop = doc.y;
  const itemX = 50;
  const typeX = 230;
  const qtyX = 300;
  const priceX = 370;
  const totalX = 450;
  
  doc
    .fontSize(10)
    .fillColor('#666')
    .text('Descrição', itemX, tableTop)
    .text('Tipo', typeX, tableTop)
    .text('Qtd', qtyX, tableTop)
    .text('Valor Unit.', priceX, tableTop)
    .text('Total', totalX, tableTop)
    .moveDown();
    
  // Add horizontal line
  doc
    .strokeColor('#ddd')
    .moveTo(itemX, doc.y)
    .lineTo(550, doc.y)
    .stroke()
    .moveDown(0.5);
  
  // Table rows
  let totalAmount = 0;
  
  items.forEach(item => {
    const y = doc.y;
    
    // Format prices
    const unitPrice = (item.unitPrice / 100).toLocaleString('pt-BR', { 
      style: 'currency', currency: 'BRL' 
    });
    
    const totalPrice = (item.total / 100).toLocaleString('pt-BR', { 
      style: 'currency', currency: 'BRL' 
    });
    
    totalAmount += item.total;
    
    doc
      .fontSize(10)
      .fillColor('#000')
      .text(item.description, itemX, y, { width: 170 })
      .text(item.type === 'material' ? 'Material' : 'Serviço', typeX, y)
      .text(item.quantity.toString(), qtyX, y)
      .text(unitPrice, priceX, y)
      .text(totalPrice, totalX, y)
      .moveDown();
      
    // Add horizontal line
    doc
      .strokeColor('#ddd')
      .moveTo(itemX, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(0.5);
  });
  
  // Total
  const formattedTotal = (totalAmount / 100).toLocaleString('pt-BR', { 
    style: 'currency', currency: 'BRL' 
  });
  
  doc
    .fontSize(12)
    .fillColor('#000')
    .text(`Valor Total: ${formattedTotal}`, { align: 'right' })
    .moveDown(2);
  
  // Terms and signature
  doc
    .fontSize(12)
    .text('Termos e Condições:', { underline: true })
    .fontSize(10)
    .text('1. Orçamento válido pelo prazo informado acima.', { continued: false, indent: 10 })
    .text('2. Valores sujeitos a alteração após o prazo de validade.', { continued: false, indent: 10 })
    .text('3. Pagamento conforme negociação com o cliente.', { continued: false, indent: 10 })
    .moveDown(3);
  
  // Signature fields
  const signatureY = doc.y;
  
  doc
    .strokeColor('#000')
    .moveTo(100, signatureY)
    .lineTo(250, signatureY)
    .stroke();
    
  doc
    .moveTo(350, signatureY)
    .lineTo(500, signatureY)
    .stroke();
  
  doc
    .fontSize(10)
    .text('Assinatura do Cliente', 120, signatureY + 5)
    .text('Data', 415, signatureY + 5);
  
  // Finalize the PDF
  doc.end();
  
  // Return the path where the file was saved
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(`/pdf/${filename}`);
    });
    stream.on('error', reject);
  });
}

export async function generateWorkOrderPDF(data: WorkOrderData): Promise<string> {
  const { workOrder, service, client, items, technicians } = data;
  
  // Create a unique filename
  const filename = `workorder_${workOrder.id}_${Date.now()}.pdf`;
  const outputDir = path.resolve("./public/pdf");
  const outputPath = path.join(outputDir, filename);
  
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create the PDF document
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  
  doc.pipe(stream);
  
  // Add header with logo and company info
  addHeaderWithLogo(doc, 'ORDEM DE SERVIÇO');
  
  doc
    .fontSize(12)
    .fillColor('#000')
    .text(`Ordem de Serviço #OS-${workOrder.id}`, { continued: true })
    .text(`Data: ${new Date(workOrder.createdAt).toLocaleDateString('pt-BR')}`, { align: 'right' })
    .moveDown();
  
  if (workOrder.scheduledDate) {
    doc
      .text(`Data agendada: ${new Date(workOrder.scheduledDate).toLocaleDateString('pt-BR')}`)
      .moveDown();
  }
  
  // Add client info
  doc
    .fontSize(14)
    .fillColor('#1d4ed8')
    .text('Dados do Cliente')
    .moveDown(0.5);
    
  doc
    .fontSize(12)
    .fillColor('#000')
    .text(`Nome: ${client.name}`)
    .text(`Contato: ${client.contactName || '-'}`)
    .text(`Email: ${client.email || '-'}`)
    .text(`Telefone: ${client.phone || '-'}`)
    .text(`Endereço: ${client.address || '-'}`)
    .moveDown();
  
  // Add service info
  doc
    .fontSize(14)
    .fillColor('#1d4ed8')
    .text('Dados do Serviço')
    .moveDown(0.5);
    
  // Traduzir o tipo de serviço
  let serviceTypeLabel = service.serviceType;
  switch(service.serviceType) {
    case "installation":
      serviceTypeLabel = "Instalação";
      break;
    case "maintenance":
      serviceTypeLabel = "Manutenção";
      break;
    case "repair":
      serviceTypeLabel = "Reparo";
      break;
    case "inspection":
      serviceTypeLabel = "Vistoria";
      break;
  }
  
  // Traduzir o status
  let statusLabel = workOrder.status;
  switch(workOrder.status) {
    case "completed":
      statusLabel = "Concluído";
      break;
    case "in_progress":
      statusLabel = "Em andamento";
      break;
    case "pending":
      statusLabel = "Pendente";
      break;
    case "cancelled":
      statusLabel = "Cancelado";
      break;
  }

  doc
    .fontSize(12)
    .fillColor('#000')
    .text(`Tipo: ${serviceTypeLabel}`)
    .text(`Status: ${statusLabel}`);
  
  if (service.description) {
    doc.text(`Descrição: ${service.description}`);
  }
  
  doc.moveDown();
  
  // Add technicians
  if (technicians.length > 0) {
    doc
      .fontSize(14)
      .fillColor('#1d4ed8')
      .text('Técnicos Responsáveis')
      .moveDown(0.5);
      
    technicians.forEach(tech => {
      doc
        .fontSize(12)
        .fillColor('#000')
        .text(`${tech.name} (${tech.role})`)
    });
    
    doc.moveDown();
  }
  
  // Add items table
  doc
    .fontSize(14)
    .fillColor('#1d4ed8')
    .text('Materiais e Serviços')
    .moveDown(0.5);
  
  // Table headers
  const tableTop = doc.y;
  const itemX = 50;
  const typeX = 230;
  const qtyX = 300;
  const priceX = 370;
  const totalX = 450;
  
  doc
    .fontSize(10)
    .fillColor('#666')
    .text('Descrição', itemX, tableTop)
    .text('Tipo', typeX, tableTop)
    .text('Qtd', qtyX, tableTop)
    .text('Valor Unit.', priceX, tableTop)
    .text('Total', totalX, tableTop)
    .moveDown();
    
  // Add horizontal line
  doc
    .strokeColor('#ddd')
    .moveTo(itemX, doc.y)
    .lineTo(550, doc.y)
    .stroke()
    .moveDown(0.5);
  
  // Table rows
  let totalAmount = 0;
  let totalMaterials = 0;
  let totalServices = 0;
  
  items.forEach(item => {
    const y = doc.y;
    
    // Format prices
    const unitPrice = (item.unitPrice / 100).toLocaleString('pt-BR', { 
      style: 'currency', currency: 'BRL' 
    });
    
    const totalPrice = (item.total / 100).toLocaleString('pt-BR', { 
      style: 'currency', currency: 'BRL' 
    });
    
    totalAmount += item.total;
    
    if (item.type === 'material') {
      totalMaterials += item.total;
    } else {
      totalServices += item.total;
    }
    
    doc
      .fontSize(10)
      .fillColor('#000')
      .text(item.description, itemX, y, { width: 170 })
      .text(item.type === 'material' ? 'Material' : 'Serviço', typeX, y)
      .text(item.quantity.toString(), qtyX, y)
      .text(unitPrice, priceX, y)
      .text(totalPrice, totalX, y)
      .moveDown();
      
    // Add horizontal line
    doc
      .strokeColor('#ddd')
      .moveTo(itemX, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(0.5);
  });
  
  // Totals
  const formattedTotalMaterials = (totalMaterials / 100).toLocaleString('pt-BR', { 
    style: 'currency', currency: 'BRL' 
  });
  
  const formattedTotalServices = (totalServices / 100).toLocaleString('pt-BR', { 
    style: 'currency', currency: 'BRL' 
  });
  
  const formattedTotal = (totalAmount / 100).toLocaleString('pt-BR', { 
    style: 'currency', currency: 'BRL' 
  });
  
  doc
    .fontSize(12)
    .fillColor('#000')
    .text(`Total Materiais: ${formattedTotalMaterials}`, { align: 'right' })
    .text(`Total Serviços: ${formattedTotalServices}`, { align: 'right' })
    .text(`Valor Total: ${formattedTotal}`, { align: 'right' })
    .moveDown(2);
  
  // Completion info
  doc
    .fontSize(14)
    .fillColor('#1d4ed8')
    .text('Conclusão do Serviço')
    .moveDown(0.5);
  
  // Signature fields
  const signatureY = doc.y;
  
  doc
    .strokeColor('#000')
    .moveTo(100, signatureY)
    .lineTo(250, signatureY)
    .stroke();
    
  doc
    .moveTo(350, signatureY)
    .lineTo(500, signatureY)
    .stroke();
  
  doc
    .fontSize(10)
    .text('Assinatura do Cliente', 120, signatureY + 5)
    .text('Assinatura do Técnico', 370, signatureY + 5)
    .moveDown(2);
  
  // Comments section
  doc
    .fontSize(12)
    .fillColor('#000')
    .text('Observações:', { underline: true })
    .moveDown();
  
  // Add a box for comments
  const commentBoxY = doc.y;
  
  doc
    .rect(50, commentBoxY, 500, 100)
    .stroke();
  
  // Finalize the PDF
  doc.end();
  
  // Return the path where the file was saved
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(`/pdf/${filename}`);
    });
    stream.on('error', reject);
  });
}
