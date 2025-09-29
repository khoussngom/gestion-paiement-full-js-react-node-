import React from 'react';
import ReactDOM from 'react-dom/client';
import TestApp from './TestApp';
import './assets/css/App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);
