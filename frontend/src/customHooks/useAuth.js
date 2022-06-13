import { useSelector } from "react-redux";

export function useAuth() {
    const isAuthenticated = useSelector(state => state.authenticate.isAuthenticated)
    return isAuthenticated
  }