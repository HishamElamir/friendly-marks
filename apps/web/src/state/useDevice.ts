const STORAGE_KEY = 'fm.device_id'

/** A UUID generated once per browser and kept in localStorage, independent of
 * the auth session cookie — it survives logout/login so the sync popover can
 * tell "this device" apart from the user's others. */
export function getClientDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export function guessDeviceName(): string {
  const ua = navigator.userAgent
  if (/iPad/.test(ua)) return 'iPad'
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/Android/.test(ua)) return 'Android device'
  if (/Macintosh/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows PC'
  if (/Linux/.test(ua)) return 'Linux PC'
  return 'This browser'
}

export function guessDeviceType(): 'desktop' | 'tablet' | 'phone' | 'other' {
  const ua = navigator.userAgent
  if (/iPad|Tablet/.test(ua)) return 'tablet'
  if (/iPhone|Android/.test(ua)) return 'phone'
  if (/Macintosh|Windows|Linux/.test(ua)) return 'desktop'
  return 'other'
}
