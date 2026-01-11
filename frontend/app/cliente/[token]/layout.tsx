import { ReactNode } from 'react';
import { Toaster } from 'sonner';

export default function ClienteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {children}
      <Toaster position="top-center" richColors />
    </div>
  );
}
