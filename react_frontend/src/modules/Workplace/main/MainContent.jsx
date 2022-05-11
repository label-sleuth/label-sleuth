import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import '../styles.css'
import IconButton from '@mui/material/IconButton';
import { getPositiveElementForCategory,  fetchPrevDocElements, fetchNextDocElements } from '../DataSlice.jsx';
import Element from "./Element"
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useDispatch, useSelector } from 'react-redux';

const rightDrawerWidth = 360;


const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginRight: 0,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: rightDrawerWidth,
    }),
  }),
);

const TitleBar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 0),
  marginBottom: 10
  // necessary for content to be below app bar
  // ...theme.mixins.toolbar,
}));


const MainContent = ({setNumLabel, handleKeyEvent, numLabelGlobal, setNumLabelGlobal, numLabel, handleClick, open}) => {
 
  const workspace = useSelector(state => state.workspace)
  const dispatch = useDispatch()

    return (
        <Main className="main_content" open={open}>
          <TitleBar>
            <IconButton onClick={() => {
              if (workspace.curDocId > 0) {
                // setNumLabel({pos: 0, neg: 0})
                dispatch(fetchPrevDocElements()).then(() => dispatch(getPositiveElementForCategory()).then(() => setNumLabel({ pos: workspace.pos_label_num_doc, neg: workspace.neg_label_num_doc })))
              }
            }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography className="document_name" sx={{ fontSize: 20, textAlign: 'center' }}>
              <h4>
                {workspace.curDocName}
              </h4>
              <em>File type: PDF | Text Entries: {workspace.elements.length}</em>
            </Typography>
            <IconButton onClick={() => {
              if (workspace.curDocId < workspace.documents.length - 1) {
                dispatch(fetchNextDocElements()).then(() => dispatch(getPositiveElementForCategory()).then(() => setNumLabel({ pos: workspace.pos_label_num_doc, neg: workspace.neg_label_num_doc })))
              }
            }}>
              <ChevronRightIcon />
            </IconButton>
          </TitleBar>
          <Box>
            {
              workspace['elements'].length > 0 && workspace['elements'].map((element, index) => {
                const len_elements = workspace['elements'].length
                return (
                <Element key={index} id={'L' + index} keyEventHandler={(e) => handleKeyEvent(e, len_elements)} 
                focusedState={workspace.focusedState}
                 index={index}
                  numLabelGlobal={numLabelGlobal}
                   numLabelGlobalHandler={setNumLabelGlobal}
                    numLabel={numLabel}
                     numLabelHandler={setNumLabel}
                      clickEventHandler={handleClick}
                       element_id={element['id']}
                        prediction={workspace.predictionForDocCat}
                         text={element['text']} />)
              })
            }
          </Box>
        </Main>
    );
};

export default MainContent;