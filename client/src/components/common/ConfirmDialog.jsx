import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Confirm Action', message, loading = false, confirmLabel = 'Confirm', danger = false }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
