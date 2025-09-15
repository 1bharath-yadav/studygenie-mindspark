import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    // Tailwind dark mode is usually driven by the presence of the 'dark' class.
    // Make 'light' simply the absence of 'dark'. Also expose data-theme for other libs.
    const applyTheme = (t: Theme) => {
      try {
        if (t === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) root.classList.add('dark')
          else root.classList.remove('dark')
          root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
          return
        }

        if (t === 'dark') {
          root.classList.add('dark')
          root.setAttribute('data-theme', 'dark')
        } else {
          root.classList.remove('dark')
          root.setAttribute('data-theme', 'light')
        }
      } catch (e) {
        // Ignore DOM errors in non-browser environments
      }
    }

    applyTheme(theme)

    // If user chooses 'system', listen for system changes and re-apply
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (theme === 'system') applyTheme('system')
    }
    try {
      mq.addEventListener?.('change', onChange)
    } catch (e) {
      try { mq.addListener?.(onChange) } catch (e) {}
    }

    return () => {
      try { mq.removeEventListener?.('change', onChange) } catch (e) {
        try { mq.removeListener?.(onChange) } catch (e) {}
      }
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (t: Theme) => {
      try { localStorage.setItem(storageKey, t); } catch (e) {}
      setThemeState(t)
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