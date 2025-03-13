import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import DatabasePage from './pages/DatabasePage';
import IndividualsPage from './pages/IndividualsPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/database" element={<DatabasePage />} />
              <Route path="/individuals" element={<IndividualsPage />} />
            </Routes>
          </main>
          <footer className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>Paystub Manager &copy; {new Date().getFullYear()}</p>
          </footer>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App; 