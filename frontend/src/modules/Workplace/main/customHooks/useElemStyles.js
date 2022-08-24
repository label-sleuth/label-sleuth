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

import classes from "../Element.module.css";
import { useSelector } from "react-redux";
import { useCallback, useMemo } from "react";

/**
 * Handle the styles of an element. There are four cases:
 * - element is focused and predicted as positive.
 * - element is focused and not predicted as positive.
 * - element is not focused and predicted as positive.
 * - element is not focused and not predicted as positive.
 * @param { the id of the element component in the DOM } elementDOMId
 * @param { the models prediction } prediction
 * @returns
 */
const useElemStyles = (elementDOMId, prediction) => {

  // The hackyToggle variable forces this custom hook to be executed even when the DOMkey is the same
  // The scenario it covers is when the user clicks the same sidebar element twice
  const { DOMKey: focusedElementDOMKey, hackyToggle } = useSelector(
    (state) => state.workspace.panels.focusedElement
  );


  const text_colors = useMemo(
    () => ({
      pos: { color: "#3092ab" },
      neg: { color: "#bd3951" },
    }),
    []
  );

  const handleTextElemStyle = useCallback(() => {
    let textElemStyle;
    if (focusedElementDOMKey === elementDOMId) {
      textElemStyle =
        prediction === "pos" ? "text_auto_focus_pred" : "text_auto_focus";
    } else {
      textElemStyle = prediction === "pos" ? "text_predict" : "text_normal";
    }

    if (textElemStyle.startsWith("text_auto_focus")) {
      textElemStyle = hackyToggle ? `${textElemStyle}2` : textElemStyle;
    }
    const textElemStyleClass = classes[textElemStyle];
    return textElemStyleClass;
  }, [focusedElementDOMKey, hackyToggle, prediction, elementDOMId]);

  return {
    handleTextElemStyle,
    text_colors,
  };
};

export default useElemStyles;
