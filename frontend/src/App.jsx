import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { ToastProvider } from './context/ToastContext'
import ToastNotification from './components/ToastNotification'

function App() {
  return (
    <ToastProvider>
      <div className="app-root-container">
        <AppRoutes />
        <ToastNotification />
      </div>
    </ToastProvider>
  )
}

export default App
