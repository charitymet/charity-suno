import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAnswerForQuestion } from '../services/openaiApi';
import { convertTextToSpeech } from '../services/textToSpeechApi';
import audioPlayer from '../services/audioPlayer';
import { FaPlay, FaPause, FaVolumeUp, FaBackward, FaForward } from 'react-icons/fa';

const AnswerDisplay = () => {
  const { 
    questions,
    selectedQuestion,
    answer,
    setAnswer,
    isLoading,
    setIsLoading,
    setError,
    addToHistory,
    isDarkMode,
    cacheAnswer,
    getCachedAnswer,
    cacheAudio,
    getCachedAudio,
    isAudioPlaying,
    setIsAudioPlaying,
    toggleAudioPlayback,
    seekForward,
    seekBackward
  } = useAppContext();
  
  const [answerError, setAnswerError] = useState(null);
  const [answerStatus, setAnswerStatus] = useState(null); // null, 'generating', 'generated'
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [animateAnswer, setAnimateAnswer] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const [audioError, setAudioError] = useState(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  const answerTextRef = useRef(null);

  // Additional state to track if audio is ready
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Calculate word count and reading time when answer changes
  useEffect(() => {
    if (answer) {
      const words = answer.split(/\s+/).filter(Boolean).length;
      setWordCount(words);
      
      // Average reading speed is 200-250 words per minute
      // Using 225 words per minute as average
      const timeInMinutes = words / 225;
      setReadingTime(timeInMinutes);
      
      // Simple appearance animation
      setAnimateAnswer(true);
      
      // Generate audio for the answer
      generateAudio();
    } else {
      setWordCount(0);
      setReadingTime(0);
      setAnimateAnswer(false);
    }
  }, [answer]);

  // Clear answer when selected question changes
  useEffect(() => {
    setAnswer('');
    setAnswerError(null);
    setAnswerStatus(null);
    setAnimateAnswer(false);
    setCopySuccess(false);
    setAudioError(null);
    
    // Check if we have a cached answer for this question
    if (selectedQuestion !== null && selectedQuestion < questions.length) {
      const questionItem = questions[selectedQuestion];
      const questionId = questionItem.id;
      const questionText = questionItem.text || questionItem;
      
      const cachedResult = getCachedAnswer(questionId, questionText);
      
      if (cachedResult) {
        console.log('Using cached answer for question:', questionId || questionText);
        setAnswer(cachedResult.answer);
        setAnswerStatus('generated');
      }
    }
  }, [selectedQuestion, setAnswer, questions, getCachedAnswer]);

  // Generate audio for the answer text
  const generateAudio = async () => {
    if (!answer) return;
    
    // Get question identifier
    const questionItem = questions[selectedQuestion];
    const questionId = questionItem?.id;
    const questionText = questionItem?.text || questionItem;
    
    if (!questionText) return;
    
    // Check if we have cached audio
    const cachedAudioData = getCachedAudio(questionId, questionText);
    
    if (cachedAudioData) {
      console.log('Using cached audio for question:', questionId || questionText);
      // Set audio as ready when we find cached audio
      setIsAudioReady(true);
      // Play immediately if we have cached audio
      playAudio();
      return;
    }
    
    // No cached audio, generate new
    setIsLoadingAudio(true);
    setAudioError(null);
    setIsAudioReady(false);
    
    try {
      const audioData = await convertTextToSpeech(answer);
      
      // Cache the audio URL and expiration
      cacheAudio(questionId, questionText, audioData);
      
      // Set audio as ready
      
      setIsAudioReady(true);
      
      // Play the audio immediately after receiving it
      playAudio();
    } catch (error) {
      console.error('Error generating audio:', error);
      setAudioError('Failed to generate audio');
    } finally {
      setIsLoadingAudio(false);
    }
  };
  
  // Play audio for current answer
  const playAudio = async () => {
    // Get question identifier
    const questionItem = questions[selectedQuestion];
    const questionId = questionItem?.id;
    const questionText = questionItem?.text || questionItem;
    
    if (!questionText) return;
    
    // Get cached audio
    const cachedAudioData = getCachedAudio(questionId, questionText);
    
    if (!cachedAudioData || !cachedAudioData.audioUrl) {
      setAudioError('No audio available');
      return;
    }
    
    setIsLoadingAudio(true);
    setAudioError(null);
    
    try {
      // Play audio using the service
      await audioPlayer.playFromUrl(cachedAudioData.audioUrl, () => {
        // Callback when audio ends
        setIsAudioPlaying(false);
      });
      
      setIsAudioPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setAudioError('Failed to play audio');
      setIsAudioPlaying(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };
  
  // Handle play/pause button click
  const handleToggleAudio = () => {
    // If there's cached audio, toggle play/pause
    const questionItem = questions[selectedQuestion];
    const questionId = questionItem?.id;
    const questionText = questionItem?.text || questionItem;
    
    if (!questionText) return;
    
    const cachedAudioData = getCachedAudio(questionId, questionText);
    
    if (cachedAudioData && cachedAudioData.audioUrl) {
      // If audio exists but not playing, start playing
      if (!audioPlayer.sound) {
        playAudio();
      } else {
        // If audio is already loaded, just toggle play state
        toggleAudioPlayback();
      }
    } else if (answer && isAudioReady) {
      // No audio loaded yet but we have answer and audio is ready
      playAudio();
    } else if (answer) {
      // We have answer but audio isn't ready yet
      generateAudio();
    }
  };

  // Reset audio state when question changes
  useEffect(() => {
    setIsAudioReady(false);
  }, [selectedQuestion]);

  const fetchAnswer = async () => {
    if (selectedQuestion === null || selectedQuestion >= questions.length) {
      return;
    }

    const questionItem = questions[selectedQuestion];
    const questionId = questionItem.id;
    const questionText = questionItem.text || questionItem;
    const marks = questionItem.marks; // Extract marks from the question object
    
    // Check if we already have a cached answer
    const cachedResult = getCachedAnswer(questionId, questionText);
    if (cachedResult) {
      setAnswer(cachedResult.answer);
      setAnswerStatus('generated');
      return;
    }
    
    setIsLoading(prev => ({ ...prev, answer: true }));
    setAnswerError(null);
    setAnswerStatus('generating');
    
    try {
      // Pass both question text and marks to the API
      const answerText = await getAnswerForQuestion(questionText, marks);
      setAnswer(answerText);
      
      // Cache the answer
      cacheAnswer(questionId, questionText, answerText);
      
      // Add to history
      addToHistory(questionText, answerText);
      
      setAnswerStatus('generated');
    } catch (error) {
      console.error("Error fetching answer:", error);
      setAnswerError(`Failed to get answer: ${error.message}`);
      setAnswerStatus(null);
    } finally {
      setIsLoading(prev => ({ ...prev, answer: false }));
    }
  };

  const getSelectedQuestionText = () => {
    if (selectedQuestion !== null && selectedQuestion < questions.length) {
      const question = questions[selectedQuestion];
      return question.text || question;
    }
    return null;
  };

  const retryFetchAnswer = () => {
    setAnswerError(null);
    fetchAnswer();
  };
  
  // Format reading time to show minutes and seconds
  const formatReadingTime = (timeInMinutes) => {
    const minutes = Math.floor(timeInMinutes);
    const seconds = Math.round((timeInMinutes - minutes) * 60);
    
    if (minutes === 0) {
      return `${seconds} sec read`;
    }
    
    return `${minutes} min ${seconds} sec read`;
  };

  // Handle copy answer to clipboard
  const copyAnswerToClipboard = () => {
    if (!answer) return;
    
    navigator.clipboard.writeText(answer)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setError('Failed to copy to clipboard');
      });
  };
  
  // Handle text selection for highlighting
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setHighlightedText(selection.toString());
    }
  };

  // Normalize paragraphs for display
  const renderAnswerParagraphs = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((paragraph, i) => (
      paragraph ? (
        <p key={i} className={animateAnswer ? 'animate-in' : ''}>
          {paragraph}
        </p>
      ) : <br key={i} />
    ));
  };

  // Handle seek backward button click
  const handleSeekBackward = () => {
    if (audioPlayer.sound) {
      seekBackward(5);
    }
  };

  // Handle seek forward button click
  const handleSeekForward = () => {
    if (audioPlayer.sound) {
      seekForward(5);
    }
  };

  return (
    <div className={`answer-display ${isDarkMode ? 'dark' : ''}`}>
      <h2>
        <i className="fas fa-comment-dots"></i> Answer
      </h2>
      
      {selectedQuestion !== null && selectedQuestion < questions.length ? (
        <div className="answer-content">
          <div className="selected-question-container">
            <div className="selected-question-text">
              <span className="question-id">
                {questions[selectedQuestion].id || `${selectedQuestion + 1}.`}
              </span>
              <p>{getSelectedQuestionText()}</p>
            </div>
          </div>
          
          {!answer && !answerError ? (
            <div className="answer-cta">
              {answerStatus === 'generating' ? (
                <div className="generating-answer">
                  <div className="ai-spinner"></div>
                  <div className="generating-text">
                    <p>Thinking...</p>
                    <div className="generating-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={fetchAnswer} 
                  disabled={isLoading.answer}
                  className="get-answer-btn"
                  aria-label="Generate AI answer"
                >
                  <i className="fas fa-robot"></i>
                  {isLoading.answer ? 'Getting Answer...' : 'Get AI Answer'}
                </button>
              )}
              <div className="answer-info">
                <p>The answer will be generated using OpenAI's GPT model</p>
              </div>
            </div>
          ) : (
            <>
              {answerError ? (
                <div className="answer-error">
                  <div className="error-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <p>{answerError}</p>
                  <button 
                    onClick={retryFetchAnswer} 
                    className="retry-button"
                    aria-label="Retry generating answer"
                  >
                    <i className="retry-icon fas fa-sync-alt"></i> Retry
                  </button>
                </div>
              ) : (
                <>
                  <div className="answer-result">
                    {wordCount > 0 && (
                      <>
                        <div className="answer-metadata">
                          <span className="word-count">{wordCount} words</span>
                          <span className="dot-separator">•</span>
                          <span className="reading-time">{formatReadingTime(readingTime)}</span>
                          
                          <button 
                            className={`copy-btn ${copySuccess ? 'success' : ''}`}
                            onClick={copyAnswerToClipboard}
                            aria-label="Copy answer to clipboard"
                            title="Copy to clipboard"
                          >
                            {copySuccess ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
                          </button>
                        </div>

                        {/* Audio controls moved before answer text */}
                        <div className="audio-controls-container">
                          <div className="audio-controls">
                            <button 
                              className="audio-control-btn seek-backward-btn"
                              onClick={handleSeekBackward}
                              disabled={isLoadingAudio || audioError || !audioPlayer.sound}
                              aria-label="Rewind 5 seconds"
                              title="Rewind 5 seconds"
                            >
                              <FaBackward />
                            </button>

                            <button 
                              className={`audio-control-btn play-pause-btn ${isAudioPlaying ? 'playing' : ''} ${isLoadingAudio ? 'loading' : ''}`}
                              onClick={handleToggleAudio}
                              disabled={isLoadingAudio || audioError}
                              aria-label={isAudioPlaying ? "Pause audio" : "Play audio"}
                              title={isAudioPlaying ? "Pause audio" : "Play audio"}
                            >
                              {isLoadingAudio ? (
                                <div className="btn-spinner"></div>
                              ) : isAudioPlaying ? (
                                <FaPause />
                              ) : (
                                <FaPlay />
                              )}
                            </button>

                            <button 
                              className="audio-control-btn seek-forward-btn"
                              onClick={handleSeekForward}
                              disabled={isLoadingAudio || audioError || !audioPlayer.sound}
                              aria-label="Forward 5 seconds"
                              title="Forward 5 seconds"
                            >
                              <FaForward />
                            </button>
                          </div>

                          {audioError && (
                            <div className="audio-error">
                              <FaVolumeUp className="audio-error-icon" />
                              <span>{audioError}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div 
                      className="answer-text" 
                      ref={answerTextRef}
                      onMouseUp={handleTextSelection}
                      role="region"
                      aria-label="AI generated answer"
                    >
                      {renderAnswerParagraphs(answer)}
                    </div>
                  </div>
                  
                  {/* Text selection actions */}
                  {highlightedText && (
                    <div className="text-selection-actions">
                      <button onClick={() => {
                        navigator.clipboard.writeText(highlightedText);
                        setHighlightedText('');
                      }}>
                        <i className="fas fa-copy"></i> Copy selection
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="no-question-selected">
          <div className="selection-icon">
            <i className="fas fa-hand-point-left"></i>
          </div>
          <p>Select a question from the list to get an AI-generated answer.</p>
        </div>
      )}
    </div>
  );
};

export default AnswerDisplay;