import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from './Modal';

const QuestionList = () => {
  const { 
    questions, 
    extractedText, 
    selectedQuestion, 
    setSelectedQuestion, 
    isLoading,
    isDarkMode,
    getCachedAnswer,
    setAnswer
  } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [modalQuestionIndex, setModalQuestionIndex] = useState(null);
  const [showExtractedTextModal, setShowExtractedTextModal] = useState(false);
  const questionRefs = useRef({});
  const searchInputRef = useRef(null);
  
  // Filter questions based on search term
  const filteredQuestions = searchTerm.trim() 
    ? questions.filter(q => {
        const questionText = q.text.toLowerCase();
        const search = searchTerm.toLowerCase();
        return questionText.includes(search);
      })
    : questions;

  // Set up keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If we're not in search input focus and there are questions
      if (!isSearchFocused && filteredQuestions.length > 0) {
        // Handle arrow keys for navigation
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedQuestion(prev => {
            const next = Math.min(prev !== null ? prev + 1 : 0, filteredQuestions.length - 1);
            scrollToQuestion(next);
            return next;
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedQuestion(prev => {
            const next = Math.max(prev !== null ? prev - 1 : 0, 0);
            scrollToQuestion(next);
            return next;
          });
        }
      }
      
      // Search keyboard shortcut (Ctrl/Cmd + F)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredQuestions.length, isSearchFocused, setSelectedQuestion]);

  // Scroll to selected question when it changes
  useEffect(() => {
    if (selectedQuestion !== null) {
      scrollToQuestion(selectedQuestion);
    }
  }, [selectedQuestion]);

  const scrollToQuestion = (index) => {
    const element = questionRefs.current[index];
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  };

  const handleQuestionSelect = (index) => {
    setSelectedQuestion(index);
    setHighlightedIndex(index);
    
    // Check if this question has a cached answer
    const questionItem = questions[index];
    const questionId = questionItem.id;
    const questionText = questionItem.text || questionItem;
    
    // If the question has a cached answer, set the answer immediately
    const cachedResult = getCachedAnswer(questionId, questionText);
    if (cachedResult) {
      setAnswer(cachedResult.answer);
    }
    
    // Briefly highlight the selected question
    setTimeout(() => {
      setHighlightedIndex(null);
    }, 800);
  };

  const toggleQuestionExpand = (index, event) => {
    // Prevent triggering selection when clicking the expand button
    event.stopPropagation();
    setExpandedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Function to determine if a question is long and should show expand/collapse
  const isLongQuestion = (text) => text.length > 100;
  
  // Generate highlighted version of text with search term matches
  const highlightSearchTerm = (text) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  // Open a specific question in a modal
  const openQuestionModal = (index, event) => {
    if (event) {
      event.stopPropagation(); // Prevent selecting the question
    }
    setModalQuestionIndex(index);
    setShowQuestionModal(true);
  };

  // Open extracted text in full screen modal
  const openExtractedTextModal = () => {
    setShowExtractedTextModal(true);
  };

  // Check if a question has a cached answer
  const isQuestionCached = (question) => {
    const questionId = question.id;
    const questionText = question.text || question;
    return getCachedAnswer(questionId, questionText) !== null;
  };

  return (
    <div className="question-list">
      <h2>
        <i className="fas fa-question-circle"></i> Extracted Questions
      </h2>
      
      {isLoading.extraction ? (
        <div className="extraction-loading">
          <div className="processing-spinner"></div>
          <p>Extracting questions...</p>
          <div className="loading-tips">
            <span>Looking for questions in your image</span>
            <div className="loading-progress">
              <div className="loading-bar"></div>
            </div>
          </div>
        </div>
      ) : questions.length > 0 ? (
        <>
          <div className="question-search">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search questions... (Ctrl+F)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="search-input"
              aria-label="Search questions"
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          
          <div className="questions-count">
            {searchTerm ? (
              <span>
                <strong>{filteredQuestions.length}</strong> {filteredQuestions.length === 1 ? 'result' : 'results'} found 
                {filteredQuestions.length === 0 && searchTerm && (
                  <span className="no-results"> for "<em>{searchTerm}</em>"</span>
                )}
              </span>
            ) : (
              <span>
                <strong>{questions.length}</strong> {questions.length === 1 ? 'question' : 'questions'} found
              </span>
            )}
            {questions.length > 0 && questions[0].text.includes("(solve any") && (
              <span className="instruction-note"> - Instructions included</span>
            )}
          </div>
          
          {filteredQuestions.length > 0 ? (
            <ul className="questions-container">
              {filteredQuestions.map((question, index) => {
                const isExpanded = expandedQuestions[index] || false;
                const shouldShowExpand = isLongQuestion(question.text);
                const isHighlighted = highlightedIndex === index;
                const isSelected = selectedQuestion === index;
                const isCached = isQuestionCached(question);
                
                return (
                  <li 
                    key={index}
                    id={`question-${index}`}
                    ref={el => questionRefs.current[index] = el}
                    className={`question-item ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isCached ? 'cached' : ''}`}
                    onClick={() => handleQuestionSelect(index)}
                    tabIndex="0" // Make focusable for keyboard navigation
                    role="button"
                    aria-selected={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleQuestionSelect(index);
                      }
                    }}
                  >
                    <div className="question-id">{question.id || `${index + 1}.`}</div>
                    <div className="question-content">
                      <div className="question-text">
                        {shouldShowExpand && !isExpanded
                          ? highlightSearchTerm(question.text.substring(0, 100) + '...')
                          : highlightSearchTerm(question.text)}
                      </div>
                      
                      <div className="question-actions">
                        {shouldShowExpand && (
                          <button 
                            className="expand-collapse-btn"
                            onClick={(e) => toggleQuestionExpand(index, e)}
                            aria-label={isExpanded ? 'Show less text' : 'Show more text'}
                          >
                            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                            {isExpanded ? 'Show Less' : 'Show More'}
                          </button>
                        )}
                        
                        <button 
                          className="view-modal-btn"
                          onClick={(e) => openQuestionModal(index, e)}
                          aria-label="View full question in modal"
                        >
                          <i className="fas fa-expand-alt"></i> View Full
                        </button>
                      </div>
                      
                      {isSelected && (
                        <div className="question-status">
                          <span className="selected-indicator">
                            <i className="fas fa-check"></i> Selected
                          </span>
                        </div>
                      )}
                      
                      {isCached && (
                        <div className="cache-indicator" title="Answer cached">
                          <i className="fas fa-bolt"></i>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="no-search-results">
              <div className="no-results-icon">
                <i className="fas fa-search fa-2x"></i>
              </div>
              <p>No questions matching "<strong>{searchTerm}</strong>"</p>
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times-circle"></i> Clear Search
              </button>
            </div>
          )}
          
          <div className="keyboard-shortcuts">
            <p>
              <span className="shortcut-key"><i className="fas fa-arrow-up"></i><i className="fas fa-arrow-down"></i></span> Navigate 
              <span className="shortcut-key">Enter</span> Select 
              <span className="shortcut-key">Ctrl+F</span> Search
            </p>
          </div>
        </>
      ) : extractedText ? (
        <div className="no-questions-found">
          <div className="warning-icon">
            <i className="fas fa-exclamation-triangle fa-2x"></i>
          </div>
          <p>No questions were automatically detected. Here's the extracted text:</p>
          <pre className="extracted-text">{extractedText.substring(0, 300)}...</pre>
          <button 
            className="view-full-text-btn"
            onClick={openExtractedTextModal}
          >
            <i className="fas fa-expand-alt"></i> View Full Text
          </button>
          <div className="extraction-hints">
            <h3>Why this might happen:</h3>
            <ul>
              <li><i className="fas fa-file-alt"></i> The text may not be properly formatted</li>
              <li><i className="fas fa-eye-slash"></i> OCR may have had difficulty recognizing questions</li>
              <li><i className="fas fa-image"></i> The image quality might be too low or blurry</li>
            </ul>
            <p className="suggestion">Try uploading a clearer image or selecting text manually.</p>
          </div>
        </div>
      ) : (
        <div className="upload-prompt">
          <div className="upload-icon">
            <i className="fas fa-file-upload fa-2x"></i>
          </div>
          <h3>No questions have been extracted yet</h3>
          <p>Upload an image of a question paper to get started.</p>
          <div className="upload-tips">
            <p><i className="fas fa-lightbulb"></i> Tip: Ensure good lighting and a clear image for best results.</p>
          </div>
        </div>
      )}
      
      {/* Modal for full question view */}
      {modalQuestionIndex !== null && (
        <Modal 
          isOpen={showQuestionModal} 
          onClose={() => setShowQuestionModal(false)}
          title={`Question ${filteredQuestions[modalQuestionIndex]?.id || modalQuestionIndex + 1}`}
          size="medium"
        >
          <div className="question-modal-content">
            <div className="modal-question-text">
              {filteredQuestions[modalQuestionIndex]?.text || 'Question not available'}
            </div>
            
            <div className="modal-question-actions">
              {modalQuestionIndex !== selectedQuestion && (
                <button
                  className="select-question-btn"
                  onClick={() => {
                    setSelectedQuestion(modalQuestionIndex);
                    setShowQuestionModal(false);
                  }}
                >
                  <i className="fas fa-check-circle"></i> Select this question
                </button>
              )}
              
              {selectedQuestion === modalQuestionIndex && (
                <div className="already-selected">
                  <i className="fas fa-check"></i> Currently selected
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
      
      {/* Modal for full extracted text */}
      <Modal
        isOpen={showExtractedTextModal}
        onClose={() => setShowExtractedTextModal(false)}
        title="Extracted Text"
        size="large"
      >
        <div className="extracted-text-modal">
          <pre className="full-extracted-text">{extractedText}</pre>
          
          <div className="extraction-actions">
            <button
              className="copy-extracted-text"
              onClick={() => {
                navigator.clipboard.writeText(extractedText);
              }}
            >
              <i className="fas fa-copy"></i> Copy to clipboard
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuestionList;