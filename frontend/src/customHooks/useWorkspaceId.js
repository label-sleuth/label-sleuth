import { useSessionStorage } from "usehooks-ts";

export const useWorkspaceId = () => {
  const [workspaceId, setWorkspaceId] = useSessionStorage("workspaceId");

  return {
    workspaceId,
    setWorkspaceId,
  };
};
