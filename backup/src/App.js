import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import { SupabaseAuthProvider } from './components/SupabaseAuthProvider';

function App() {
  return (
    <ChakraProvider>
      <SupabaseAuthProvider>
        <Router>
          <div className="App">
            <header className="App-header">
              <p>Loading the RivalRecon application...</p>
            </header>
          </div>
        </Router>
      </SupabaseAuthProvider>
    </ChakraProvider>
  );
}

export default App; 