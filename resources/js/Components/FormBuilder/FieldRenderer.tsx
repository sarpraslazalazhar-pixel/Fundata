import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField } from '@/types';
import { CheckCircle2, Edit2, AlertCircle, PlusCircle } from 'lucide-react';
import ImageEditorModal from './ImageEditorModal';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import Swal from 'sweetalert2';

interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (fieldId: number, value: any) => void;
  errors?: Record<string, string>;
  paymentMethods?: any[];
  akads?: any[];
  campaigns?: any[];
  campaignId?: string;
  onCampaignChange?: (val: string) => void;
}

const inputFocusAnimation = {
  scale: 1.005,
  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
  borderColor: '#3b82f6',
  transition: { duration: 0.15 },
};

export default function FieldRenderer({ field, value, onChange, errors, paymentMethods = [], akads = [], campaigns = [], campaignId, onCampaignChange }: FieldRendererProps) {
  const error = errors?.[`form_data.${field.id}`];
  const errorClass = error ? 'border-red-500 ring-1 ring-red-200' : 'border-slate-300 hover:border-slate-400';

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  // State untuk form tambah donatur
  const [addDonaturOpen, setAddDonaturOpen] = useState(false);
  const [newDonatur, setNewDonatur] = useState({ tipe: 'Individu', nama_lengkap: '', no_telp: '', alamat: '', jenis_kelamin: 'L' });
  const [addDonaturLoading, setAddDonaturLoading] = useState(false);
  const [currentSearchValue, setCurrentSearchValue] = useState('');
  const [selectedDonaturOption, setSelectedDonaturOption] = useState<any>(null);

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
      case 'datetime_past': {
        const todayDateTime = new Date();
        todayDateTime.setMinutes(todayDateTime.getMinutes() - todayDateTime.getTimezoneOffset());
        const maxDateTime = todayDateTime.toISOString().slice(0, 16);
        return (
          <motion.input
            type="datetime-local"
            whileFocus={inputFocusAnimation}
            className={baseInputClasses}
            value={value || ''}
            max={maxDateTime}
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
      case 'metode_bayar': {
        const kategoriLabels: Record<string, string> = {
          'transfer_bank': 'Transfer Bank',
          'e_wallet': 'E-Wallet',
          'qris': 'QRIS',
          'cash': 'Tunai',
        };

        const groupedOptions = Object.entries(
          paymentMethods.reduce((acc: any, curr: any) => {
            if (!acc[curr.kategori]) acc[curr.kategori] = [];
            acc[curr.kategori].push(curr);
            return acc;
          }, {})
        ).map(([kategori, methods]: [string, any]) => ({
          label: kategoriLabels[kategori] || kategori,
          options: methods.map((m: any) => ({
            value: m.id,
            label: `${m.nama_bank} ${m.nomor_rekening ? '- ' + m.nomor_rekening : ''} ${m.nama_pemilik ? '(a.n. ' + m.nama_pemilik + ')' : ''}`,
            method: m
          }))
        }));
        
        const selectedOption = groupedOptions.flatMap(g => g.options).find(o => o.value === value);

        return (
          <div className="space-y-4">
            <Select
              options={groupedOptions}
              value={selectedOption || null}
              onChange={(option: any) => onChange(field.id, option ? option.value : null)}
              placeholder={`Cari dan pilih ${field.label.toLowerCase()}...`}
              isClearable
              className="text-sm"
              classNames={{
                control: (state) => `border rounded-lg ${state.isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300'}`,
              }}
              noOptionsMessage={() => "Metode pembayaran tidak ditemukan."}
            />
            {selectedOption?.method?.instruksi && (
              <div className="w-full p-3 bg-blue-50/50 rounded-lg text-sm text-slate-700 whitespace-pre-line border border-blue-100">
                <p className="font-semibold mb-1 text-blue-800">Instruksi Pembayaran:</p>
                {selectedOption.method.instruksi}
              </div>
            )}
            {selectedOption?.method?.logo_qris && (
              <div className="mt-2">
                <img src={`/storage/${selectedOption.method.logo_qris}`} alt="Logo/QRIS" className="max-w-[150px] object-contain rounded bg-white border p-1" />
              </div>
            )}
          </div>
        );
      }
      case 'donatur_lookup':
        const loadDonaturOptions = async (inputValue: string) => {
          try {
            const response = await axios.get(`/api/donatur/search?q=${inputValue}`);
            return response.data.map((d: any) => ({
              value: d.id,
              label: `${d.nama_lengkap} - ${d.tipe} ${d.no_telp ? '('+d.no_telp+')' : ''}`
            }));
          } catch (error) {
            console.error('Error fetching donatur', error);
            return [];
          }
        };

        const handleQuickStore = async (e: React.FormEvent) => {
          e.preventDefault();
          setAddDonaturLoading(true);
          try {
            const res = await axios.post('/api/donatur/quick-store', newDonatur);
            const newOption = res.data.donatur;
            setSelectedDonaturOption(newOption);
            onChange(field.id, newOption.value);
            setAddDonaturOpen(false);
            setNewDonatur({ tipe: 'Individu', nama_lengkap: '', no_telp: '', alamat: '', jenis_kelamin: 'L' });
            Swal.fire({
              icon: 'success',
              title: 'Berhasil',
              text: 'Donatur berhasil ditambahkan.',
              timer: 1500,
              showConfirmButton: false
            });
          } catch (error: any) {
            let errorMsg = 'Terjadi kesalahan.';
            if (error.response?.data?.errors) {
              errorMsg = Object.values(error.response.data.errors).flat().join('\n');
            }
            Swal.fire({
              icon: 'error',
              title: 'Gagal',
              text: errorMsg,
              confirmButtonColor: '#3b82f6'
            });
          } finally {
            setAddDonaturLoading(false);
          }
        };
        
        return (
          <>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadDonaturOptions}
              value={selectedDonaturOption}
              onChange={(selectedOption: any) => {
                setSelectedDonaturOption(selectedOption);
                onChange(field.id, selectedOption ? selectedOption.value : null);
              }}
              onInputChange={(inputValue) => setCurrentSearchValue(inputValue)}
              placeholder="Ketik untuk mencari donatur..."
              isClearable
              className="text-sm"
              classNames={{
                control: (state) => `border rounded-lg ${state.isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300'}`,
              }}
              noOptionsMessage={() => (
                <div className="p-2 text-center text-slate-500 flex flex-col items-center gap-2">
                  <span>Donatur "{currentSearchValue}" tidak ditemukan.</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setNewDonatur(prev => ({ ...prev, nama_lengkap: currentSearchValue }));
                      setAddDonaturOpen(true);
                    }}
                    className="flex items-center gap-1 mt-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Tambah Donatur Baru
                  </Button>
                </div>
              )}
            />

            <Dialog open={addDonaturOpen} onOpenChange={setAddDonaturOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Tambah Donatur Baru</DialogTitle>
                  <DialogDescription>
                    Masukkan data donatur baru. Donatur ini akan membutuhkan persetujuan admin.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleQuickStore} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={newDonatur.tipe}
                      onChange={e => setNewDonatur({...newDonatur, tipe: e.target.value})}
                      required
                    >
                      <option value="Individu">Individu</option>
                      <option value="Organisasi">Organisasi</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={newDonatur.nama_lengkap}
                      onChange={e => setNewDonatur({...newDonatur, nama_lengkap: e.target.value})}
                      required
                    />
                  </div>
                  {newDonatur.tipe === 'Individu' && (
                    <div className="space-y-2">
                      <Label>Jenis Kelamin</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={newDonatur.jenis_kelamin}
                        onChange={e => setNewDonatur({...newDonatur, jenis_kelamin: e.target.value})}
                      >
                        <option value="L">Laki-Laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>No. Telepon / WhatsApp <span className="text-red-500">*</span></Label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={newDonatur.no_telp}
                      onChange={e => setNewDonatur({...newDonatur, no_telp: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alamat Lengkap <span className="text-red-500">*</span></Label>
                    <textarea
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[80px]"
                      value={newDonatur.alamat}
                      onChange={e => setNewDonatur({...newDonatur, alamat: e.target.value})}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setAddDonaturOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={addDonaturLoading}>
                      {addDonaturLoading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </>
        );
      case 'akad': {
        const akadOptions = akads.map(parent => ({
          label: parent.nama_akad,
          options: parent.children?.length > 0 ? parent.children.map((child: any) => ({
            value: child.id,
            label: child.nama_akad,
            isCampaignRequired: child.is_campaign_required
          })) : [{
            value: parent.id,
            label: parent.nama_akad,
            isCampaignRequired: parent.is_campaign_required
          }]
        }));
        
        const selectedAkadOption = akadOptions.flatMap(g => g.options).find(o => o.value === value);

        return (
          <div className="space-y-4">
            <Select
              options={akadOptions}
              value={selectedAkadOption || null}
              onChange={(option: any) => {
                onChange(field.id, option ? option.value : null);
                if (option && !option.isCampaignRequired && onCampaignChange) {
                  onCampaignChange('');
                }
              }}
              placeholder={`Pilih ${field.label.toLowerCase()}...`}
              isClearable
              className="text-sm"
              classNames={{
                control: (state) => `border rounded-lg ${state.isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300'}`,
              }}
            />
            {selectedAkadOption?.isCampaignRequired && campaigns.length > 0 && onCampaignChange && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <Label className="mb-2 block text-sm font-semibold">Pilih Campaign/Program <span className="text-red-500">*</span></Label>
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={campaignId || ''}
                  onChange={e => onCampaignChange(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Program --</option>
                  {campaigns.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nama_campaign}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      }
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
