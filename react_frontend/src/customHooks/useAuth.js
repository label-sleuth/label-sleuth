export function useAuth() {
    const isLoggedIn = localStorage.getItem("token")
    if (isLoggedIn) {
      return true;
    }
    return false
  }