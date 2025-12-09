'use client';

import React from 'react';
import { useEffect } from 'react';
import { useToast } from '@/components/context/ToastContext';

export default function PostLoginToastHandler() {
  const { showToast } = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('post_login_toast');
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (payload?.message) {
        // If a name field was included, prefer it
        showToast(payload.message, payload.type || 'success', payload.duration ?? 6000);
      }
      localStorage.removeItem('post_login_toast');
    } catch (e) {
      // ignore errors (invalid JSON, not present, etc.)
    }
  }, [showToast]);

  return null;
}
