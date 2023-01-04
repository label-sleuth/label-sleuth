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

import { changeCurrentDocument, clearMainPanelFocusedElement } from "../modules/Workplace/redux";
import { useAppDispatch, useAppSelector } from "./useRedux";

export const useFetchPrevNextDoc = () => {

  const curDocIndex = useAppSelector((state) => state.workspace.curDocIndex);
  const documents = useAppSelector((state) => state.workspace.documents);
  const mainPanelElementsPerPage = useAppSelector((state) => state.featureFlags.mainPanelElementsPerPage);
  
  const dispatch = useAppDispatch();

  const handleFetchNextDoc = () => {
    if (curDocIndex < documents.length - 1) {
      dispatch(clearMainPanelFocusedElement());
      dispatch(changeCurrentDocument({ newDocId: documents[curDocIndex + 1].documentId, mainPanelElementsPerPage }));
      // this action is currently focusing the first element of the previous document
      // it works, but ideally the first element of the new document should be focused
    }
  };

  const handleFetchPrevDoc = () => {
    if (curDocIndex > 0) {
      dispatch(clearMainPanelFocusedElement());
      dispatch(changeCurrentDocument({ newDocId: documents[curDocIndex - 1].documentId, mainPanelElementsPerPage }));
    }
  };

  return {
    handleFetchPrevDoc,
    handleFetchNextDoc,
  };
};

