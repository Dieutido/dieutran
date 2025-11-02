
import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import ImageGenerator from './components/ImageGenerator';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {isLoggedIn ? <ImageGenerator /> : <LoginScreen onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
};

export default App;
