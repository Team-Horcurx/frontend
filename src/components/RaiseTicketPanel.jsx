import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowLeft, FiUpload } from 'react-icons/fi';
import {
  createTicket,
  getPhotoUploadUrl,
  resetCreateStatus,
  selectCreateStatus,
  selectCreateError,
} from '../Redux/slices/ticketsSlice.js';
import { selectSelectedProperty } from '../Redux/slices/propertiesSlice.js';
import { selectSelectedWard } from '../Redux/slices/wardsSlice.js';
import './RaiseTicketPanel.css';

export default function RaiseTicketPanel({ onBack, onSuccess }) {
  const dispatch = useDispatch();
  const selectedProperty = useSelector(selectSelectedProperty);
  const selectedWard = useSelector(selectSelectedWard);
  const createStatus = useSelector(selectCreateStatus);
  const createError = useSelector(selectCreateError);

  const [houseNumber, setHouseNumber] = useState('');
  const [description, setDescription] = useState('');
  const [taxPending, setTaxPending] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoS3Key, setPhotoS3Key] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  useEffect(() => {
    if (createStatus === 'succeeded') {
      dispatch(resetCreateStatus());
      onSuccess?.();
    }
  }, [createStatus, dispatch, onSuccess]);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const result = await dispatch(getPhotoUploadUrl(file.name));
      if (getPhotoUploadUrl.fulfilled.match(result)) {
        const { upload_url, s3_key } = result.payload;
        await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'image/jpeg' },
        });
        setPhotoS3Key(s3_key);
      } else {
        setPhotoError('Failed to get upload URL.');
      }
    } catch {
      setPhotoError('Photo upload failed.');
    } finally {
      setPhotoUploading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!houseNumber.trim() || !description.trim()) return;
    dispatch(createTicket({
      wardId: selectedWard?.id ?? '',
      propertyId: selectedProperty?.id ?? null,
      houseNumber: houseNumber.trim(),
      description: description.trim(),
      taxPending: taxPending ? parseFloat(taxPending) : null,
      photoS3Key: photoS3Key ?? null,
    }));
  }

  const wardName = selectedWard?.name ?? `Ward ${selectedWard?.id ?? ''}`;
  const isSubmitting = createStatus === 'loading';
  const succeeded = createStatus === 'succeeded';

  return (
    <div className="raise-ticket-panel">
      <div className="raise-ticket-panel__header">
        <button
          className="raise-ticket-panel__back-btn"
          onClick={onBack}
          aria-label="Go back"
          type="button"
        >
          <FiArrowLeft size={16} />
        </button>
        <span className="raise-ticket-panel__title">Raise a Ticket</span>
      </div>

      <form className="raise-ticket-panel__form" onSubmit={handleSubmit}>
        <div className="raise-ticket-panel__field">
          <label className="raise-ticket-panel__label">Ward</label>
          <input
            className="raise-ticket-panel__input raise-ticket-panel__input--disabled"
            value={wardName}
            disabled
            readOnly
          />
        </div>

        <div className="raise-ticket-panel__field">
          <label className="raise-ticket-panel__label">
            House Number <span className="raise-ticket-panel__required">*</span>
          </label>
          <input
            className="raise-ticket-panel__input"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder="e.g. 12-4-56/A"
            required
          />
        </div>

        <div className="raise-ticket-panel__field">
          <label className="raise-ticket-panel__label">
            Description <span className="raise-ticket-panel__required">*</span>
          </label>
          <textarea
            className="raise-ticket-panel__textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you observed…"
            rows={3}
            required
          />
        </div>

        <div className="raise-ticket-panel__field">
          <label className="raise-ticket-panel__label">
            Tax Pending (₹) <span className="raise-ticket-panel__optional">optional</span>
          </label>
          <input
            className="raise-ticket-panel__input"
            type="number"
            min="0"
            step="0.01"
            value={taxPending}
            onChange={(e) => setTaxPending(e.target.value)}
            placeholder="e.g. 25000"
          />
        </div>

        <div className="raise-ticket-panel__field">
          <label className="raise-ticket-panel__label">
            Photograph <span className="raise-ticket-panel__optional">optional</span>
          </label>
          <label className="raise-ticket-panel__upload-btn" aria-label="Upload photo">
            <FiUpload size={14} />
            {photoUploading
              ? 'Uploading…'
              : photoFile
              ? photoFile.name
              : 'Upload Photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/heic,image/webp"
              onChange={handlePhotoChange}
              disabled={photoUploading}
              className="raise-ticket-panel__file-input"
            />
          </label>
          {photoS3Key && !photoUploading && (
            <span className="raise-ticket-panel__upload-ok">Photo ready</span>
          )}
          {photoError && (
            <span className="raise-ticket-panel__upload-error">{photoError}</span>
          )}
        </div>

        <button
          type="submit"
          className="raise-ticket-panel__submit-btn"
          disabled={isSubmitting || photoUploading || succeeded}
        >
          {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
        </button>

        <AnimatePresence>
          {createError && (
            <motion.div
              key="ticket-error"
              className="raise-ticket-panel__error"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {createError}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
