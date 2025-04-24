import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download } from "lucide-react";

interface PDFPreviewProps {
  pdfUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function PDFPreview({ 
  pdfUrl, 
  open, 
  onOpenChange, 
  title = "Visualização do PDF" 
}: PDFPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pdfUrl) {
      setIsLoading(true);
      setError(null);
      
      // Check if the PDF exists and is accessible
      fetch(pdfUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Erro ao carregar o PDF: ${response.status} ${response.statusText}`);
          }
          setIsLoading(false);
        })
        .catch(err => {
          setIsLoading(false);
          setError(err.message);
        });
    }
  }, [pdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="h-[70vh] w-full">
          {isLoading && (
            <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded-md">
              <div className="animate-pulse text-gray-600">Carregando PDF...</div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full w-full bg-red-50 rounded-md">
              <div className="text-red-600 text-center p-4">
                <p className="font-semibold mb-2">Erro ao carregar o PDF</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {pdfUrl && !isLoading && !error && (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full border rounded"
              title="PDF Preview"
            />
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {pdfUrl && !error && (
            <Button asChild>
              <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
