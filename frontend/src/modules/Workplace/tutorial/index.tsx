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

import { useCallback, useMemo } from "react";
import { Box, Stack } from "@mui/material";
import {
  SmallTitle,
  LargeTitle,
  MainContent,
  PrimaryButton,
  SecondaryButton,
  InnerModalContent,
  OuterModalContent,
  InnerModal,
  OuterModal,
  StageCounter,
} from "../../../components/dialog";
import { useState, useEffect } from "react";
import "./index.css";
import check from "./assets/check.svg";
import cross from "./assets/cross.svg";
import info_icon from "../../../assets/workspace/help.svg";
import { Fade } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import bmedia1 from "./assets/binary/stage_1.webp";
import bmedia2 from "./assets/binary/stage_2.webp";
import bmedia3 from "./assets/binary/stage_3.webp";
import bmedia4 from "./assets/binary/stage_4.gif";
import bmedia5 from "./assets/binary/stage_5.gif";
import bmedia6 from "./assets/binary/stage_6.gif";
import bmedia7 from "./assets/binary/stage_7.webp";
import mcmedia1 from "./assets/multiclass/stage_1.webp";
import mcmedia2 from "./assets/multiclass/stage_2.webp";
import mcmedia3 from "./assets/multiclass/stage_3.gif";
import mcmedia4 from "./assets/multiclass/stage_4.gif";
import mcmedia5 from "./assets/multiclass/stage_5.gif";
import mcmedia6 from "./assets/multiclass/stage_6.gif";
import mcmedia7 from "./assets/multiclass/stage_7.webp";
import { usePrealoadMedia } from "../../../customHooks/usePrealoadMedia";
import { useAppSelector } from "../../../customHooks/useRedux";
import { LabelTypesEnum, WorkspaceMode } from "../../../const";
import { returnByMode } from "../../../utils/utils";
import { MainElement } from "../../../components/element/MainElement";

const bmedia = [bmedia1, bmedia2, bmedia3, bmedia4, bmedia5, bmedia6, bmedia7];
const mcmedia = [
  mcmedia1,
  mcmedia2,
  mcmedia3,
  mcmedia4,
  mcmedia5,
  mcmedia6,
  mcmedia7,
];

interface TutorialProps {
  tutorialOpen: boolean;
  setTutorialOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Tutorial = ({ tutorialOpen, setTutorialOpen }: TutorialProps) => {
  const [stageIndex, setStageIndex] = useState(0);
  const mode = useAppSelector((state) => state.workspace.mode);

  // preload tutorial media files
  // so they are fetched before opening the tutorial
  usePrealoadMedia(mode === WorkspaceMode.BINARY ? bmedia : mcmedia);

  const media = useMemo(() => returnByMode(bmedia, mcmedia, mode), [mode]);

  useEffect(() => {
    if (tutorialOpen) {
      setStageIndex(0);
    }
  }, [tutorialOpen]);

  const onPrimaryButtonClickDefault = useCallback(() => {
    if (stageIndex < 6) {
      setStageIndex((prevIndex) => prevIndex + 1);
    }
  }, [stageIndex]);

  const onSecondaryButtonClickDefault = useCallback(() => {
    if (stageIndex > 0) {
      setStageIndex((prevIndex) => prevIndex - 1);
    }
  }, [stageIndex]);

  const binaryStages = [
    {
      largeTitle: "Welcome to the Label Sleuth Tutorial",
      content: (
        <Box>
          Label Sleuth is a no-code system for quickly creating custom text
          classifiers; no technical expertise required! Label Sleuth guides you
          through the data annotation process, while automatically creating an
          AI model in the background. This process is iterative, with the system
          automatically improving the model as you annotate more examples. The
          goal is to get a high-performance text classification model for your
          use case after just a few hours of interacting with Label Sleuth.
        </Box>
      ),
    },
    {
      largeTitle: "Category",
      content: (
        <Box className="stage-content">
          <p>
            Start by creating a category describing the aspect of the dataset
            that you want to identify. Make sure that the category is
            well-defined (i.e., it is clear to you whether a given text belongs
            to the category or not). In the binary mode, you will be working one
            category at a time; a design decision that has been made to make the
            data annotation and model building process more efficient. However,
            you may create several categories within a workspace and switch
            between them as needed.
          </p>
        </Box>
      ),
    },
    {
      largeTitle: "Data",
      content: (
        <Box>
          <p>
            Once you have created a category, you can start annotating the data.
            Annotation is a process that helps the AI model understand how to
            identify your category. The annotation system is binary - positive
            or negative - meaning that the text either matches the category
            definition or not.
          </p>
          <p>
            Annotate elements as positive or negative examples by clicking on
            the corresponding icons shown below. Note that annotations are not
            final; if you made a mistake, you can go back and edit your
            annotations as many times as you like.
          </p>
          <p>
            {" "}
            In the common case, where positive examples in your data are rare
            (i.e., less than 20% of the text elements are positives), spend more
            time on finding and annotating positive examples, as they are more
            valuable for the AI model to identify your category.
          </p>
          <span className="positive-label element-example">
            <img src={check} alt="positive element example" />
            Positive example - text matches category
          </span>
          <span className="negative-label element-example">
            <img src={cross} alt="negative element example" />
            Negative example - text does not match category
          </span>
        </Box>
      ),
    },
    {
      largeTitle: "Search",
      content: (
        <Box>
          <p>
            You can try to find good examples to annotate by skimming through
            your documents. However, a faster way to find positive examples is
            to search for terms that they contain. While looking at the search
            results, clicking on a text element will bring up the element in the
            document view, allowing you to inspect its surrounding text. You can
            annotate text elements either in the search results or in the
            document view.
          </p>
        </Box>
      ),
    },
    {
      largeTitle: "Model Update & Prediction",
      content: (
        <Box>
          <p>
            Initially, there is no AI model yet. Keep annotating until Label
            Sleuth prepares a first version of the model for you. The progress
            bar on the left shows how many annotations are missing until Label
            Sleuth starts training a model. Whenever a new version of the model
            is available, a confetti animation will notify you of the new model.
          </p>
          <p>
            The model makes predictions on your entire dataset. Examples it
            predicts to be positive (i.e., belonging to the category of
            interest) are shown with a dotted blue outline. Try to annotate some
            of these positive predictions to provide feedback to the model on
            where it is correct and where it is wrong.
          </p>
          <Box style={{ marginTop: "20px" }}>
            <span className="prediction">
              Positive prediction example:
              <Box className="element-example" style={{ marginLeft: "15px" }}>
                <Box className="predicted-element">
                  <p> I am a text entry that was predicted as positive! </p>
                </Box>
              </Box>
            </span>
          </Box>
        </Box>
      ),
    },
    {
      largeTitle: "Label next",
      content: (
        <Box>
          <p>
            Once a first version of the model is available, Label Sleuth will
            start guiding you by suggesting which elements to annotate next.
            Prioritize on annotating the suggested elements, to help improve the
            AI model the most.
          </p>
        </Box>
      ),
    },
    {
      smallTitle: "Tutorial completed",
      largeTitle: "That’s all!",
      content: (
        <p>
          You are now ready to start annotating to create your own model! If you
          need to revisit the tutorial, go to the top left of the screen and
          click on
          <img src={info_icon} className="tutorial-icon" alt="Open Tutorial" />
        </p>
      ),
      primaryButtonTitle: "Start labeling",
      onPrimaryButtonClick: () => setTutorialOpen(false),
      secondaryButtonTitle: "Restart from beginning",
      onSecondaryButtonClick: () => setStageIndex(0),
    },
  ];

  const multiclassStages = [
    {
      largeTitle: "Welcome to the Label Sleuth Tutorial",
      content: (
        <Box>
          Label Sleuth is a no-code system for quickly creating custom text
          classifiers; no technical expertise required! Label Sleuth guides you
          through the data annotation process, while automatically creating an
          AI model in the background. This process is iterative, with the system
          automatically improving the model as you annotate more examples. The
          goal is to get a high-performance text classification model for your
          use case after just a few hours of interacting with Label Sleuth.
        </Box>
      ),
    },
    {
      largeTitle: "Category",
      content: (
        <Box className="stage-content">
          <p>
            Start by creating a set of categories describing the aspects of the
            dataset that you want to identify. Make sure that the categories are
            well-defined (i.e., it is clear to you whether a given text belongs
            to the category or not).
          </p>
        </Box>
      ),
    },
    {
      largeTitle: "Data",
      content: (
        <Box>
          <p>
            Once you have created a category, you can start annotating the data.
            Annotation is a process that helps the AI model understand how to
            identify your categories.
          </p>
          <p>
            Annotate elements as belonging to one of the categories by clicking
            on the 'Label' button. Note that annotations are not final; if you
            made a mistake, you can go back and edit your annotations as many
            times as you like.
          </p>
        </Box>
      ),
    },
    {
      largeTitle: "Search",
      content: (
        <Box>
          <p>
            You can try to find good examples to annotate by skimming through
            your documents. While looking at the search results, clicking on a
            text element will bring up the element in the document view,
            allowing you to inspect its surrounding text. You can annotate text
            elements either in the search results or in the document view.
          </p>
        </Box>
      ),
    },
    {
      largeTitle: "Model Update & Prediction",
      content: (
        <Box>
          <p>
            Initially, there is no AI model yet. Keep annotating until Label
            Sleuth prepares a first version of the model for you. The progress
            bar on the left shows how many annotations are missing until Label
            Sleuth starts training a model. Whenever a new version of the model
            is available, a confetti animation will notify you of the new model.
          </p>
          <p>
            The model makes predictions on your entire dataset. Try to annotate
            some of these positive predictions to provide feedback to the model
            on where it is correct and where it is wrong.
          </p>
        </Box>
      ),
    },
    {
      largeTitle: "Label next",
      content: (
        <Box>
          <p>
            Once a first version of the model is available, Label Sleuth will
            start guiding you by suggesting which elements to annotate next.
            Prioritize on annotating the suggested elements, to help improve the
            AI model the most.
          </p>
        </Box>
      ),
    },
    {
      smallTitle: "Tutorial completed",
      largeTitle: "That’s all!",
      content: (
        <p>
          You are now ready to start annotating to create your own model! If you
          need to revisit the tutorial, go to the top left of the screen and
          click on
          <img src={info_icon} className="tutorial-icon" alt="Open Tutorial" />
        </p>
      ),
      primaryButtonTitle: "Start labeling",
      onPrimaryButtonClick: () => setTutorialOpen(false),
      secondaryButtonTitle: "Restart from beginning",
      onSecondaryButtonClick: () => setStageIndex(0),
    },
  ];

  const currentStage = returnByMode(binaryStages, multiclassStages, mode)[
    stageIndex
  ];

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === "ArrowRight") {
        onPrimaryButtonClickDefault();
      } else if (event.key === "ArrowLeft") {
        onSecondaryButtonClickDefault();
      }
    },
    [onPrimaryButtonClickDefault, onSecondaryButtonClickDefault]
  );

  useEffect(() => {
    if (tutorialOpen) {
      document.addEventListener("keydown", handleKeyPress);
      return () => {
        document.removeEventListener("keydown", handleKeyPress);
      };
    }
  }, [handleKeyPress, tutorialOpen]);

  return (
    <OuterModal open={tutorialOpen} onClose={() => setTutorialOpen(false)}>
      <Fade in={tutorialOpen} timeout={{ enter: 1000, exit: 0 }}>
        <OuterModalContent>
          <img
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            src={media[stageIndex]}
            alt={`media for stage ${currentStage.largeTitle}`}
          />
          <InnerModal
            open={tutorialOpen}
            onClose={() => setTutorialOpen(false)}
            hideBackdrop
          >
            <InnerModalContent>
              <Box
                style={{
                  marginTop: "5px",
                  marginLeft: "25px",
                  display: "block",
                }}
              >
                <Box
                  style={{
                    display: "flex",
                    flexDirection: "row-reverse",
                    order: 1,
                    flex: "0 0 auto",
                  }}
                >
                  <IconButton
                    aria-label="close"
                    style={{ color: "white" }}
                    onClick={() => setTutorialOpen(false)}
                    size="medium"
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                </Box>
                <SmallTitle>{currentStage.smallTitle || "Tutorial"}</SmallTitle>
                <Box
                  style={{
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <LargeTitle>{currentStage.largeTitle}</LargeTitle>
                  <StageCounter>{`(${stageIndex + 1} of ${
                    returnByMode(binaryStages, multiclassStages, mode).length
                  })`}</StageCounter>
                </Box>
                <MainContent>{currentStage.content}</MainContent>
              </Box>
              <Stack
                direction="row"
                justifyContent="flex-end"
                alignItems="flex-end"
                spacing={0}
                style={{
                  width: "100%",
                  flex: "none",
                  order: 1,
                  flexGrow: 0,
                  marginTop: "15px",
                }}
              >
                {stageIndex !== 0 ? (
                  <SecondaryButton
                    onClick={
                      currentStage.onSecondaryButtonClick ||
                      onSecondaryButtonClickDefault
                    }
                  >
                    {currentStage.secondaryButtonTitle || "Previous"}
                  </SecondaryButton>
                ) : null}
                <PrimaryButton
                  onClick={
                    currentStage.onPrimaryButtonClick ||
                    onPrimaryButtonClickDefault
                  }
                >
                  {currentStage.primaryButtonTitle || "Next"}
                </PrimaryButton>
              </Stack>
            </InnerModalContent>
          </InnerModal>
        </OuterModalContent>
      </Fade>
    </OuterModal>
  );
};

export default Tutorial;
