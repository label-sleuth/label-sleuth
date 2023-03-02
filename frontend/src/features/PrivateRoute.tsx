/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import { Navigate } from 'react-router-dom';
import { LOGIN_PATH } from '../config';
import { useAuthentication } from '../customHooks/useAuthentication';

interface PrivateRouteProps { 
  redirectPath?: string;
  children: React.ReactNode;
}

export function PrivateRoute({ redirectPath = LOGIN_PATH, children }: PrivateRouteProps) {
  const {authenticationEnabled, authenticated} = useAuthentication();
  
  if (authenticationEnabled && !authenticated) {
    return <Navigate to={redirectPath} replace={true} />;
  }
  return <>{children}</>;
};