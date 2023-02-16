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

import { useCallback } from "react";
import { changeCurrentDocument, setFocusedMainPanelElement } from "../modules/Workplace/redux";
import { useAppDispatch, useAppSelector } from "./useRedux";

export const useFocusMainPanelElement = () => {
  const dispatch = useAppDispatch();
  const mainPanelElementsPerPage = useAppSelector((state) => state.featureFlags.mainPanelElementsPerPage);

  const focusMainPanelElement = useCallback(({ element, docId }) => {
    dispatch(setFocusedMainPanelElement({ element, highlight: true }));
    dispatch(changeCurrentDocument({newDocId: docId, mainPanelElementsPerPage}));
  }, [dispatch, mainPanelElementsPerPage]);

  return { focusMainPanelElement };
};
