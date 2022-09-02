import { useSelector } from "react-redux";

const useAuthentication = () => {
  const authenticated = useSelector(
    (state) => state.authenticate.authenticated
  );

  const authenticationEnabled = useSelector(
    (state) => state.featureFlags.authenticationEnabled
  );

  return {
    authenticated,
    authenticationEnabled,
  };
};

export default useAuthentication;
