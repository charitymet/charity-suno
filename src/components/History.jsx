import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Modal from './Modal';

const History = () => {
  const { 
    history, 
    clearHistory,
    setSelectedQuestion,
    questions,
    setQuestions,
    isDarkMode
  } = useAppContext();
  
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleClearHistory = () => {
    setShowConfirmClear(true);
  };

  const confirmClear = () => {
    clearHistory();
    setShowConfirmClear(false);
  };

  const cancelClear = () => {
    setShowConfirmClear(false);
  };

  const addQuestionFromHistory = (question) => {
    // Check if question already exists in questions array
    const questionExists = questions.some(q => 
      typeof q === 'string' 
        ? q === question 
        : q.text === question
    );
    
    if (!questionExists) {
      // Add the question to the list
      const newQuestions = [...questions, question];
      setQuestions(newQuestions);
      
      // Select the newly added question (it will be the last one)
      setSelectedQuestion(newQuestions.length - 1);
    } else {
      // Find the index of the existing question
      const index = questions.findIndex(q => 
        typeof q === 'string' 
          ? q === question 
          : q.text === question
      );
      
      // Select the existing question
      if (index !== -1) {
        setSelectedQuestion(index);
      }
    }
  };
  
  const viewHistoryItem = (item, index) => {
    setSelectedHistoryItem({ ...item, index });
    setShowHistoryModal(true);
  };

  return (
    <div className={`history-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="history-header">
        <h2>
          <i className="fas fa-history"></i> History
        </h2>
        {history.length > 0 && (
          <button 
            className="clear-history-btn"
            onClick={handleClearHistory}
            aria-label="Clear history"
          >
            <i className="fas fa-trash-alt"></i> Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">
            <i className="fas fa-hourglass-start"></i>
          </div>
          <p>Your question and answer history will appear here</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item, index) => (
            <div 
              key={index} 
              className="history-item"
              onClick={() => viewHistoryItem(item, index)}
            >
              <div className="history-item-question">
                <span className="history-question-icon">
                  <i className="fas fa-question-circle"></i>
                </span>
                <p>{item.question.length > 70 ? `${item.question.substring(0, 70)}...` : item.question}</p>
              </div>
              <div className="history-item-answer">
                <span className="history-answer-icon">
                  <i className="fas fa-comment-alt"></i>
                </span>
                <p>{item.answer.length > 100 ? `${item.answer.substring(0, 100)}...` : item.answer}</p>
              </div>
              <button 
                className="reuse-question-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  addQuestionFromHistory(item.question);
                }}
                aria-label="Reuse this question"
                title="Use this question again"
              >
                <i className="fas fa-redo-alt"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Clear History */}
      <Modal
        isOpen={showConfirmClear}
        onClose={cancelClear}
        title="Clear History"
        size="small"
      >
        <div className="confirm-clear-modal">
          <p>Are you sure you want to clear your entire question history? This cannot be undone.</p>
          <div className="confirm-clear-buttons">
            <button onClick={cancelClear} className="cancel-button">
              Cancel
            </button>
            <button onClick={confirmClear} className="confirm-button">
              Clear History
            </button>
          </div>
        </div>
      </Modal>

      {/* History Item Detail Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Question & Answer"
        size="large"
      >
        {selectedHistoryItem && (
          <div className="history-item-modal">
            <div className="history-modal-question">
              <h3>
                <i className="fas fa-question-circle"></i> Question
              </h3>
              <p>{selectedHistoryItem.question}</p>
              <button 
                className="reuse-question-modal-btn" 
                onClick={() => {
                  addQuestionFromHistory(selectedHistoryItem.question);
                  setShowHistoryModal(false);
                }}
              >
                <i className="fas fa-redo-alt"></i> Ask this question again
              </button>
            </div>
            
            <div className="history-modal-answer">
              <h3>
                <i className="fas fa-comment-alt"></i> Answer
              </h3>
              <div className="history-modal-answer-text">
                {selectedHistoryItem.answer.split('\n').map((paragraph, i) => (
                  paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
                ))}
              </div>
              <div className="history-modal-answer-actions">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedHistoryItem.answer);
                  }}
                  className="copy-answer-btn"
                >
                  <i className="fas fa-copy"></i> Copy answer
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default History;