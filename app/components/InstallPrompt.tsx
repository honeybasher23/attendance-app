'use client';

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 p-4 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-between z-50">
      <div>
        <p className="font-semibold text-sm">Install Attendance App</p>
        <p className="text-xs text-blue-100">Add to home screen for quick check-ins</p>
      </div>
      <button
        onClick={handleInstall}
        className="px-3 py-1.5 bg-white text-blue-600 font-medium text-xs rounded-lg shadow"
      >
        Install
      </button>
    </div>
  );
}