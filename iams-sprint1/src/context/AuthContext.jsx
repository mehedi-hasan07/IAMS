import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Firebase user object
  const [role, setRole] = useState(null)        // 'student' | 'coordinator' | 'supervisor'
  const [loading, setLoading] = useState(true)  // true while Firebase checks session

  useEffect(() => {
    // Firebase calls this whenever auth state changes (login, logout, page refresh)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Fetch the user's role from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          setRole(userDoc.data().role)
        }
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })

    return unsubscribe // cleanup on unmount
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
