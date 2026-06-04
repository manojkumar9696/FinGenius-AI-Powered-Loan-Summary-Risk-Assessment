import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { ToastProvider } from './context/ToastContext'
import ToastNotification from './components/ToastNotification'
import Chatbot from './components/Chatbot'
import { useAuth } from './context/AuthContext'

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="app-root-container">
      <AppRoutes />
      <ToastNotification />
      {user && <Chatbot />}
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App
