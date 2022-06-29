import { Stack } from "@mui/material";
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
} from "./components";
import { useState, useEffect } from "react";
import "./index.css";
import check from "./assets/check.svg";
import cross from "./assets/cross.svg";
import info_icon from "../../../assets/workspace/help.svg";
import { Fade } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function importAll(r) {
  return r.keys().map(r);
}

const media = importAll(require.context("./assets/v2/", false));

const Tutorial = ({ tutorialOpen, setTutorialOpen }) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (tutorialOpen) {
      setStageIndex(0);
    }
  }, [tutorialOpen]);

  const onPrimaryButtonClickDefault = () => {
    setStageIndex(stageIndex + 1);
  };

  const onSecondaryButtonClickDefault = () => {
    setStageIndex(stageIndex - 1);
  };

  const stages = [
    {
      largeTitle: "Welcome to the Label Sleuth Tutorial",
      content: (
        <div>
          <a href="http://label-sleuth.org/" target="_blank">Label Sleuth</a> 
        significantly reduces the time and effort for creating usable text classification models. 
        This no-code system guides you throughout the labeling process. An AI model is automatically maintained in the background 
        and provides you feedback to direct you towards an efficient process. This model keeps improving as you annotate more examples.
        The goal is that with just a few hours with Label Sleuth you will have all you need for a text classification model.
        </div>
      ),
    },
    {
      largeTitle: "Category",
      content: (
        <div className="stage-content">
          <p>
            Start by creating your own category, or choose an existing one. 
            A category corresponds to the aspect that you want to identify in your data. 
            Make sure the category is well-defined and that given a text from your data, 
            it is clear to you whether this text belongs to the category or not. 
            You can have many categories in a workspace and switch between them whenever you’d like. 
            In Label Sleuth we work on one category at a time. This plays a pivotal role in making the process efficient.    
          </p>
        </div>
      ),
    },
    {
      largeTitle: "Data",
      content: (
        <div>
          <p>
            You can start labeling the data now! Labeling is a process that
            helps the AI model to understanding the criteria to your category.
            The label system is binary - positive or negative - the text either matches the category definition or not.
            You can go back and edit your labels as many times as you’d like.
            In a common case, where positive examples are rare in your data (roughly less than 20% are positives), spend more 
            time on finding and annotating positive examples, as they are more valuable for the AI model in such a case. 
          </p>
          <div style={{ marginLeft: "35px" }}>
            <span className="positive-label">
              <img src={check} />
              Positive - text maches the chosen category
            </span>
            <span className="negative-label">
              <img src={cross} />
              Negative
            </span>
          </div>
        </div>
      ),
    },
    {
      largeTitle: "Search",
      content: (
        <div>
          <p>
            To find good examples to annotate you can skim your documents. 
            A faster way to find good examples is to search for terms that they contain.
            Double-clicking on a text element card on the list in the right panel will bring up the document of this element in the center view
            and will focus on the text element within the document. You can label text elements directly on the search results or in the document view.
          </p>
        </div>
      ),
    },
    {
      largeTitle: "Model Update & Prediction",
      content: (
        <div>
          <p>
            Initially, there is not AI model yet. 
            Keep annotating until Label Sleuth prepares a first version of the model for you. 
            The progress bar on the left shows how many annotations are missing until Label Sleuth starts training a model. 
            Whenever the model finishes updating, a confetti will appear! It
            tells you that there is now a new model.
          </p>
          <p>
            The model makes predictions on your entire data. Examples it predict to be positive (i.e., belonging to the category of interest) 
            are shown with a dotted frame. It is useful to label some of those to provide feedback to the model 
            on where it is correct and where it is wrong.
          </p>
          <div style={{ marginTop: "20px" }}>
            <span className="prediction">
              Positive prediction example:
              <div className="predicted-element">
                <p> I am a text entry that was predicted as positive! </p>
              </div>
            </span>
          </div>
        </div>
      ),
    },
    {
      largeTitle: "Recommended to label",
      content: (
        <div>
          <p>
            An important guidance the AI model provides you is a list of text elements it recommend to label next.  
            Prioritize on labeling these will help improve the model the most.
          </p>
        </div>
      ),
    },
    {
      smallTitle: "Tutorial completed",
      largeTitle: "That’s all!",
      content: (
        <p>
          If you need to revisit the tutorial, go to the top left of the screen
          and click on
          <img src={info_icon} className="tutorial-icon" alt="Open Tutorial" />
        </p>
      ),
      primaryButtonTitle: "Start labeling",
      onPrimaryButtonClick: () => setTutorialOpen(false),
      secondaryButtonTitle: "Restart from beginning",
      onSecondaryButtonClick: () => setStageIndex(0),
    },
  ];

  const currentStage = stages[stageIndex];

  return (
    <OuterModal open={tutorialOpen} onClose={() => setTutorialOpen(false)}>
      <Fade in={tutorialOpen} timeout={{ enter: 1000, exit: 0 }}>
        <OuterModalContent>
          <img
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            src={media[stageIndex]}
          />
          <InnerModal
            open={tutorialOpen}
            onClose={() => setTutorialOpen(false)}
            hideBackdrop
          >
            <InnerModalContent>
              <div
                style={{
                  marginTop: "5px",
                  marginLeft: "25px",
                  display: "block",
                }}
              >
                <div style={{
                      display: "flex",
                      flexDirection: "row-reverse",
                      order: 1, 
                      flex: "0 0 auto",
                }}>
                  <IconButton
                    aria-label="close"
                    style={{color: "white"}}
                    onClick={() => setTutorialOpen(false)}
                    sizeMedium
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                </div>
                <SmallTitle>{currentStage.smallTitle || "Tutorial"}</SmallTitle>
                <LargeTitle>{currentStage.largeTitle}</LargeTitle>
                <MainContent>{currentStage.content}</MainContent>
              </div>
              <Stack
                direction="row"
                justifyContent="flex-end"
                alignItems="flex-end"
                spacing={0}
                style={{ width: "100%", flex: "none", order: 1, flexGrow: 0, marginTop: "15px" }}
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
