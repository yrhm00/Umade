import React from 'react';
import { useToastStore } from '@/stores/toastStore';
import { Toast } from './Toast';

export function GlobalToast() {
  const { visible, type, title, message, duration, action, hide } = useToastStore();

  return (
    <Toast
      visible={visible}
      type={type}
      title={title}
      message={message}
      duration={duration}
      action={action}
      onDismiss={hide}
    />
  );
}
