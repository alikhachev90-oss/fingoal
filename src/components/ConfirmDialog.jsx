import { useEffect, useRef } from 'react'
import { Button } from './UI'
import { useApp } from '../context/AppContext'

// In-app confirmation. window.confirm is suppressed or ignored in installed
// PWAs (notably iOS standalone), where it silently returns false — so a
// "Delete" button simply did nothing. This dialog always works.
export default function ConfirmDialog({ message, confirmLabel, danger = true, onConfirm, onCancel, busy = false }) {
  const dialog = useRef(null)
  const { t } = useApp()

  useEffect(() => {
    const node = dialog.current
    node.showModal()
    return () => node.close()
  }, [])

  return (
    <dialog
      ref={dialog}
      className="payments-dialog"
      aria-labelledby="confirm-dialog-text"
      onCancel={(e) => { e.preventDefault(); if (!busy) onCancel() }}
    >
      <div className="space-y-4">
        <p id="confirm-dialog-text" className="text-sm leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={onCancel} disabled={busy}>{t('common.cancel')}</Button>
          <Button variant={danger ? 'danger' : 'primary'} type="button" onClick={onConfirm} disabled={busy}>
            {busy ? t('common.saving') : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
