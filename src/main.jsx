import React from 'react';
import ReactDOM from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
// import App from './App';
import RouterComponent from './Router.jsx';
import './index.css';

console.log("✅ Rendering RouterComponent...");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterComponent />
  </React.StrictMode>
);
