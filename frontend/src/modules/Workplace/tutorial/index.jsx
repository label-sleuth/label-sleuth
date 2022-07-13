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
  StageCounter,
} from "./components";
import { useState, useEffect } from "react";
import "./index.css";
import check from "./assets/check.svg";
import cross from "./assets/cross.svg";
import info_icon from "../../../assets/workspace/help.svg";
import { Fade } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import media1 from "./assets/v3/stage_1.webp";
import media2 from "./assets/v3/stage_2.webp";
import media3 from "./assets/v3/stage_3.webp";
import media4 from "./assets/v3/stage_4.webp";
import media5 from "./assets/v3/stage_5.webp";
import media6 from "./assets/v3/stage_6.webp";
import media7 from "./assets/v3/stage_7.webp";

const media = [media1, media2, media3, media4, media5, media6, media7];

const Tutorial = ({ tutorialOpen, setTutorialOpen }) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (tutorialOpen) {
      setStageIndex(0);
    }
  }, [tutorialOpen]);

  const onPrimaryButtonClickDefault = () => {
    if (stageIndex < 6) {
      setStageIndex(prevIndex => prevIndex + 1);
    }
  };

  const onSecondaryButtonClickDefault = () => {
    if (stageIndex > 0) {
      setStageIndex(prevIndex => prevIndex - 1);
    }
  };

  const stages = [
    {
      largeTitle: "Welcome to the Label Sleuth Tutorial",
      content: (
        <div>
          Label Sleuth is a no-code system for quickly creating custom text
          classifiers; no technical expertise required! Label Sleuth guides you
          through the data annotation process, while automatically creating an
          AI model in the background. This process is iterative, with the system
          automatically improving the model as you annotate more examples. The
          goal is to get a high-performance text classification model for your
          use case after just a few hours of interacting with Label Sleuth.
        </div>
      ),
    },
    {
      largeTitle: "Category",
      content: (
        <div className="stage-content">
          <p>
            Start by creating a category describing the aspect of the dataset
            that you want to identify. Make sure that the category is
            well-defined (i.e., it is clear to you whether a given text belongs
            to the category or not). In Label Sleuth you will be working one
            category at a time; a design decision that has been made to make the
            data annotation and model building process more efficient. However,
            you may create several categories within a workspace and switch
            between them as needed.
          </p>
        </div>
      ),
    },
    {
      largeTitle: "Data",
      content: (
        <div>
          <p>
            Once you have created a category, you can start annotating the data.
            Annotation is a process that helps the AI model understand how to
            identify your category. The annotation system is binary - positive
            or negative - meaning that the text either matches the category
            definition or not.</p><p>Annotate elements as positive or negative
            examples by clicking on the corresponding icons shown below. Note
            that annotations are not final; if you made a mistake, you can go
            back and edit your annotations as many times as you like.</p><p> In the
            common case, where positive examples in your data are rare (i.e.,
            less than 20% of the text elements are positives), spend more time
            on finding and annotating positive examples, as they are more
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
        </div>
      ),
    },
    {
      largeTitle: "Search",
      content: (
        <div>
          <p>
            You can try to find good examples to annotate by skimming through
            your documents. However, a faster way to find positive examples is
            to search for terms that they contain. While looking at the search
            results, clicking on a text element will bring up the element in the
            document view, allowing you to inspect its surrounding text. You can
            annotate text elements either in the search results or in the
            document view.
          </p>
        </div>
      ),
    },
    {
      largeTitle: "Model Update & Prediction",
      content: (
        <div>
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
          <div style={{ marginTop: "20px" }}>
            <span className="prediction">
              Positive prediction example:
              <div className="element-example" style={{ marginLeft: "15px" }}>
                <div className="predicted-element">
                  <p> I am a text entry that was predicted as positive! </p>
                </div>
              </div>
            </span>
          </div>
        </div>
      ),
    },
    {
      largeTitle: "Label Next",
      content: (
        <div>
          <p>
            Once a first version of the model is available, Label Sleuth will
            start guiding you by suggesting which elements to annotate next.
            Prioritize on annotating the suggested elements, to help improve the
            AI model the most.
          </p>
        </div>
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


  useEffect(() => {
    Array(stages.length).fill().forEach((_,i) => {
      new Image().src = `./assets/v3/stage_${i+1}`
    })
  }, [stages.length])

  const currentStage = stages[stageIndex];

  const handleKeyPress =(event) => {
    if (event.key === "ArrowRight") {
      onPrimaryButtonClickDefault()
    }
    else if (event.key === "ArrowLeft") {
      onSecondaryButtonClickDefault()
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

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
              <div
                style={{
                  marginTop: "5px",
                  marginLeft: "25px",
                  display: "block",
                }}
              >
                <div
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
                </div>
                <SmallTitle>{currentStage.smallTitle || "Tutorial"}</SmallTitle>
                <div style={{
                  display: "flex",
                  flexDirection: "row"
                  }}>
                  <LargeTitle>{currentStage.largeTitle}</LargeTitle>
                  <StageCounter>{`(${stageIndex + 1} of ${stages.length})`}</StageCounter>
                </div>
                <MainContent>{currentStage.content}</MainContent>
              </div>
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
