import { useAppDispatch, useAppSelector } from "./useRedux";
import { setFocusedMainPanelElement } from "../modules/Workplace/redux";
import { useCallback, useEffect } from "react";
import { useNotification } from "../utils/notification";
import { toast } from "react-toastify";
import { LabelTypesEnum, PanelIdsEnum } from "../const";
import { getElementIndex } from "../utils/utils";
import { Element } from "../global";
import { fetchDocumentPositivePredictions } from "../modules/Workplace/redux/panelsSlice";
import { useFocusMainPanelElement } from "./useFocusMainPanelElement";
import { currentDocNameSelector } from "../modules/Workplace/redux/documentSlice";

export const useFocusNextPositivePrediction = () => {
  const dispatch = useAppDispatch();

  const { notify } = useNotification();
  const mainPanelElements = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL].elements
  );
  const modelVersion = useAppSelector((state) => state.workspace.modelVersion);
  const curDocIndex = useAppSelector((state) => state.workspace.curDocIndex);
  const focusedElementId = useAppSelector(
    (state) => state.workspace.panels.focusedElement.id
  );
  const documentPositivePredictionIds = useAppSelector(
    (state) =>
      state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL]
        .documentPositivePredictionIds
  );
  const page = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.MAIN_PANEL].page
  );
  const mainPanelElementsPerPage = useAppSelector(
    (state) => state.featureFlags.mainPanelElementsPerPage
  );
  const curDocName = useAppSelector(currentDocNameSelector);

  const { focusMainPanelElement } = useFocusMainPanelElement();

  useEffect(() => {
    if (modelVersion !== null && modelVersion > 0) {
      dispatch(fetchDocumentPositivePredictions({}));
    }
  }, [modelVersion, curDocIndex, dispatch]);

  const focusNextPositivePrediction = useCallback(() => {
    const noPositivePredictions =
      mainPanelElements === null
        ? true
        : Object.values(mainPanelElements).filter(
            (e) => e.modelPrediction === LabelTypesEnum.POS
          ).length === 0;

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
      focusedElementId !== null
        ? (getElementIndex(focusedElementId) % mainPanelElementsPerPage) + 1
        : 0
    )) {
      if (e.modelPrediction === LabelTypesEnum.POS) {
        nextPositivePredictionElement = e;
        break;
      }
    }

    if (nextPositivePredictionElement === null) {
      const positivePredictionInNextPages =
        documentPositivePredictionIds !== null
          ? documentPositivePredictionIds.filter((id) => {
              const index = getElementIndex(id);
              return (
                index >=
                (page - 1) * mainPanelElementsPerPage + mainPanelElementsPerPage
              );
            })
          : [];

      if (positivePredictionInNextPages.length > 0) {
        const nextFocusedElementId = positivePredictionInNextPages[0];
        focusMainPanelElement({
          element: { docId: curDocName, id: nextFocusedElementId },
          docId: curDocName,
        });
        return;
      } else {
        notify("There are no more positive predictions in the document.", {
          toastId: "no-more-positive-predictions-toast",
          type: toast.TYPE.INFO,
          autoClose: 3000,
        });
        //dispatch(clearMainPanelFocusedElement());
        return;
      }
    }

    dispatch(
      setFocusedMainPanelElement({
        element: nextPositivePredictionElement,
        highlight: true,
      })
    );
  }, [
    mainPanelElements,
    curDocName,
    dispatch,
    documentPositivePredictionIds,
    focusMainPanelElement,
    focusedElementId,
    mainPanelElementsPerPage,
    notify,
    page,
  ]);

  const focusPreviousPositivePrediction = useCallback(() => {
    const noPositivePredictions =
      mainPanelElements === null
        ? true
        : Object.values(mainPanelElements).filter(
            (e) => e.modelPrediction === LabelTypesEnum.POS
          ).length === 0;

    if (noPositivePredictions === true) {
      notify("There are no positive predictions in this page.", {
        toastId: "no-positive-predictions-toast",
        type: toast.TYPE.INFO,
        autoClose: 3000,
      });
      return;
    }

    if (mainPanelElements === null) return;
    let previousPositivePredictionElement: Element | null = null;

    for (const e of Object.values(mainPanelElements).slice(
      0,
      focusedElementId !== null
        ? (getElementIndex(focusedElementId) % mainPanelElementsPerPage)
        : undefined
    ).reverse()) {
      if (e.modelPrediction === LabelTypesEnum.POS) {
        previousPositivePredictionElement = e;
        break;
      }
    }

    if (previousPositivePredictionElement === null) {
      const positivePredictionInPreviousPages =
        documentPositivePredictionIds !== null
          ? documentPositivePredictionIds.filter((id) => {
              const index = getElementIndex(id);
              return (
                index <
                (page - 1) * mainPanelElementsPerPage
              );
            })
          : [];

      if (positivePredictionInPreviousPages.length > 0) {
        const nextFocusedElementId = positivePredictionInPreviousPages.at(-1);
        focusMainPanelElement({
          element: { docId: curDocName, id: nextFocusedElementId },
          docId: curDocName,
        });
        return;
      } else {
        notify("There are no more positive predictions in the document.", {
          toastId: "no-more-positive-predictions-toast",
          type: toast.TYPE.INFO,
          autoClose: 3000,
        });
        return;
      }
    }

    dispatch(
      setFocusedMainPanelElement({
        element: previousPositivePredictionElement,
        highlight: true,
      })
    );
  }, [
    mainPanelElements,
    curDocName,
    dispatch,
    documentPositivePredictionIds,
    focusMainPanelElement,
    focusedElementId,
    mainPanelElementsPerPage,
    notify,
    page,
  ]);

  return { focusPreviousPositivePrediction, focusNextPositivePrediction };
};
