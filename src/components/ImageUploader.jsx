import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAppContext } from '../context/AppContext';
import { extractTextFromImage } from '../services/visionApi';
import Modal from './Modal';

const ImageUploader = () => {
  const { 
    image,
    setImage, 
    setExtractedText, 
    setQuestions, 
    error, 
    setError, 
    isLoading, 
    setIsLoading,
    isDarkMode 
  } = useAppContext();
  
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [processingStage, setProcessingStage] = useState(null); // null, 'preparing', 'uploading', 'extracting'
  const [processingProgress, setProcessingProgress] = useState(0);
  const [facingMode, setFacingMode] = useState("environment"); // Default to back camera
  const [camPermission, setCamPermission] = useState(null); // null, 'granted', 'denied'
  const [dragActive, setDragActive] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);
  const [uploadTips, setUploadTips] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null); // Store the current file for retry
  
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const dragAreaRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Sync imagePreview with image from context
  useEffect(() => {
    if (image) {
      setImagePreview(image);
    } else {
      // If image is cleared from context (e.g., via clearData), clear local preview
      setImagePreview(null);
      setImageInfo(null);
      setCurrentFile(null); // Also clear the current file reference
      
      // If we have a blob URL, revoke it
      if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    }
  }, [image]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Clean up object URLs to prevent memory leaks
      if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Clear error when component unmounts or when processing stage changes
  useEffect(() => {
    if (processingStage !== null) {
      setError(null);
      
      // Start progress animation
      if (!progressIntervalRef.current) {
        const targetProgress = processingStage === 'preparing' ? 30 :
                              processingStage === 'uploading' ? 70 : 90;
        
        progressIntervalRef.current = setInterval(() => {
          setProcessingProgress(prev => {
            const nextProgress = prev + 1;
            if (nextProgress >= targetProgress) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
              return targetProgress;
            }
            return nextProgress;
          });
        }, 50);
      }
    } else {
      // Reset progress when done
      setProcessingProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [processingStage, setError]);

  // Check camera permissions when opening camera modal
  useEffect(() => {
    if (showCameraModal) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setCamPermission('granted');
        })
        .catch((err) => {
          setCamPermission('denied');
          setError(`Camera access denied: ${err.message}. Please grant permission to use the camera.`);
        });
    } else {
      // Reset camera permission when closing modal
      setCamPermission(null);
    }
  }, [showCameraModal, setError]);

  const handleFileUpload = async (event) => {
    const file = event?.target?.files?.[0] || event;
    if (!file) return;

    try {
      // Store the file for possible retry
      setCurrentFile(file);
      
      // Show image preview immediately
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      
      // Extract image metadata
      getImageMetadata(file, imageUrl);
      
      // Set random tips
      setRandomUploadTip();
      
      setProcessingStage('preparing');
      await processImage(file, imageUrl);
    } catch (error) {
      setError(`Failed to process image: ${error.message}`);
      setProcessingStage(null);
    }
  };

  const getImageMetadata = (file, url) => {
    // Get file size in KB or MB
    const size = file.size;
    let formattedSize;
    if (size > 1024 * 1024) {
      formattedSize = `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      formattedSize = `${(size / 1024).toFixed(2)} KB`;
    }
    
    // Get image dimensions
    const img = new Image();
    img.onload = () => {
      setImageInfo({
        name: file.name,
        type: file.type,
        size: formattedSize,
        dimensions: `${img.width} × ${img.height}`,
        lastModified: new Date(file.lastModified).toLocaleString()
      });
    };
    img.src = url;
  };

  const setRandomUploadTip = () => {
    const tips = [
      "Ensure the image is well-lit for better text extraction",
      "High contrast between text and background improves OCR accuracy",
      "Large, clear font is easier for the system to recognize",
      "Make sure the image is not blurry or distorted",
      "Avoid shadows over the text area"
    ];
    setUploadTips(tips[Math.floor(Math.random() * tips.length)]);
  };

  const handleCameraCapture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError("Failed to capture image from camera");
      return;
    }

    try {
      // Show preview immediately
      setImagePreview(imageSrc);
      setProcessingStage('preparing');
      
      // Convert base64 to blob/file
      const blob = await fetch(imageSrc).then(r => r.blob());
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      
      // Extract image metadata
      getImageMetadata(file, imageSrc);
      
      await processImage(file, imageSrc);
      
      // Hide camera after successful capture
      setShowCameraModal(false);
    } catch (error) {
      setError(`Failed to process camera capture: ${error.message}`);
      setProcessingStage(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(previous => (previous === "environment" ? "user" : "environment"));
  };

  const processImage = async (file, imageSource) => {
    // Store the actual image source rather than the temporary preview state
    setImage(imageSource);
    
    // Extract text
    setIsLoading(prev => ({ ...prev, extraction: true }));
    setProcessingStage('uploading');
    
    try {
      // Artificial delay to show the processing stage (remove in production)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProcessingStage('extracting');
      const result = await extractTextFromImage(file);
      
      // Update state with extracted text and questions
      setExtractedText(result.fullText);
      setQuestions(result.questions);
      
      // Processing complete - set to 100% before clearing
      setProcessingProgress(100);
      setTimeout(() => {
        setProcessingStage(null);
      }, 500);
      
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(prev => ({ ...prev, extraction: false }));
    }
  };

  const retryProcessing = () => {
    setProcessingStage(null);
    setError(null);
    
    // First try to use the stored file reference
    if (currentFile) {
      // Use the stored file from state
      handleFileUpload(currentFile);
    } 
    // Fallback to file input if we don't have a stored file
    else if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
      handleFileUpload({ target: { files: fileInputRef.current.files } });
    } 
    // If we have an image but no file (like from camera), prompt to reupload
    else if (imagePreview) {
      fileInputRef.current.click();
    }
    // No file or image available - shouldn't happen but handle it
    else {
      setError("No image to retry with. Please upload an image.");
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="image-uploader">
      <h2>
       <i className="fas fa-file-image"></i> Upload Question Paper
      </h2>
      
      <div 
        className={`upload-container ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        ref={dragAreaRef}
      >
        {!imagePreview ? (
          <div 
            className="drag-area"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="upload-options">
              <button 
                className="upload-button" 
                onClick={() => fileInputRef.current.click()}
                disabled={isLoading.extraction}
              >
                <i className="fas fa-file-upload"></i> Upload Image
              </button>
              <button 
                className="camera-button" 
                onClick={() => setShowCameraModal(true)}
                disabled={isLoading.extraction}
              >
                <i className="fas fa-camera"></i> Use Camera
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
                accept="image/*" 
                capture="environment"
              />
            </div>

            {dragActive ? (
              <div className="drop-indicator">
                <i className="drop-icon fas fa-arrow-down-to-bracket fa-2x"></i>
                <p>Drop your image here</p>
              </div>
            ) : (
              <div className="drag-indicator">
                <p>Or drag and drop your image file here</p>
              </div>
            )}
          </div>
        ) : (
          <div className="image-preview-container">
            <img 
              src={imagePreview} 
              alt="Uploaded question paper" 
              className="image-preview"
              onClick={() => setShowImageModal(true)}
              style={{ cursor: 'pointer' }}
            />
            {processingStage && (
              <div className="processing-overlay">
                <div className="processing-spinner"></div>
                <p className="processing-text">
                  {processingStage === 'preparing' && 'Preparing image...'}
                  {processingStage === 'uploading' && 'Uploading to OCR service...'}
                  {processingStage === 'extracting' && 'Extracting questions...'}
                </p>
                
                <div className="processing-progress-bar">
                  <div 
                    className="processing-progress-fill"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                
                {uploadTips && (
                  <div className="processing-tip">
                    <i className="tip-icon fas fa-lightbulb"></i>
                    <span>{uploadTips}</span>
                  </div>
                )}
              </div>
            )}
            
            {imageInfo && !processingStage && (
              <div className="image-metadata">
                <h3><i className="fas fa-info-circle"></i> Image Details</h3>
                <ul>
                  <li><i className="fas fa-file"></i> <strong>Name:</strong> {imageInfo.name}</li>
                  <li><i className="fas fa-expand"></i> <strong>Dimensions:</strong> {imageInfo.dimensions}</li>
                  <li><i className="fas fa-weight-hanging"></i> <strong>Size:</strong> {imageInfo.size}</li>
                  <li><i className="fas fa-file-image"></i> <strong>Type:</strong> {imageInfo.type}</li>
                </ul>
              </div>
            )}

            {!processingStage && (
              <div className="image-actions">
                <button 
                  onClick={() => setShowImageModal(true)} 
                  className="view-image-button"
                >
                  <i className="fas fa-search-plus"></i> View Full Image
                </button>
                <button 
                  onClick={() => {
                    setImagePreview(null);
                    setImage(null);
                    setExtractedText('');
                    setQuestions([]);
                    setError(null); // Clear error state when removing an image
                    setCurrentFile(null); // Also clear the current file reference
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }} 
                  className="remove-image-button"
                >
                  <i className="fas fa-trash-alt"></i> Remove
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-container">
            <i className="error-icon fas fa-exclamation-triangle"></i>
            <p className="error-message">{error}</p>
            <button onClick={retryProcessing} className="retry-button">
              <i className="fas fa-redo-alt"></i> Retry
            </button>
          </div>
        )}
      </div>
      
      <div className="upload-instructions">
        <h3><i className="fas fa-info-circle"></i> Instructions:</h3>
        <ol>
          <li>Upload a clear image of a question paper</li>
          <li>Wait for questions to be extracted</li>
          <li>Select a question to get AI answers</li>
        </ol>
      
        <div className="best-practices">
          <h4><i className="fas fa-star"></i> For best results:</h4>
          <ul>
            <li><i className="fas fa-lightbulb"></i> Use good lighting</li>
            <li><i className="fas fa-glasses"></i> Ensure text is clear and readable</li>
            <li><i className="fas fa-cloud-sun"></i> Avoid shadows and glare</li>
            <li><i className="fas fa-expand"></i> Keep the paper flat</li>
          </ul>
        </div>
      </div>

      {/* Image Full View Modal */}
      <Modal 
        isOpen={showImageModal} 
        onClose={() => setShowImageModal(false)}
        title="Question Paper Image"
        size="large"
        className="image-modal"
      >
        <div className="image-modal-content">
          <img 
            src={imagePreview} 
            alt="Question paper full view" 
          />
          {imageInfo && (
            <div className="image-modal-info">
              <h3>Image Details</h3>
              <ul>
                <li><strong>Name:</strong> {imageInfo.name}</li>
                <li><strong>Dimensions:</strong> {imageInfo.dimensions}</li>
                <li><strong>Size:</strong> {imageInfo.size}</li>
                <li><strong>Type:</strong> {imageInfo.type}</li>
              </ul>
            </div>
          )}
        </div>
      </Modal>

      {/* Camera Modal */}
      <Modal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        title="Take Photo of Question Paper"
        size="large"
        className="camera-modal"
      >
        <div className="camera-modal-container">
          {camPermission === 'denied' ? (
            <div className="permission-error">
              <i className="error-icon fas fa-exclamation-triangle fa-3x"></i>
              <h3>Camera Access Denied</h3>
              <p>Please check your browser settings and grant permission to use the camera.</p>
              <div className="permission-help">
                <h4>How to fix:</h4>
                <ol>
                  <li>Click on the camera icon in your browser's address bar</li>
                  <li>Select "Allow" for camera access</li>
                  <li>Reload the page</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="camera-content">
              <div className="camera-frame">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                  }}
                  className="webcam-video"
                />
              </div>
              <div className="camera-controls">
                <button 
                  className="capture-button"
                  onClick={handleCameraCapture} 
                  disabled={isLoading.extraction}
                >
                  <i className="fas fa-camera"></i> Capture Photo
                </button>
                <button 
                  className="switch-camera-button"
                  onClick={switchCamera}
                  disabled={isLoading.extraction}
                >
                  <i className="fas fa-sync-alt"></i> Switch Camera
                </button>
              </div>
              <div className="camera-instructions">
                <p><i className="fas fa-info-circle"></i> Position the question paper in the frame and ensure good lighting</p>
                <div className="camera-tips">
                  <p><i className="fas fa-lightbulb"></i> Tip: Avoid shadows and glare for best results</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ImageUploader;