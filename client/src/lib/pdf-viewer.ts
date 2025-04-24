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
        // que abrirá o PDF no navegador ou aplicativo adequado
        console.log("Abrindo PDF no dispositivo móvel:", pdfUrl);
        
        // Se for um caminho relativo, converter para URL completa
        if (pdfUrl.startsWith('/')) {
          const baseUrl = window.location.origin;
          pdfUrl = `${baseUrl}${pdfUrl}`;
        }
        
        // Abrir usando o Browser plugin
        await Browser.open({ url: pdfUrl });
      } 
      // Caso contrário (web)
      else {
        console.log("Abrindo PDF no navegador:", pdfUrl);
        
        // No navegador desktop, simplesmente abrir em nova aba
        window.open(pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir PDF:', error);
      throw error;
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
    
    // Se for um caminho relativo, adicionar a origem
    if (pdfPath.startsWith('/')) {
      return `${window.location.origin}${pdfPath}`;
    }
    
    // Caso contrário, assumir que é relativo à raiz
    return `${window.location.origin}/${pdfPath}`;
  }
};