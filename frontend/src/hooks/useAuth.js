import { useSelector } from 'react-redux'

export const useAuth = () => {
  const { user, token, isLoading, error } = useSelector((state) => state.auth)
  
  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated: !!token,
    isStaff: user?.is_staff || false,
  }
}

export default useAuth
