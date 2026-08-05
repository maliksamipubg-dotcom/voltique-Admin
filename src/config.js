const DEFAULT_BACKEND_URL = 'https://voltique-backend.vercel.app'

const normalizeUrl = (url) => {
  if (!url) return ''
  let value = url.trim().replace(/\/+$/, '')
  if (!value) return ''
  if (
    import.meta.env.PROD &&
    value.startsWith('http://') &&
    !value.includes('localhost') &&
    !value.includes('127.0.0.1')
  ) {
    value = value.replace('http://', 'https://')
  }
  return value
}

export const backendUrl = normalizeUrl(import.meta.env.VITE_BACKEND_URL) || DEFAULT_BACKEND_URL
