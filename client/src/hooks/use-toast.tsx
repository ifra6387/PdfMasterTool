import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

interface ToastState {
  toasts: Toast[];
}

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] });

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = genId();

    const newToast: Toast = {
      id,
      ...props,
    };

    setState((state) => ({
      ...state,
      toasts: [newToast, ...state.toasts].slice(0, TOAST_LIMIT),
    }));

    setTimeout(() => {
      setState((state) => ({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, TOAST_REMOVE_DELAY);

    return {
      id,
      dismiss: () => {
        setState((state) => ({
          ...state,
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },
    };
  }, []);

  return {
    toast,
    toasts: state.toasts,
  };
}