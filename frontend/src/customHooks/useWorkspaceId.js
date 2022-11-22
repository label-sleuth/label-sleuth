import { useLocalStorage } from "usehooks-ts";

export const useWorkspaceId = () => {
  const [workspaceId, setWorkspaceId] = useLocalStorage("workspaceId");

  return {
    workspaceId,
    setWorkspaceId,
  };
};
