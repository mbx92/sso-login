export function humanizeSsoError(raw) {
  const text = String(raw || '')
  if (
    /failed\s+query|select\s+|insert\s+|update\s+|delete\s+|relation\s+"|params:\s*|ECONNREFUSED|syntax\s+error/i.test(text)
    || text.length > 160
  ) {
    if (/does not exist|relation/i.test(text)) {
      return 'Database aplikasi belum siap. Hubungi administrator.'
    }
    return 'Login SSO gagal. Silakan coba lagi.'
  }
  return text || 'Login SSO gagal'
}
