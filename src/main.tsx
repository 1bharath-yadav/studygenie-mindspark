import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './hooks/use-theme.tsx'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="studygenie-theme">
    <App />
  </ThemeProvider>
);
