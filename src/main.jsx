import React from 'react';
import ReactDOM from 'react-dom/client';
import RouterComponent from './Router.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // 👈 Import AuthProvider
import './index.css';

console.log("✅ Rendering RouterComponent with AuthProvider...");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterComponent />
    </AuthProvider>
  </React.StrictMode>
);
