import { useLocalStorage } from "usehooks-ts";
import { useEffect } from "react";

export const useWorkspaceVisited = () => {
  const [workspaceVisited, setWorkspaceVisited] = useLocalStorage("workspaceVisited", false);

  useEffect(() => {
    setWorkspaceVisited(true);
  }, [setWorkspaceVisited]);

  return workspaceVisited;
};
