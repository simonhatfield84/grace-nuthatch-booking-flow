/**
 * Feature switch for toggling between old and new booking widget UI
 */

export function getUseNewUI(): boolean {
  // Check URL param first
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('newui') === '1') {
    localStorage.setItem('bookingNewUI', '1');
    return true;
  }
  
  // Check localStorage
  return localStorage.getItem('bookingNewUI') === '1';
}

export function clearNewUIFlag() {
  localStorage.removeItem('bookingNewUI');
}

export function getDebugMode(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('debug') === '1';
}
