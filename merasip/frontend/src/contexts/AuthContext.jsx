import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage
    const token = localStorage.getItem('advisor_token')
    const userData = localStorage.getItem('advisor_user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.removeItem('advisor_token')
        localStorage.removeItem('advisor_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email) => {
    const result = await api.advisorLogin(email)
    return result
  }

  const verifyOTP = async (email, otp) => {
    const result = await api.verifyOTP(email, otp)
    if (result.access_token) {
      localStorage.setItem('advisor_token', result.access_token)
      localStorage.setItem('advisor_user', JSON.stringify(result.user))
      setUser(result.user)
    }
    return result
  }

  const logout = () => {
    localStorage.removeItem('advisor_token')
    localStorage.removeItem('advisor_user')
    setUser(null)
  }

  const isAuthenticated = !!user
  const isManager = user?.role === 'manager' || user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isManager, isLoading, login, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
