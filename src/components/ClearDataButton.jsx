import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const ClearDataButton = () => {
  const { clearData } = useAppContext();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const handleClearClick = () => {
    setShowConfirmation(true);
  };
  
  const handleConfirm = () => {
    clearData();
    setShowConfirmation(false);
  };
  
  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="clear-data-container">
      <button 
        className="clear-data-icon-btn" 
        onClick={handleClearClick}
        aria-label="Clear all data"
      >
        <i className="clear-icon fas fa-trash-alt"></i>
      </button>
      
      {showConfirmation && (
        <div className="confirmation-backdrop" onClick={handleCancel}>
          <div className="confirmation-dialog compact-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-header">
              <i className="confirmation-icon fas fa-exclamation-triangle"></i>
              <h3 className="confirmation-title">Clear All Data?</h3>
            </div>
            
            <div className="confirmation-content compact-content">
              <div className="deletion-list compact-list">
                <div className="deletion-item"><i className="item-icon fas fa-image"></i> Uploaded image</div>
                <div className="deletion-item"><i className="item-icon fas fa-file-alt"></i> Extracted text</div>
                <div className="deletion-item"><i className="item-icon fas fa-question"></i> Generated questions</div>
                <div className="deletion-item"><i className="item-icon fas fa-comment"></i> Current answer</div>
                <div className="deletion-note">
                  <i className="note-icon fas fa-info-circle"></i>
                  <span>History and preferences will be preserved</span>
                </div>
              </div>
            </div>
            
            <div className="confirmation-actions">
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClearDataButton;