import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Utilitário para abrir PDFs de forma adequada para cada plataforma
 */
export const PdfViewer = {
  /**
   * Abre um PDF de acordo com a plataforma (web ou Android)
   * @param pdfUrl URL do PDF a ser aberto
   */
  async openPdf(pdfUrl: string): Promise<void> {
    try {
      // Se estamos rodando em dispositivo móvel (Android)
      if (Capacitor.isNativePlatform()) {
        // Em dispositivos móveis, usar o Browser plugin do Capacitor
        console.log("Abrindo PDF no dispositivo móvel:", pdfUrl);
        
        // Se for um caminho relativo, converter para URL completa
        if (pdfUrl.startsWith('/')) {
          // Em vez de usar window.location.origin, usamos o IP e porta do servidor
          const baseUrl = "http://129.213.63.94:10000";
          pdfUrl = `${baseUrl}${pdfUrl}`;
        }
        
        console.log("URL final do PDF no Android:", pdfUrl);
        
        // Abrir usando o Browser plugin
        await Browser.open({ 
          url: pdfUrl,
          windowName: '_system'
        });
      } 
      // Caso contrário (web)
      else {
        console.log("Abrindo PDF no navegador:", pdfUrl);
        
        // No navegador desktop, simplesmente abrir em nova aba
        if (pdfUrl.startsWith('/')) {
          pdfUrl = `${window.location.origin}${pdfUrl}`;
        }
        
        window.open(pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
      alert('Falha ao abrir o PDF. Tente o botão "Abrir PDF Direto".');
    }
  },
  
  /**
   * Retorna a URL completa de um PDF
   * @param pdfPath Caminho do PDF
   * @returns URL completa
   */
  getFullPdfUrl(pdfPath: string): string {
    // Se já for uma URL completa, retornar como está
    if (pdfPath.startsWith('http')) {
      return pdfPath;
    }
    
    // Se estamos no Android, usar o IP do servidor
    if (Capacitor.isNativePlatform()) {
      if (pdfPath.startsWith('/')) {
        return `http://129.213.63.94:10000${pdfPath}`;
      }
      return `http://129.213.63.94:10000/${pdfPath}`;
    }
    
    // Se for um caminho relativo na web, adicionar a origem
    if (pdfPath.startsWith('/')) {
      return `${window.location.origin}${pdfPath}`;
    }
    
    // Caso contrário, assumir que é relativo à raiz
    return `${window.location.origin}/${pdfPath}`;
  },
  
  /**
   * Gera e abre o PDF diretamente
   * @param pdfId ID do serviço ou orçamento
   * @param tipo 'service' ou 'quote'
   */
  async regenerateAndOpenPdf(pdfId: number, tipo: 'service' | 'quote'): Promise<void> {
    try {
      // Para Android, usamos o IP e porta específicos
      const baseUrl = Capacitor.isNativePlatform() ? "http://129.213.63.94:10000" : "";
      
      const endpoint = tipo === 'service' 
        ? `${baseUrl}/api/services/${pdfId}/generate-pdf` 
        : `${baseUrl}/api/quotes/${pdfId}/generate-pdf`;
      
      console.log(`Gerando PDF diretamente: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao gerar PDF: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.pdfPath) {
        await this.openPdf(data.pdfPath);
      } else {
        throw new Error('Caminho do PDF não recebido');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Não foi possível gerar o PDF. Por favor, tente novamente.');
    }
  }
};