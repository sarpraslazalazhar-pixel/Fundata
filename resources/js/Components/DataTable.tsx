import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  columnBorders?: boolean;
}

const tbodyVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 28,
    },
  },
  exit: {
    opacity: 0,
    x: 12,
    transition: { duration: 0.15 },
  },
};

export function DataTable<T>({ columns, data, keyExtractor, emptyMessage = 'Tidak ada data.', columnBorders = false }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-center py-12 text-slate-400 font-medium text-sm"
      >
        {emptyMessage}
      </motion.div>
    );
  }

  return (
    <Table className="overflow-hidden">
      <TableHeader>
        <TableRow className="hover:bg-transparent border-b border-slate-200">
          {columns.map((col) => (
            <TableHead key={col.key} className={cn("font-semibold text-slate-700 text-xs uppercase tracking-wider", col.className, columnBorders && "border-l border-slate-200 first:border-l-0")}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <AnimatePresence mode="wait">
        <motion.tbody
          key={data.length > 0 ? keyExtractor(data[0]) : 'empty'}
          variants={tbodyVariants}
          initial="hidden"
          animate="show"
          className="divide-y divide-slate-100"
        >
          {data.map((item) => {
            const rowKey = keyExtractor(item);
            return (
              <motion.tr
                key={rowKey}
                variants={rowVariants}
                whileHover={{ backgroundColor: 'rgba(241, 245, 249, 0.65)' }}
                className="transition-colors duration-150 border-b border-slate-100/80"
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn("py-3 text-sm text-slate-700", col.className, columnBorders && "border-l border-slate-200 first:border-l-0")}>
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </TableCell>
                ))}
              </motion.tr>
            );
          })}
        </motion.tbody>
      </AnimatePresence>
    </Table>
  );
}
