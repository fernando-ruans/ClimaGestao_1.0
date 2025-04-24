import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export function ResponsiveContainer({
  children,
  className,
  gap = 'md',
  columns = { sm: 1, md: 2, lg: 3 }
}: ResponsiveContainerProps) {
  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }[gap];

  // Cria classes para grid responsivo baseado no número de colunas
  const gridClass = [
    columns.sm && `grid-cols-${columns.sm}`,
    columns.md && `sm:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('grid', gapClass, gridClass, className)}>
      {children}
    </div>
  );
}