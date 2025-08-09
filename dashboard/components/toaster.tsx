'use client';

import React from 'react';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

const TOAST_LIMIT = 1;
type ToasterToast = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastClose>;

interface ToastMessage extends Omit<ToasterToast, 'id'> {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
}

type ToastState = {
  toasts: ToastMessage[];
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const toastState: ToastState = {
  toasts: [],
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}


function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    toastState.toasts = toastState.toasts.filter(t => t.id !== toastId);
    notify();
  }, 1000000);

  toastTimeouts.set(toastId, timeout);
}

function notify() {
  (window as any).__toastStateChange?.(toastState.toasts);
}

export const toast = (props: Omit<ToastMessage, 'id'>) => {
  const id = genId();

  const toast: ToastMessage = {
    ...props,
    id,
  };

  toastState.toasts = [
    ...toastState.toasts,
    toast as ToastMessage,
  ].slice(0, TOAST_LIMIT);

  addToRemoveQueue(id);
  notify();

  return {
    id,
    dismiss: () => dismiss(id),
    update: (props: Omit<ToastMessage, 'id'>) => update(id, props),
  };
};

function dismiss(toastId?: string) {
  if (toastId) {
    toastState.toasts = toastState.toasts.filter(t => t.id !== toastId);
    notify();
  } else {
    toastState.toasts = [];
    notify();
  }
}

function update(toastId: string, props: Omit<ToastMessage, 'id'>) {
  toastState.toasts = toastState.toasts.map(t =>
    t.id === toastId ? { ...t, ...props } : t
  );
  notify();
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  React.useEffect(() => {
    (window as any).__toastStateChange = setToasts;
    setToasts(toastState.toasts);
    return () => {
      (window as any).__toastStateChange = undefined;
    };
  }, []);

  return {
    ...toast,
    toasts,
  };
}
