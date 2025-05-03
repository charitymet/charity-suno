import { useState, useEffect, useRef } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import ImageUploader from './components/ImageUploader';
import QuestionList from './components/QuestionList';
import AnswerDisplay from './components/AnswerDisplay';
import ClearDataButton from './components/ClearDataButton';
import History from './components/History';
import './App.css';

// Dark mode toggle component
const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useAppContext();
  
  // Set both data-theme attribute and dark-theme class when dark mode changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    // Also toggle the dark-theme class on the root element for consistency
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDarkMode]);
  
  return (
    <button 
      className="dark-mode-toggle" 
      onClick={toggleDarkMode}
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="mode-icon">
        {isDarkMode ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
      </span>
      <span className="mode-text">
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
};

// Back to top button for mobile
const BackToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button 
      className={`back-to-top ${isVisible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Scroll back to top"
    >
      <i className="fas fa-arrow-up"></i>
    </button>
  );
};

// App Header with buttons
const AppHeader = () => {
  const { isDarkMode } = useAppContext();
  
  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          <h1>Charity Suno</h1>
          <div className="header-controls">
            <DarkModeToggle />
            <ClearDataButton />
          </div>
        </div>
      </div>
    </header>
  );
};

// Mobile nav controls to switch between sections
const MobileNavigation = ({ activeSection, setActiveSection }) => {
  return (
    <div className="mobile-navigation">
      <button 
        className={`nav-button ${activeSection === 'upload' ? 'active' : ''}`}
        onClick={() => setActiveSection('upload')}
        aria-label="Go to upload section"
      >
        <span className="nav-icon">
          <i className="fas fa-file-image"></i>
        </span>
        <span>Upload</span>
      </button>
      <button 
        className={`nav-button ${activeSection === 'questions' ? 'active' : ''}`}
        onClick={() => setActiveSection('questions')}
        aria-label="Go to questions section"
      >
        <span className="nav-icon">
          <i className="fas fa-question-circle"></i>
        </span>
        <span>Questions</span>
      </button>
      <button 
        className={`nav-button ${activeSection === 'answer' ? 'active' : ''}`}
        onClick={() => setActiveSection('answer')}
        aria-label="Go to answer section"
      >
        <span className="nav-icon">
          <i className="fas fa-comment-dots"></i>
        </span>
        <span>Answer</span>
      </button>
    </div>
  );
};

// Main App container
const AppContainer = () => {
  const { questions, selectedQuestion } = useAppContext();
  const [activeSection, setActiveSection] = useState('upload');
  const [isMobile, setIsMobile] = useState(false);
  // Remove the autoNavigated state and use a ref to track first-time navigation
  const initialNavigationDone = useRef({
    toQuestions: false,
    toAnswer: false
  });
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Initial navigation to questions section when questions first become available
  useEffect(() => {
    if (questions.length > 0 && activeSection === 'upload' && isMobile && !initialNavigationDone.current.toQuestions) {
      setActiveSection('questions');
      initialNavigationDone.current.toQuestions = true;
    }
  }, [questions, activeSection, isMobile]);
  
  // Initial navigation to answer section when a question is first selected
  useEffect(() => {
    if (selectedQuestion !== null && activeSection === 'questions' && isMobile && !initialNavigationDone.current.toAnswer) {
      setActiveSection('answer');
      initialNavigationDone.current.toAnswer = true;
    }
  }, [selectedQuestion, activeSection, isMobile]);
  
  // Manual navigation handler
  const handleTabChange = (section) => {
    setActiveSection(section);
  };
  
  return (
    <div className="app-container">
      <AppHeader />
      
      {isMobile && (
        <MobileNavigation 
          activeSection={activeSection}
          setActiveSection={handleTabChange}
        />
      )}
      
      <main className="app-main" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="container" style={{ width: '100%', maxWidth: '1800px', padding: '0 20px' }}>
          {/* New simplified 3-column grid layout */}
          <div 
            className="app-grid" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
              gap: '20px', 
              width: '100%' 
            }}
          >
            {/* First card: Image Uploader */}
            <div 
              className={`card-section ${isMobile && activeSection !== 'upload' ? 'hidden-mobile' : ''}`}
              style={{ 
                width: '100%', 
                height: '100%',
                minHeight: '500px'
              }}
            >
              <ImageUploader />
            </div>
            
            {/* Second card: Question List */}
            <div 
              className={`card-section ${isMobile && activeSection !== 'questions' ? 'hidden-mobile' : ''}`}
              style={{ 
                width: '100%', 
                height: '100%',
                minHeight: '500px'
              }}
            >
              <QuestionList />
              <div style={{ marginTop: '20px' }}>
                <History />
              </div>
            </div>
            
            {/* Third card: Answer Display */}
            <div 
              className={`card-section ${isMobile && activeSection !== 'answer' ? 'hidden-mobile' : ''}`}
              style={{ 
                width: '100%', 
                height: '100%',
                minHeight: '500px'
              }}
            >
              <AnswerDisplay />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Charity Suno - Question Paper Assistant</p>
        </div>
      </footer>
      
      <BackToTopButton />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContainer />
    </AppProvider>
  );
}

export default App;
