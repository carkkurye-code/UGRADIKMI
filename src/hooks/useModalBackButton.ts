import { useEffect, useRef } from 'react';

type ModalEntry = {
  id: string;
  onClose: () => void;
  pushedHistory: boolean;
};

const modalStack: ModalEntry[] = [];
let isProgrammaticPop = false;

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (isProgrammaticPop) {
      isProgrammaticPop = false;
      return;
    }

    if (modalStack.length > 0) {
      const topModal = modalStack.pop();
      if (topModal) {
        topModal.pushedHistory = false;
        try {
          topModal.onClose();
        } catch (err) {
          console.error('Error closing modal on popstate:', err);
        }
      }
    }
  });
}

export function dismissModalWithoutHistoryPop(modalId: string) {
  const index = modalStack.findIndex((item) => item.id === modalId);
  if (index !== -1) {
    modalStack[index].pushedHistory = false;
  }
}

export function useModalBackButton(isOpen: boolean, onClose: () => void, modalId?: string) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const idRef = useRef(modalId || Math.random().toString(36).substring(2));

  useEffect(() => {
    if (!isOpen) return;

    const currentId = idRef.current;
    let pushed = false;

    if (typeof window !== 'undefined' && window.history) {
      const stateObj = { isUgrawModalOpen: true, modalId: currentId };
      window.history.pushState(stateObj, '');
      pushed = true;
    }

    const entry: ModalEntry = {
      id: currentId,
      onClose: () => onCloseRef.current(),
      pushedHistory: pushed,
    };

    modalStack.push(entry);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const top = modalStack[modalStack.length - 1];
        if (top && top.id === currentId) {
          onCloseRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);

      const index = modalStack.findIndex((item) => item.id === currentId);
      if (index !== -1) {
        const [removed] = modalStack.splice(index, 1);
        if (
          typeof window !== 'undefined' &&
          removed.pushedHistory &&
          window.history.state &&
          window.history.state.isUgrawModalOpen &&
          window.history.state.modalId === currentId
        ) {
          isProgrammaticPop = true;
          window.history.back();
        }
      }
    };
  }, [isOpen]);
}
