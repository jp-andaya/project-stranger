import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { NotesProvider } from './stores/useNotes';
import Nav from './components/Nav';
import PageShell from './components/PageShell';
import HomePage from './pages/HomePage';
import ReadPage from './pages/ReadPage';
import ConfirmPage from './pages/ConfirmPage';
import ArchivePage from './pages/ArchivePage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [view, setView] = useState('home');

  const go = (v) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  const pages = {
    home: <HomePage go={go} />,
    read: <ReadPage go={go} />,
    confirm: <ConfirmPage go={go} />,
    archive: <ArchivePage go={go} />,
    about: <AboutPage go={go} />,
    admin: <AdminPage go={go} />,
  };

  return (
    <NotesProvider>
      <Nav current={view} go={go} />
      <AnimatePresence mode="wait">
        <PageShell key={view}>
          {pages[view] || pages.home}
        </PageShell>
      </AnimatePresence>
    </NotesProvider>
  );
}
