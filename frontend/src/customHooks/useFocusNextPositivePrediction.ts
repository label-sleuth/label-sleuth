import { useAppDispatch, useAppSelector } from "./useRedux";
import { setFocusedMainPanelElement } from "../modules/Workplace/redux";
import { usePrevious } from "./usePrevious";
import { useEffect, useMemo } from "react";
import { useNotification } from "../utils/notification";
import { toast } from "react-toastify";
import { LabelTypesEnum, PanelIdsEnum } from "../const";
import { getElementIndex } from "../utils/utils";
import { Element } from "../global";
import { useFocusMainPanelElement } from "./useFocusMainPanelElement";

export const useFocusNextPositivePrediction = () => {
  const dispatch = useAppDispatch();

  const { notify } = useNotification();
  const mainPanelElements = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL].elements
  );
  const focusedElementId = useAppSelector(
    (state) => state.workspace.panels.focusedElement.id
  );

  const noPositivePredictions = useMemo(
    () =>
      mainPanelElements === null
        ? true
        : Object.values(mainPanelElements).filter(
            (e) => e.modelPrediction === LabelTypesEnum.POS
          ).length === 0,
    [mainPanelElements]
  );

  const focusNextPositivePrediction = () => {
    if (noPositivePredictions === true) {
      notify("There are no positive predictions in this page.", {
        toastId: "no-positive-predictions-toast",
        type: toast.TYPE.INFO,
        autoClose: 3000,
      });
      return;
    }

    if (mainPanelElements === null) return;
    let nextPositivePredictionElement: Element | null = null;

    for (const e of Object.values(mainPanelElements).slice(
      focusedElementId !== null ? getElementIndex(focusedElementId) + 1 : 0
    )) {
      if (e.modelPrediction === LabelTypesEnum.POS) {
        nextPositivePredictionElement = e;
        break;
      }
    }   
    console.log(nextPositivePredictionElement);
    if (nextPositivePredictionElement === null) {
      notify("There are no more positive predictions in the current page.", {
        toastId: "no-more-positive-predictions-toast",
        type: toast.TYPE.INFO,
        autoClose: 3000,
      });
      return;
    }

    dispatch(
      setFocusedMainPanelElement({
        element: nextPositivePredictionElement,
        highlight: true,
      })
    );
  };

  return { focusNextPositivePrediction };
};
