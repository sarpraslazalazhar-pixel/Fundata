import React, { useState, useEffect } from 'react';
import { Input } from '@/Components/ui/input';
import { Search, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
 placeholder?: string;
 paramName?: string;
 className?: string;
}

export function SearchInput({ placeholder = 'Cari...', paramName = 'search', className = '' }: SearchInputProps) {
 const [value, setValue] = useState('');
 const debouncedValue = useDebounce(value, 400);

 // Sync state with URL on initial load if present
 useEffect(() => {
   const params = new URLSearchParams(window.location.search);
   if (params.has(paramName)) {
     setValue(params.get(paramName) || '');
   }
 }, [paramName]);

 useEffect(() => {
   // Check if URL already has the value to prevent infinite loop on mount
   const params = new URLSearchParams(window.location.search);
   if (params.get(paramName) === debouncedValue || (!params.has(paramName) && !debouncedValue)) {
     return;
   }
   
   router.get(window.location.pathname, { [paramName]: debouncedValue || undefined }, {
       preserveState: true,
       preserveScroll: true,
       replace: true,
   });
 }, [debouncedValue, paramName]);

 return (
 <div className={`relative w-full max-w-sm ${className}`}>
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 value={value}
 onChange={(e) => setValue(e.target.value)}
 placeholder={placeholder}
 className="pl-9 pr-8"
 />
 {value && (
 <button
 onClick={() => setValue('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
 >
 <X className="h-4 w-4" />
 </button>
 )}
 </div>
 );
}
