
import { createContext, useContext, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

type Theme = "light" | "dark" | "system"
type AppTheme = "admin" | "host"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  appTheme: AppTheme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  appTheme: "admin",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "grace-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  
  const location = useLocation()
  
  // Determine app theme based on route
  const appTheme: AppTheme = location.pathname.startsWith('/host') ? 'host' : 'admin'

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (appTheme === "host") {
      // Host interface always uses dark theme
      root.classList.add("dark")
    } else {
      // Admin interface uses light theme
      root.classList.add("light")
    }
  }, [appTheme])

  const value = {
    theme,
    appTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
