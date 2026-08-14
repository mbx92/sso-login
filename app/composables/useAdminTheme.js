export const ADMIN_THEME_STORAGE_KEY = 'sso-admin-theme'

export const ADMIN_THEMES = [
  { value: 'minimax', label: 'MiniMax', description: 'Default rounded, coral-accent theme' },
  { value: 'ibm', label: 'IBM Carbon', description: 'Square-cornered, IBM Blue enterprise theme' },
]

function applyTheme(value) {
  if (!import.meta.client) return
  document.documentElement.setAttribute('data-theme', value)
  try {
    localStorage.setItem(ADMIN_THEME_STORAGE_KEY, value)
  } catch {
    // localStorage unavailable (e.g. private browsing) — theme still applies for this page load
  }
}

export function useAdminTheme() {
  const theme = useState('admin-theme', () => 'minimax')

  onMounted(() => {
    const current = document.documentElement.getAttribute('data-theme') || 'minimax'
    theme.value = current
  })

  function setTheme(value) {
    if (!ADMIN_THEMES.some((t) => t.value === value)) return
    theme.value = value
    applyTheme(value)
  }

  return { theme, setTheme, themes: ADMIN_THEMES }
}
