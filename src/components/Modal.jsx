import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  size = 'medium', 
  showCloseButton = true,
  closeOnOutsideClick = true,
  className = '',
}) => {
  const modalRef = useRef(null);
  
  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    // Add body class to prevent scrolling when modal is open
    if (isOpen) {
      document.body.classList.add('modal-open');
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose]);
  
  // Handle click outside modal
  const handleOutsideClick = (event) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };
  
  // Size class mapping
  const sizeClasses = {
    small: 'modal-sm',
    medium: 'modal-md',
    large: 'modal-lg',
    fullscreen: 'modal-fullscreen',
  };
  
  // Don't render if not open
  if (!isOpen) return null;
  
  // Portal to render at the end of the document body
  return ReactDOM.createPortal(
    <div className="modal-backdrop" onClick={handleOutsideClick}>
      <div
        ref={modalRef}
        className={`modal ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-content">
          <div className="modal-header">
            {title && <h3 id="modal-title" className="modal-title">{title}</h3>}
            {showCloseButton && (
              <button 
                type="button" 
                className="modal-close-button" 
                onClick={onClose}
                aria-label="Close modal"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;