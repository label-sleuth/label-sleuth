import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { getPositiveElementForCategory, fetchPrevDocElements, fetchNextDocElements } from '../DataSlice.jsx';
import Element from "./Element"
import { useDispatch, useSelector } from 'react-redux';
import Pagination from '../../../components/pagination/Pagination';
import '../../../components/pagination/pagination.css';
import useMainPagination from './useMainPagination';
import classes from './MainContent.module.css';
import left_icon from '../../../assets/workspace/doc_left.svg';
import right_icon from '../../../assets/workspace/doc_right.svg'

const numOfElemPerPage = 500;
const rightDrawerWidth = 360;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    margin: 0,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: rightDrawerWidth,
    }),
  }),
);

const MainContent = ({
  setNumLabel,
  handleKeyEvent,
  numLabelGlobal,
  setNumLabelGlobal,
  numLabel,
  handleClick,
  open,
  searchedItem,
}) => {

  const workspace = useSelector(state => state.workspace)
  const dispatch = useDispatch()
  const len_elements = workspace['elements'].length
  const { currentContentData, currentPage, setCurrentPage, searchedItemIndex, lastPageIndex, firstPageIndex } = useMainPagination(searchedItem, numOfElemPerPage)

  return (
    <>
      <Main className={classes.main_content} open={open}>
        <div className={classes.doc_header}>
          <button className={classes.doc_button} onClick={() => {
            if (workspace.curDocId > 0) {
              dispatch(fetchPrevDocElements()).then(() => dispatch(getPositiveElementForCategory()).then(() => setNumLabel({ pos: workspace.pos_label_num_doc, neg: workspace.neg_label_num_doc })))
            }
          }}><img src={left_icon} />
          </button>
          <div className={classes.doc_stats}>
            <h6>{workspace.curDocName}</h6>
            <em>Text Entries: {workspace.elements.length}</em>
          </div>
          <button className={classes.doc_button} onClick={() => {
            if (workspace.curDocId < workspace.documents.length - 1) {
              dispatch(fetchNextDocElements()).then(() => dispatch(getPositiveElementForCategory()).then(() => setNumLabel({ pos: workspace.pos_label_num_doc, neg: workspace.neg_label_num_doc })))
            }
          }}><img src={right_icon} />
          </button>
        </div>
        <div className={classes.doc_content}>
          <Box>
          </Box>
          <Box>
            {
              currentContentData.map((element, index) =>
                <Element
                  searchedItemIndex={searchedItemIndex}
                  numOfElemPerPage={numOfElemPerPage}
                  key={index+1} id={'L' + index + firstPageIndex+1} keyEventHandler={(e) => handleKeyEvent(e, len_elements)}
                  focusedState={workspace.focusedState}
                  index={index + firstPageIndex+1}
                  numLabelGlobal={numLabelGlobal}
                  numLabelGlobalHandler={setNumLabelGlobal}
                  numLabel={numLabel}
                  numLabelHandler={setNumLabel}
                  clickEventHandler={handleClick}
                  element_id={element['id']}
                  prediction={workspace.predictionForDocCat}
                  text={element['text']}
                />
              )
            }
          </Box>
        </div>
        <div className={classes.pagination}>
          <Pagination
            currentPage={currentPage}
            totalCount={workspace.elements.length}
            pageSize={numOfElemPerPage}
            onPageChange={page => setCurrentPage(page)}
          />
        </div>
      </Main>
    </>
  );
};

export default MainContent;