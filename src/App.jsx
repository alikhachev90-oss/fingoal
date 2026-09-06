import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import AuthScreen from './screens/AuthScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import EntryScreen from './screens/EntryScreen'
import DashboardScreen from './screens/DashboardScreen'
import GoalsScreen from './screens/GoalsScreen'
import LessonsScreen from './screens/LessonsScreen'
import InsightsScreen from './screens/InsightsScreen'

function RequireAuth({ children }) {
  const { user } = useApp()
  if (user === undefined) {
    return <div className="min-h-[100svh] flex items-center justify-center text-muted">Загрузка…</div>
  }
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function Shell() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthScreen />} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingScreen /></RequireAuth>} />
      <Route path="/entry" element={<RequireAuth><EntryScreen /></RequireAuth>} />
      <Route path="/dashboard" element={<RequireAuth><DashboardScreen /></RequireAuth>} />
      <Route path="/goals" element={<RequireAuth><GoalsScreen /></RequireAuth>} />
      <Route path="/lessons" element={<RequireAuth><LessonsScreen /></RequireAuth>} />
      <Route path="/insights" element={<RequireAuth><InsightsScreen /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="w-full max-w-app min-h-[100svh] bg-bg">
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </div>
    </AppProvider>
  )
}
