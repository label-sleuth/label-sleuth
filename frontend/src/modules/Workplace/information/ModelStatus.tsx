import { useAppSelector } from "../../../customHooks/useRedux";
import { ModelErrorAlert } from "./ModelErrorAlert";
import { LinearWithValueLabel } from "./ModelProgressBar";
import { ModelTrainingMessage } from "./ModelTrainingMessage";
import { ModelVersion } from "./ModelVersion";

export const ModelStatus = () => {
  const lastModelFailed = useAppSelector(
    (state) => state.workspace.lastModelFailed
  );

  return (
    <>
      <ModelVersion />
      <LinearWithValueLabel />
      <ModelTrainingMessage />
      {lastModelFailed && <ModelErrorAlert />}
    </>
  );
};
