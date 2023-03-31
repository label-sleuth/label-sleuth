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
import React, { useMemo } from "react";
import { Box } from "@mui/system";
import { useAppSelector } from "../../customHooks/useRedux";
import classes from "./Element.module.css";
import labelButtonClasses from "../labelButtons/index.module.css";
import { getPanelDOMKey } from "../../utils/utils";
import { PanelIdsEnum } from "../../const";
import useLabelState from "../../customHooks/useLabelState";
import { useElemStyles } from "../../customHooks/useElemStyles";
import { Element } from "../../global";
import { LabelingButtons } from "./LabelingButtons";
import { LabelCategoriesMenu } from "./LabelNonCurrentCatMenu";

interface ElementProps {
  element: Element;
}

export const MainElement = ({ element }: ElementProps) => {
  const { id, text, userLabel, modelPrediction } = element;

  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const rightToLeft = useAppSelector((state) => state.featureFlags.rightToLeft);

  const { handlePosLabelAction, handleNegLabelAction } = useLabelState();
  const elementDOMId = useMemo(() => getPanelDOMKey(id, PanelIdsEnum.MAIN_PANEL), [id]);
  const elemStyleClasses = useElemStyles({ elementDOMId, prediction: modelPrediction, userLabel });

  const [labelMenuOpenAnchorEl, setLabelMenuOpenAnchorEl] = React.useState<(EventTarget & globalThis.Element) | null>(
    null
  );
  const labelMenuOpen = useMemo(() => Boolean(labelMenuOpenAnchorEl), [labelMenuOpenAnchorEl]);

  const evaluationIsInProgress = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.EVALUATION].isInProgress
  );

  return curCategory === null ? (
    <Box className={`${elemStyleClasses.prediction} ${elemStyleClasses.animation}`} id={elementDOMId}>
      <p className={`${classes["nodata_text"]} ${rightToLeft ? classes.right_to_left : ""}`}>{text}</p>
    </Box>
  ) : (
    <>
      <Box
        className={`${elemStyleClasses.prediction} ${elemStyleClasses.animation} ${labelButtonClasses.text_element} ${
          labelMenuOpen ? classes.hover_element_on_menu_open : ""
        }`}
        id={elementDOMId}
      >
        <p className={`${classes.data_text} ${elemStyleClasses.userLabel} ${rightToLeft ? classes.right_to_left : ""}`}>
          {text}
        </p>
        <LabelingButtons
          labelMenuOpen={labelMenuOpen}
          labelMenuOpenAnchorEl={labelMenuOpenAnchorEl}
          setLabelMenuOpenAnchorEl={setLabelMenuOpenAnchorEl}
          element={element}
          handlePosLabelAction={handlePosLabelAction}
          handleNegLabelAction={handleNegLabelAction}
          hideButtons={evaluationIsInProgress}
          otherCatsTooltipProps={{ placement: "top" }}
        />
      </Box>
      <LabelCategoriesMenu
        anchorEl={labelMenuOpenAnchorEl}
        open={labelMenuOpen}
        setLabelMenuOpenAnchorEl={setLabelMenuOpenAnchorEl}
        element={element}
      />
    </>
  );
};
