export const TC_ADMIN_AUTH_KEY = 'tcAdminAuthenticated'
export const TC_ADMIN_SESSION_KEY = 'tcAdminSession'

export function isTcAdminAuthenticated() {
  return localStorage.getItem(TC_ADMIN_AUTH_KEY) === 'true'
}

export function setTcAdminSession(password) {
  localStorage.setItem(TC_ADMIN_AUTH_KEY, 'true')
  localStorage.setItem(TC_ADMIN_SESSION_KEY, password)
}

export function clearTcAdminSession() {
  localStorage.removeItem(TC_ADMIN_AUTH_KEY)
  localStorage.removeItem(TC_ADMIN_SESSION_KEY)
}
