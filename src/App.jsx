import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { NotesProvider } from './context/NotesContext';
import Header from './components/Header';
import Home from './views/Home';
import Read from './views/Read';
import Confirmation from './views/Confirmation';
import Archive from './views/Archive';
import About from './views/About';
import Admin from './views/Admin';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
};

const AppContent = () => {
  const [currentView, setCurrentView] = useState('home');

  const handleNavigate = (view) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'read':
        return <Read onNavigate={handleNavigate} />;
      case 'confirm':
        return <Confirmation onNavigate={handleNavigate} />;
      case 'archive':
        return <Archive onNavigate={handleNavigate} />;
      case 'about':
        return <About onNavigate={handleNavigate} />;
      case 'admin':
        return <Admin onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      <Header currentView={currentView} onNavigate={handleNavigate} />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ flex: 1 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <NotesProvider>
        <AppContent />
      </NotesProvider>
    </ThemeProvider>
  );
};

export default App;
