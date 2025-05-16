
import { useAppSelector, useAppDispatch } from './use-redux';
import { logout as logoutAction } from '@/store/slices/authSlice';

export const useAuth = () => {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  
  const isLoggedIn = !!user?.isLoggedIn;
  
  const logout = () => {
    dispatch(logoutAction());
  };

  return {
    user,
    isLoggedIn,
    isLoading,
    logout
  };
};
