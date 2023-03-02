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
import { useMemo } from "react";
import { Box } from "@mui/system";
import Stack from "@mui/material/Stack";
import { useAppSelector } from "../../../customHooks/useRedux";
import checking from "../Asset/checking.svg";
import check from "../Asset/check.svg";
import crossing from "../Asset/crossing.svg";
import cross from "../Asset/cross.svg";
import classes from "./Element.module.css";
import { getPanelDOMKey } from "../../../utils/utils";
import { PanelIdsEnum } from "../../../const";

import useLabelState from "../../../customHooks/useLabelState";
import { useElemStyles } from "../../../customHooks/useElemStyles";
import { Element } from "../../../global";

interface ElementProps {
  element: Element;
}

export const MainElement = ({ element }: ElementProps) => {
  const { id, text, userLabel, modelPrediction } = element;

  const curCategory = useAppSelector((state) => state.workspace.curCategory);
  const evaluationIsInProgress = useAppSelector(
    (state) => state.workspace.panels.panels[PanelIdsEnum.EVALUATION].isInProgress
  );
  const evaluationLoading = useAppSelector((state) => state.workspace.panels.loading[PanelIdsEnum.EVALUATION]);
  const rightToLeft = useAppSelector((state) => state.featureFlags.rightToLeft);

  const { handlePosLabelState, handleNegLabelState } = useLabelState();
  const elementDOMId = useMemo(() => getPanelDOMKey(id, PanelIdsEnum.MAIN_PANEL), [id]);
  const elemStyleClasses = useElemStyles({ elementDOMId, prediction: modelPrediction, userLabel });

  return curCategory === null ? (
    <Box className={`${elemStyleClasses.prediction} ${elemStyleClasses.animation}`} id={elementDOMId}>
      <p className={`${classes["nodata_text"]} ${rightToLeft ? classes.right_to_left : ""}`}>{text}</p>
    </Box>
  ) : (
    <Box className={`${elemStyleClasses.prediction} ${elemStyleClasses.animation}`} id={elementDOMId}>
      <p className={`${classes.data_text} ${elemStyleClasses.userLabel} ${rightToLeft ? classes.right_to_left : ""}`}>
        {text}
      </p>
      <Stack
        className={!evaluationLoading && !evaluationIsInProgress ? classes.checking_buttons : ""}
        direction="row"
        spacing={0}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleNegLabelState(element);
          }}
          style={{ cursor: "pointer" }}
        >
          {userLabel === "neg" ? (
            <img className={classes.resultbtn} loading="eager" src={cross} alt="crossed" />
          ) : (
            <img className={classes.hovbtn} loading="eager" src={crossing} alt="crossinging" />
          )}
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            handlePosLabelState(element);
          }}
          style={{ cursor: "pointer" }}
        >
          {userLabel === "pos" ? (
            <img className={classes.resultbtn} loading="eager" src={check} alt="checked" />
          ) : (
            <img className={classes.hovbtn} loading="eager" src={checking} alt="checking" />
          )}
        </div>
      </Stack>
    </Box>
  );
};
