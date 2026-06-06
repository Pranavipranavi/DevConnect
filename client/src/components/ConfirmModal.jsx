import { AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmModal({ open, title, body, confirmLabel = 'Confirm', onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="surface w-full max-w-md p-5" initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }} transition={{ duration: 0.18 }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="confirm-title" className="text-lg font-black">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-light dark:text-muted-dark">{body}</p>
                </div>
              </div>
              <button type="button" onClick={onCancel} className="btn-secondary px-3" aria-label="Close dialog"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
              <button type="button" onClick={onConfirm} className="btn-primary bg-rose-500 text-white hover:bg-rose-600">{confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
