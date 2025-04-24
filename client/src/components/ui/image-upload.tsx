import React, { useState, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  defaultImage: string | null;
  onImageUpload: (file: File | null) => void;
  onImageRemove?: () => void;
  disabled?: boolean;
  className?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function ImageUpload({
  defaultImage,
  onImageUpload,
  onImageRemove,
  disabled = false,
  className = '',
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}: ImageUploadProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage);

  // Converte MB para bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateAndProcessFile = (file: File) => {
    // Verifica o tipo do arquivo
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo não suportado',
        description: `Tipos de arquivo permitidos: ${allowedTypes.map(type => type.replace('image/', '.')).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Verifica o tamanho do arquivo
    if (file.size > maxSizeBytes) {
      toast({
        title: 'Arquivo muito grande',
        description: `O tamanho máximo permitido é ${maxSizeMB}MB`,
        variant: 'destructive'
      });
      return;
    }

    // Cria uma prévia da imagem
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Notifica o componente pai sobre o arquivo
    onImageUpload(file);

    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    validateAndProcessFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    validateAndProcessFile(file);
  }, [disabled, validateAndProcessFile]);

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageUpload(null);
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary/70',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept={allowedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="relative w-full h-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="object-contain w-full h-full p-2"
            />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <div className="p-3 bg-muted rounded-full">
              {isMobile ? <Camera size={24} /> : <Upload size={24} />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isMobile ? 'Tirar foto' : 'Arraste uma imagem ou clique aqui'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isMobile 
                  ? 'Ou selecione da galeria' 
                  : `Formatos: ${allowedTypes.map(t => t.replace('image/', '.')).join(', ')} (max. ${maxSizeMB}MB)`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}