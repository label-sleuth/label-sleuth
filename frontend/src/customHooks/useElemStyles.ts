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

import classes from "../components/element/Element.module.css";
import { useMemo } from "react";
import { useAppSelector } from "./useRedux";
import { LabelTypesEnum } from "../const";

interface UseElemStylesProps {
  elementDOMId: string;
  prediction: LabelTypesEnum;
  userLabel: LabelTypesEnum;
}

interface StylesDict {
  animation: string | null;
  prediction: string | null;
  userLabel: string | null;
}

interface ResolvedStylesDict {
  animation: string | null;
  prediction: string | null;
  userLabel: string | null;
}

enum ElemStyleClassesEnum {
  ANIMATION = "text_auto_focus",
  PREDICT = "text_predict",
  NON_PREDICT = "text_normal",
  POS_USER_LABEL = "pos_user_label",
  NEG_USER_LABEL = "neg_user_label",
}

/**
 * Handle the styles of an element. There are four cases:
 * - element is focused and predicted as positive.
 * - element is focused and not predicted as positive.
 * - element is not focused and predicted as positive.
 * - element is not focused and not predicted as positive.
 * @param { the id of the element component in the DOM } elementDOMId
 * @param { the models prediction } prediction
 */
export const useElemStyles = ({ elementDOMId, prediction, userLabel }: UseElemStylesProps): ResolvedStylesDict => {
  // The hackyToggle variable forces this custom hook to be executed even when the DOMkey is the same document
  // The scenario it covers is when the user clicks the same sidebar element twice
  const {
    DOMKey: focusedElementDOMKey,
    hackyToggle,
    highlight,
  } = useAppSelector((state) => state.workspace.panels.focusedElement);

  const elemStyle: StylesDict = useMemo(() => {
    let style: StylesDict = {
      animation: null,
      prediction: null,
      userLabel: null,
    };

    if (focusedElementDOMKey === elementDOMId && highlight === true) {
      style.animation = ElemStyleClassesEnum.ANIMATION;
    }

    if (style.animation) {
      style.animation = hackyToggle ? `${style.animation}2` : style.animation;
    }

    style.prediction = prediction === LabelTypesEnum.POS ? ElemStyleClassesEnum.PREDICT : ElemStyleClassesEnum.NON_PREDICT;

    style.userLabel =
      userLabel === LabelTypesEnum.POS
        ? ElemStyleClassesEnum.POS_USER_LABEL
        : userLabel === LabelTypesEnum.NEG
        ? ElemStyleClassesEnum.NEG_USER_LABEL
        : null;

    return style;
  }, [focusedElementDOMKey, hackyToggle, prediction, elementDOMId, highlight, userLabel]);

  const elemStyleClasses: ResolvedStylesDict = useMemo(() => {
    let styleClasses: ResolvedStylesDict = {
      animation: elemStyle.animation ? classes[elemStyle.animation] : "",
      prediction: elemStyle.prediction ? classes[elemStyle.prediction] : "",
      userLabel: elemStyle.userLabel ? classes[elemStyle.userLabel] : "",
    };

    return styleClasses;
  }, [elemStyle]);
  return elemStyleClasses;
};
