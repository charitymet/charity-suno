import { createContext, useState, useContext, useEffect } from 'react';
import useSessionStorage from '../hooks/useSessionStorage';
import audioPlayer from '../services/audioPlayer';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [image, setImage] = useSessionStorage('qp_image', null);
  const [extractedText, setExtractedText] = useSessionStorage('qp_extractedText', '');
  const [questions, setQuestions] = useSessionStorage('qp_questions', []);
  const [selectedQuestion, setSelectedQuestion] = useSessionStorage('qp_selectedQuestion', null);
  const [answer, setAnswer] = useSessionStorage('qp_answer', '');
  const [isLoading, setIsLoading] = useState({
    extraction: false,
    answer: false,
    speech: false
  });
  const [history, setHistory] = useSessionStorage('qp_history', []);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useSessionStorage('qp_darkMode', false);
  const [cachedAnswers, setCachedAnswers] = useSessionStorage('qp_cachedAnswers', {});
  const [cachedAudio, setCachedAudio] = useSessionStorage('qp_cachedAudio', {});
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Effect to apply dark mode to the document
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Stop audio playback when question changes
  useEffect(() => {
    audioPlayer.stop();
    setIsAudioPlaying(false);
  }, [selectedQuestion]);

  // Check for expired audio URLs and clean them up
  useEffect(() => {
    const checkExpiredAudio = () => {
      const now = new Date().getTime();
      let hasExpiredItems = false;
      
      const updatedCache = { ...cachedAudio };
      
      Object.entries(cachedAudio).forEach(([key, audioData]) => {
        if (audioData.expiresAt && now > audioData.expiresAt) {
          delete updatedCache[key];
          hasExpiredItems = true;
        }
      });
      
      if (hasExpiredItems) {
        setCachedAudio(updatedCache);
      }
    };
    
    // Check on component mount and every hour
    checkExpiredAudio();
    const interval = setInterval(checkExpiredAudio, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [cachedAudio, setCachedAudio]);

  const clearData = () => {
    setImage(null);
    setExtractedText('');
    setQuestions([]);
    setSelectedQuestion(null);
    setAnswer('');
    setError(null);
    // Don't clear cachedAnswers, cachedAudio or isDarkMode to retain user preferences
    
    // Stop any playing audio
    audioPlayer.stop();
    setIsAudioPlaying(false);
  };

  const addToHistory = (question, answer) => {
    setHistory(prev => [...prev, { question, answer, timestamp: new Date() }]);
  };

  // Function to cache answers by question ID or text
  const cacheAnswer = (questionId, questionText, answerText) => {
    setCachedAnswers(prev => ({
      ...prev,
      [questionId || questionText]: {
        answer: answerText,
        timestamp: new Date(),
      }
    }));
  };

  // Function to get cached answer if available
  const getCachedAnswer = (questionId, questionText) => {
    return cachedAnswers[questionId || questionText] || null;
  };

  // Function to cache audio by question ID or text
  const cacheAudio = (questionId, questionText, audioData) => {
    const expiresAt = new Date().getTime() + (audioData.expiresIn * 1000);
    
    setCachedAudio(prev => ({
      ...prev,
      [questionId || questionText]: {
        audioUrl: audioData.audioUrl,
        expiresAt,
        timestamp: new Date(),
      }
    }));
  };

  // Function to get cached audio if available and not expired
  const getCachedAudio = (questionId, questionText) => {
    const audioData = cachedAudio[questionId || questionText];
    
    if (!audioData) return null;
    
    // Check if the audio URL has expired
    const now = new Date().getTime();
    if (audioData.expiresAt && now > audioData.expiresAt) {
      // Remove the expired entry
      const updatedCache = { ...cachedAudio };
      delete updatedCache[questionId || questionText];
      setCachedAudio(updatedCache);
      return null;
    }
    
    return audioData;
  };

  // Function to toggle audio playback
  const toggleAudioPlayback = () => {
    const isPlaying = audioPlayer.togglePlay();
    setIsAudioPlaying(isPlaying);
    return isPlaying;
  };

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Audio seeking functions
  const seekForward = (seconds = 5) => {
    return audioPlayer.seekForward(seconds);
  };

  const seekBackward = (seconds = 5) => {
    return audioPlayer.seekBackward(seconds);
  };

  // Get current audio position and duration
  const getAudioPosition = () => {
    return audioPlayer.getCurrentPosition();
  };

  const getAudioDuration = () => {
    return audioPlayer.getDuration();
  };

  return (
    <AppContext.Provider
      value={{
        image,
        setImage,
        extractedText,
        setExtractedText,
        questions,
        setQuestions,
        selectedQuestion,
        setSelectedQuestion,
        answer,
        setAnswer,
        isLoading,
        setIsLoading,
        history,
        addToHistory,
        error,
        setError,
        clearData,
        isDarkMode,
        toggleDarkMode,
        cacheAnswer,
        getCachedAnswer,
        cacheAudio,
        getCachedAudio,
        isAudioPlaying,
        setIsAudioPlaying,
        toggleAudioPlayback,
        seekForward,
        seekBackward,
        getAudioPosition,
        getAudioDuration
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

export default AppContext;