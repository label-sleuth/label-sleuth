import { Modal, Stack } from "@mui/material";
import {
  SmallTitle,
  LargeTitle,
  MainContent,
  PrimaryButton,
  SecondaryButton,
  ModalContent,
  getTutorialModal
} from "./components";
import { useState, useEffect } from "react";
import "./index.css";
import check from './assets/check.svg'
import cross from './assets/cross.svg'
import Arrow from "./Arrow";

const Tutorial = ({ tutorialOpen, setTutorialOpen }) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (tutorialOpen) {
      setStageIndex(0)
    }
  }, [tutorialOpen])


  useEffect(() => {
    getTutorialModal(stageIndex)
  }, [stageIndex])


  // default primary   button on click action
  const onNext = () => {
    if (stageIndex === stages.length - 1) {
      setStageIndex(0);
    } else {
      setStageIndex(stageIndex + 1);
    }
  };

  // default secondary button on click action
  const onSkip = () => {
    setTutorialOpen(false)
  }

  const stages = [
    {
      title: "What is Label Sleuth?",
      content: (
        <div>
          Data is the new oil of the digital era - when it is processed,
          analyzed and utilized efficiently and instantly, it will have a much
          greater value. Sleuth (System for Learning to Understand Text with
          Human-in-the-loop) aims to simplify and accelerate the generation of
          language models by bringing the human into the loop. Our solution will
          leverage, combine and further enhance the SOTA of various NLP models,
          and human-in-the-loop approaches, with the goal of creating a unified
          system for developing NLP algorithms with SMEs (Subject Matter
          Experts). Sleuth is an open source project from IBM Research.
        </div>
      ),
    },
    {
      title: "Category",
      content: (
        <div className="stage-content">
          <p>
            Text classification is one of the fundamental natural language
            processing (NLP) challenges. With category classification, you can
            identify text entries with tags to be used for things like:
            Sentiment analysis. Spam detection. Start by creating your own
            category, or choose an existing one.
          </p>
        </div>
      ),
    },
    {
      title: "Data",
      content: (
        <div>
          <p>
            You can start labeling the data now! Labeling is a process that
            helps the AI model to understanding the criteria to your category.
            Assign a label to each of your data entry based on your category.
            The label system is binary - positive and negative. You can go back
            and edit your labels as many times as you’d like.
          </p>
          <div style={{ marginLeft: "35px" }}>
            <span className="positive-label"><img src={check}/>Positive - it maches</span>
            <span className="negative-label"><img src={cross}/>Negative</span>
          </div>
        </div>
      ),
    },
    {
      title: "Search",
      content: (
        <div>
          <p>
            You can search by keywords if you are looking for anything specific.
            Give search a try!
          </p>
        </div>
      ),
    },
    {
      title: "Model Update & Prediction",
      content: (
        <div>
          <p>
            The AI model will be updated every 5 labels. You can track your
            model version and progress on the left.
          </p>
          <p>
            Whenever the model finishes updating, a confetti will appear! It
            tells you that there is now a new model.
          </p>
          <p>
            Additionally, the model will also make predictions and mark
            recommend to label text entries in your dataset. You can use these
            as guides to accelerate and fine-tune your model.
          </p>
          <div style={{ marginLeft: "35px", marginTop: "20px  " }}>
            <span className="prediction"><div className="prediction-square"/>Recommend to Label</span>
          </div>
        </div>
      ),
    },
    {
      title: "Recommended to label",
      content: (
        <div>
          <p>
            Here, you can see a list of recommend to label text entires on the
            right. Prioritize on labeling these will help improve the model
            classification result.
          </p>
        </div>
      ),
    },
    {
      smallTitle: "Tutorial completed",
      title: "That’s all! If you need to revisit the tutorial, go to the top left of the screen and click on",
      content: null,
      primaryButtonTitle: "Start labeling",
      onPrimaryButtonClick: () => setTutorialOpen(false),
      secondaryButtonTitle: "Restart from beginning",
      onSecondaryButtonClick: () => setStageIndex(0)
    }
  ];

  const currentStage = stages[stageIndex];

  const TutorialModal = getTutorialModal(stageIndex)

  return (
    <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} className='modal-background'>
      <ModalContent>
        <Arrow tutorialStageIndex={stageIndex}/>
        <div
          style={{ marginTop: "25px", marginLeft: "25px", display: "block" }}
        >
          <SmallTitle>{currentStage.smallTitle || "Tutorial"}</SmallTitle>
          <LargeTitle>{currentStage.title}</LargeTitle>
          <MainContent>{currentStage.content}</MainContent>
        </div>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-end"
          spacing={0}
          style={{ width: "100%", flex: "none", order: 1, flexGrow: 0 }}
        >
          <SecondaryButton onClick={currentStage.onSecondaryButtonClick || onSkip}>{currentStage.secondaryButtonTitle || 'Skip'}</SecondaryButton>
          <PrimaryButton onClick={currentStage.onPrimaryButtonClick || onNext}>{currentStage.primaryButtonTitle || 'Next'}</PrimaryButton>
        </Stack>
      </ModalContent>
    </TutorialModal>
  );
};

export default Tutorial;
