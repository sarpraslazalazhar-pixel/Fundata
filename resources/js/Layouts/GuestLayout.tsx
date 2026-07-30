import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';


interface GuestLayoutProps {
 children: React.ReactNode;
 title?: string;
}

export default function GuestLayout({ children, title }: GuestLayoutProps) {
 const { appConfig } = usePage<any>().props;

 return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/60 px-4 relative selection:bg-blue-100 selection:text-blue-900">
  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
 {title && <Head title={title} />}



 <div className="w-full max-w-md">
 <div className="mb-8 text-center">
 <Link href="/" className="inline-flex items-center gap-2 font-semibold text-xl">
 {appConfig?.logo_path ? (
 <img src={`/storage/${appConfig.logo_path}`} alt="Logo" className="h-10 object-contain" />
 ) : (
 <div className="w-10 h-10 bg-[#00a2e8] rounded-full flex items-center justify-center relative overflow-hidden shrink-0">
 <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full"></div>
 <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-[#f39c12] rounded-full"></div>
 <div className="absolute bottom-1/4 w-5 h-2.5 border-b-2 border-white rounded-full"></div>
 </div>
 )}
 <span className="text-[#1a2b4c] truncate" title={appConfig?.nama_sistem || 'Fundata'}>
 {appConfig?.nama_sistem || 'Fundata'}
 </span>
 </Link>
 </div>

  <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 relative z-10 w-full">
 {children}
 </div>
 </div>
 </div>
 );
}
