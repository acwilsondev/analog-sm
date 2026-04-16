'use client';

import { useTransition } from 'react';
import { adminSetGlobalSettingAction } from '@/shell/actions/admin';

interface AdminSettingsPanelProps {
  registrationsOpen: boolean;
}

export default function AdminSettingsPanel({ registrationsOpen }: AdminSettingsPanelProps) {
  const [isPending, startTransition] = useTransition();

  function toggleRegistrations() {
    startTransition(async () => {
      await adminSetGlobalSettingAction('registrations_open', registrationsOpen ? 'false' : 'true');
    });
  }

  const privateInstance = process.env.NEXT_PUBLIC_PRIVATE_INSTANCE === 'true';

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Instance Settings</h2>
      <div className="rounded-xl border divide-y">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-medium text-sm">Public Registrations</p>
            <p className="text-xs text-muted-foreground">Allow new users to register accounts</p>
          </div>
          <button
            onClick={toggleRegistrations}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${registrationsOpen ? 'bg-blue-500' : 'bg-input'}`}
            role="switch"
            aria-checked={registrationsOpen}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${registrationsOpen ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-medium text-sm">Private Instance</p>
            <p className="text-xs text-muted-foreground">
              Controlled via <code className="bg-muted px-1 rounded">PRIVATE_INSTANCE</code> environment variable
            </p>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${privateInstance ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {privateInstance ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
    </section>
  );
}
