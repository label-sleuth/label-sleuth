// import { useAppDispatch, useAppSelector } from "./useRedux";
// import { focusNextPositivePredictionInCurrentPage } from "../modules/Workplace/redux";
// import { usePrevious } from "./usePrevious";
// import { useEffect, useMemo } from "react";
// import { useNotification } from "../utils/notification";
// import { toast } from "react-toastify";
// import { LabelTypesEnum, PanelIdsEnum } from "../const";
export {}
const t = 2;
// export const useFocusNextPositivePrediction = () => {
//   const dispatch = useAppDispatch();

//   const { notify } = useNotification();
//   const mainPanelElements = useAppSelector(
//     (state) => state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL].elements
//   );
//   const focusedElementId = useAppSelector(
//     (state) => state.workspace.panels.focusedElement.id
//   );
//   const lastInPage = useAppSelector(
//     (state) => state.workspace.panels.focusedElement.lastInPage
//   );

//   const modelVersion = useAppSelector((state) => state.workspace.modelVersion);

//   const previousFocusedElementId = usePrevious(focusedElementId);

//   const noPositivePredictions = useMemo(
//     () =>
//       mainPanelElements === null
//         ? true
//         : Object.values(mainPanelElements).filter(
//             (e) => e.modelPrediction === LabelTypesEnum.POS
//           ).length === 0,
//     [mainPanelElements]
//   );
//   useEffect(() => {
//     if (modelVersion !== null && modelVersion > 0) {
//       if (noPositivePredictions) {
//         console.log(mainPanelElements)
        
//         notify("There are no positive predictions in this page", {
//           toastId: "no-positive-predictions-toast",
//           type: toast.TYPE.INFO,
//         });
//       }
//       if (
//         lastInPage ||
//         (previousFocusedElementId !== null &&
//           focusedElementId !== null &&
//           previousFocusedElementId === focusedElementId)
//       ) {
//         notify("There are no more positive predictions in the current page.", {
//           toastId: "no-more-positive-predictions-toast",
//           type: toast.TYPE.INFO,
//         });
//       }
//     }
//   }, [
//     modelVersion,
//     lastInPage,
//     noPositivePredictions,
//     previousFocusedElementId,
//     focusedElementId,
//     notify,
//   ]);

//   const focusNextPositivePrediction = () => {
//     dispatch(focusNextPositivePredictionInCurrentPage());
//   };

//   return { focusNextPositivePrediction };
// };
