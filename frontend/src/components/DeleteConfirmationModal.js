// frontend/src/components/DeleteConfirmationModal.js
import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Song",
  message = "Are you sure you want to delete this song from the round? This action cannot be undone.",
  songInfo = null
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h2 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="btn-icon" 
            style={{ width: '32px', height: '32px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Song Info (if provided) */}
        {songInfo && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
              {songInfo.title}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {songInfo.artist}
            </div>
          </div>
        )}

        {/* Warning Message */}
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#991b1b',
            fontSize: '15px',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end' 
        }}>
          <button 
            onClick={onClose} 
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="btn-danger"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <Trash2 size={18} />
            Delete Song
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;