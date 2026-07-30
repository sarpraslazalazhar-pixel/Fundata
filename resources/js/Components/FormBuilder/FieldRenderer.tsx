import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField } from '@/types';
import { CheckCircle2, Edit2, AlertCircle } from 'lucide-react';
import ImageEditorModal from './ImageEditorModal';

interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (fieldId: number, value: any) => void;
  errors?: Record<string, string>;
}

const inputFocusAnimation = {
  scale: 1.005,
  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
  borderColor: '#3b82f6',
  transition: { duration: 0.15 },
};

export default function FieldRenderer({ field, value, onChange, errors }: FieldRendererProps) {
  const error = errors?.[`form_data.${field.id}`];
  const errorClass = error ? 'border-red-500 ring-1 ring-red-200' : 'border-slate-300 hover:border-slate-400';

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const baseInputClasses = `w-full border rounded-lg p-2.5 text-sm bg-white text-slate-800 transition-colors duration-150 outline-none ${errorClass}`;

  const renderInput = () => {
    switch (field.tipe_field) {
      case 'teks_pendek':
        return (
          <motion.input
            type="text"
            whileFocus={inputFocusAnimation}
            className={baseInputClasses}
            value={value || ''}
            onChange={e => onChange(field.id, e.target.value)}
            required={field.wajib}
            placeholder={`Masukkan ${field.label.toLowerCase()}...`}
          />
        );
      case 'teks_panjang':
        return (
          <motion.textarea
            whileFocus={inputFocusAnimation}
            className={baseInputClasses}
            rows={4}
            value={value || ''}
            onChange={e => onChange(field.id, e.target.value)}
            required={field.wajib}
            placeholder={`Masukkan ${field.label.toLowerCase()}...`}
          />
        );
      case 'angka':
        return (
          <motion.input
            type="number"
            whileFocus={inputFocusAnimation}
            className={baseInputClasses}
            value={value || ''}
            onChange={e => onChange(field.id, e.target.value)}
            required={field.wajib}
            placeholder="0"
          />
        );
      case 'tanggal': {
        const todayDate = new Date();
        todayDate.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset());
        const minDate = todayDate.toISOString().split('T')[0];
        return (
          <motion.input
            type="date"
            whileFocus={inputFocusAnimation}
            className={baseInputClasses}
            value={value || ''}
            min={minDate}
            onChange={e => onChange(field.id, e.target.value)}
            required={field.wajib}
          />
        );
      }
      case 'waktu':
        return (
          <motion.input
            type="time"
            whileFocus={inputFocusAnimation}
            className={baseInputClasses}
            value={value || ''}
            onChange={e => onChange(field.id, e.target.value)}
            required={field.wajib}
          />
        );
      case 'datetime': {
        const todayDateTime = new Date();
        todayDateTime.setMinutes(todayDateTime.getMinutes() - todayDateTime.getTimezoneOffset());
        const minDateTime = todayDateTime.toISOString().slice(0, 16);
        return (
          <motion.input
            type="datetime-local"
            whileFocus={inputFocusAnimation}
            className={baseInputClasses}
            value={value || ''}
            min={minDateTime}
            onChange={e => onChange(field.id, e.target.value)}
            required={field.wajib}
          />
        );
      }
      case 'dropdown':
        return (
          <motion.select
            whileFocus={inputFocusAnimation}
            className={baseInputClasses}
            value={value || ''}
            onChange={e => onChange(field.id, e.target.value)}
            required={field.wajib}
          >
            <option value="">-- Pilih {field.label} --</option>
            {(field.opsi || []).map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </motion.select>
        );
      case 'radio':
        return (
          <div className="flex flex-wrap gap-2.5">
            {(field.opsi || []).map((opt, i) => {
              const isSelected = value === opt;
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => onChange(field.id, opt)}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex-1 basis-[140px] max-w-[200px] p-2.5 border rounded-xl text-center flex items-center justify-center gap-2 font-medium text-sm transition-all duration-150 outline-none
                    ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 
                    'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 shadow-sm'}
                  `}
                >
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  <span>{opt}</span>
                </motion.button>
              );
            })}
          </div>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <motion.input
              type="checkbox"
              whileTap={{ scale: 0.85 }}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              checked={!!value}
              onChange={e => onChange(field.id, e.target.checked)}
            />
            <span className="text-sm text-slate-700 font-medium">Ya, setuju</span>
          </label>
        );
      case 'multi_pilih':
        return (
          <div className="flex flex-wrap gap-2.5">
            {(field.opsi || []).map((opt, i) => {
              const current = value || [];
              const isSelected = current.includes(opt);
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => {
                    const newValue = isSelected
                      ? current.filter((v: string) => v !== opt)
                      : [...current, opt];
                    onChange(field.id, newValue);
                  }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex-1 basis-[140px] max-w-[200px] p-2.5 border rounded-xl text-center flex items-center justify-center gap-2 font-medium text-sm transition-all duration-150 outline-none
                    ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 
                    'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 shadow-sm'}
                  `}
                >
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  <span>{opt}</span>
                </motion.button>
              );
            })}
          </div>
        );

      case 'nominal_rp': {
        const displayValue = value ? new Intl.NumberFormat('id-ID').format(Number(value)) : '';
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">Rp</span>
            <motion.input
              type="text"
              whileFocus={inputFocusAnimation}
              className={`${baseInputClasses} pl-10`}
              value={displayValue}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '');
                onChange(field.id, raw);
              }}
              required={field.wajib}
              placeholder="0"
            />
          </div>
        );
      }
      case 'upload_gambar':
      case 'upload_file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              className={`w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${errorClass}`}
              accept={field.tipe_field === 'upload_gambar' ? 'image/*' : undefined}
              onChange={e => {
                const file = e.target.files?.[0] || null;
                if (field.tipe_field === 'upload_gambar' && file && file.type.startsWith('image/')) {
                  setSelectedImageFile(file);
                  setEditorOpen(true);
                } else {
                  onChange(field.id, file);
                }
              }}
              required={field.wajib && !value}
            />
            {field.tipe_field === 'upload_gambar' && value instanceof File && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 flex items-center gap-3 p-3 border rounded-xl bg-slate-50 border-slate-200"
              >
                <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300">
                  <img src={URL.createObjectURL(value)} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{value.name}</p>
                  <p className="text-xs text-slate-500">{(value.size / 1024).toFixed(1)} KB</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setSelectedImageFile(value);
                    setEditorOpen(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-100/60 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </motion.button>
              </motion.div>
            )}
          </div>
        );
      default:
        return (
          <motion.input
            type="text"
            whileFocus={inputFocusAnimation}
            className={baseInputClasses}
            value={value || ''}
            onChange={e => onChange(field.id, e.target.value)}
          />
        );
    }
  };

  if (field.tipe_field === 'info_peraturan') {
    let title = "Informasi Peraturan";
    let content = field.label;
    
    if (field.label.includes(':')) {
      const parts = field.label.split(':');
      title = parts[0].trim();
      content = parts.slice(1).join(':').trim();
    }

    const sentences = content.split(/\.\s+|\n/).filter(s => s.trim().length > 0);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-sm text-amber-900 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-2 font-bold text-amber-800 text-base">
          <span className="text-lg">⚠️</span>
          <span>{title}</span>
        </div>
        {sentences.length > 1 ? (
          <ol className="list-decimal list-outside ml-5 space-y-1 text-amber-900">
            {sentences.map((s, i) => (
              <li key={i}>{s.trim()}{s.trim().endsWith('.') ? '' : '.'}</li>
            ))}
          </ol>
        ) : (
          <p className="text-amber-900">{content}</p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {field.label}
        {field.wajib && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 text-red-500 text-xs mt-1"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {selectedImageFile && (
        <ImageEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          imageFile={selectedImageFile}
          onSave={(editedFile) => {
            onChange(field.id, editedFile);
            setEditorOpen(false);
          }}
        />
      )}
    </div>
  );
}
