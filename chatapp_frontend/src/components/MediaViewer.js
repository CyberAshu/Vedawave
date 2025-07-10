import React, { useEffect } from 'react';

const MediaViewer = ({ show, onClose, src, type }) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose} // Close when clicking on backdrop
    >
      <div 
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on media
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 text-black rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 shadow-lg z-10"
          title="Close (Esc)"
        >
          ×
        </button>
        
        {/* Media content */}
        {type.startsWith('image') ? (
          <img 
            src={src} 
            alt="Media" 
            className="max-w-full max-h-screen rounded shadow-2xl" 
          />
        ) : type.startsWith('video') ? (
          <video 
            src={src} 
            controls 
            className="max-w-full max-h-screen rounded shadow-2xl"
            autoPlay={false}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="bg-white p-4 rounded shadow-2xl">
            <p>Unsupported media type</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaViewer;

