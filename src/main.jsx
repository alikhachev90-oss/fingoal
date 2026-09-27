import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './product-material.css'
import App from './App.jsx'
import './appearance.css'
import { installHaptics } from './haptics'
import { installAppUpdate } from './appUpdate'

installHaptics()
installAppUpdate()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
