import {ReactNode, useEffect, useState} from 'react';
import { useRouter } from 'next/router';

import ROUTES from 'config/routes';
import { useAuth } from 'context/AuthContext';

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [notAuth, setNotAuth] = useState(false);
  const { isAuthenticated, loadingAuth } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loadingAuth) {
      setNotAuth(false);
      router?.push(ROUTES.DASHBOARD.path);
    } else {
      setNotAuth(true);
    }
  }, [isAuthenticated, loadingAuth])


  if (loadingAuth || isAuthenticated) return null;

  if (notAuth) return <>{children}</>;

  return null;
};

export default PublicRoute;
