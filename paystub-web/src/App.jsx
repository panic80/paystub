import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Navbar from './components/Navbar.jsx';
import { useEffect } from 'react';

// Main application component (all in one page)
const MainApp = lazy(() => import('./pages/MainApp.jsx'));

// Loading component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="flex flex-col items-center">
      <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
        <svg className="h-8 w-8 text-blue-600 dark:text-blue-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Loading...</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    // Clear old database and init new one
    if (window.indexedDB.deleteDatabase) {
      window.indexedDB.deleteDatabase('paystubManager');
    }
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-6">
            <Suspense fallback={<LoadingFallback />}>
              <MainApp />
            </Suspense>
          </main>
          <footer className="py-4 px-4 border-t border-gray-200 dark:border-gray-800">
            <div className="container mx-auto">
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Paystub Manager &copy; {new Date().getFullYear()}
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
