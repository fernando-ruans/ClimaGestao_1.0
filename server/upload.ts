import path from 'path';
import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';

// Garantir que o diretório de uploads existe
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer para salvar os arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gera um nome de arquivo único com UUID para evitar colisões
    const uniqueSuffix = `${randomUUID()}-${Date.now()}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

// Filtrar uploads para apenas permitir imagens
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceita apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas'));
  }
};

// Configurar multer com limites
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // limite de 5MB
  },
});

// Função para obter a URL de uma imagem com base no nome do arquivo
export function getImageUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `/uploads/${filename}`;
}

// Middleware para servir arquivos estáticos da pasta 'uploads'
export function setupStaticFiles(app: any) {
  app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
    // Define os cabeçalhos de cache para arquivos estáticos
    res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 ano
    next();
  });
  
  // Servir arquivos da pasta uploads
  app.use("/uploads", express.static(uploadDir));
}

// Handler de erros do multer
export function handleMulterError(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    // Um erro do Multer ocorreu durante o upload
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'Arquivo muito grande. O tamanho máximo permitido é 5MB.' 
      });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  } else if (err) {
    // Um erro desconhecido ocorreu
    return res.status(500).json({ error: err.message });
  }
  
  // Se não for um erro, continue para o próximo middleware
  next();
}