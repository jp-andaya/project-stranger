import { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotesProvider } from './context/NotesContext';
import Header from './components/Header';
import Home from './views/Home';
import Read from './views/Read';
import Confirmation from './views/Confirmation';
import Archive from './views/Archive';
import About from './views/About';
import Admin from './views/Admin';

const AppContent = () => {
  const [currentView, setCurrentView] = useState('home');
  const { theme } = useTheme();

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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.bg,
        transition: 'background-color 0.3s ease',
      }}
    >
      <Header currentView={currentView} onNavigate={handleNavigate} />
      {renderView()}
    </div>
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
