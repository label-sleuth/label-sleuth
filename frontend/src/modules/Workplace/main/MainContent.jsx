import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Element from "./Element"
import { useSelector } from 'react-redux';
import Pagination from '../../../components/pagination/Pagination';
import '../../../components/pagination/pagination.css';
import useMainPagination from './customHooks/useMainPagination';
import classes from './MainContent.module.css';
import left_icon from '../../../assets/workspace/doc_left.svg';
import right_icon from '../../../assets/workspace/doc_right.svg'
import useFetchPrevNextDoc from './customHooks/useFetchPrevNextDoc'
import Tooltip from '@mui/material/Tooltip';
import { PREV_DOC_TOOLTIP_MSG, NEXT_DOC_TOOLTIP_MSG } from '../../../const';

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


const MainContent = ({ handleKeyEvent, open }) => {

  const workspace = useSelector(state => state.workspace)
  const isCategoryLoaded = useSelector(state => state.workspace.isCategoryLoaded)
  const searchedIndex = useSelector(state => state.workspace.searchedIndex)
  const len_elements = workspace['elements'].length
  const { currentContentData, currentPage, setCurrentPage, firstPageIndex } = useMainPagination(searchedIndex, numOfElemPerPage)
  const {handleFetchNextDoc, handleFetchPrevDoc} = useFetchPrevNextDoc()

  React.useEffect(() => {
    if (isCategoryLoaded) {
      setCurrentPage(1)
    }
  }, [setCurrentPage, isCategoryLoaded])


  return (
    <>
      <Main className={classes.main_content} open={open}>
        <div className={classes.doc_header}>
        <Tooltip title={PREV_DOC_TOOLTIP_MSG} placement="right">
            <button className={classes.doc_button} onClick={handleFetchPrevDoc}>
              <img src={left_icon} />
            </button>
          </Tooltip>
            <div className={classes.doc_stats}>
              <h6>{workspace.curDocName}</h6>
              <em>Text Entries: {workspace.elements.length}</em>
            </div>
          <Tooltip title={NEXT_DOC_TOOLTIP_MSG} placement="left">
            <button className={classes.doc_button} onClick={handleFetchNextDoc}>
              <img src={right_icon} />
            </button>
          </Tooltip>
        </div>
        <div className={classes.doc_content}>
          <Box>
          </Box>
          <Box>
            {
              isCategoryLoaded && currentContentData.map((element, index) =>
                <Element
                  searchedIndex={searchedIndex}
                  numOfElemPerPage={numOfElemPerPage}
                  key={index + firstPageIndex}
                  keyEventHandler={(e) => handleKeyEvent(e, len_elements)}
                  focusedState={workspace.focusedState}
                  index={index + firstPageIndex}
                  element_id={element.id}
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