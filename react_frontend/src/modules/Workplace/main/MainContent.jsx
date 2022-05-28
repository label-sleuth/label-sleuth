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
import CircularProgress from '@mui/material/CircularProgress';

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
  const isCategoryLoaded = useSelector(state => state.workspace.isCategoryLoaded)
  const dispatch = useDispatch()
  const len_elements = workspace['elements'].length
  const { currentContentData, currentPage, setCurrentPage, searchedItemIndex, firstPageIndex } = useMainPagination(searchedItem, numOfElemPerPage)

  const getPosElemForCategory = () => {
    dispatch(getPositiveElementForCategory().then(() =>{
      setNumLabel({ pos: workspace.pos_label_num_doc, neg: workspace.neg_label_num_doc })
    }))
  }

  const handleFetchNextDoc = () =>{
    if (workspace.curDocId < workspace.documents.length - 1) {
      dispatch(fetchNextDocElements()).then(() => {
        getPosElemForCategory()
      })
    }
  }

  const handleFetchPrevDoc = () =>{
    if (workspace.curDocId > 0) {
      dispatch(fetchPrevDocElements()).then(() => {
        getPosElemForCategory()
      })
    }
  }

  return (
    <>
      <Main className={classes.main_content} open={open}>
        <div className={classes.doc_header}>
          <button className={classes.doc_button} onClick={handleFetchPrevDoc}><img src={left_icon} />
          </button>
          {
           (!workspace.curDocName) || (!isCategoryLoaded && workspace.curCategory !=null ) ?  
            <Box>
              <CircularProgress style={{ width: '25px',  height: '25px', color: '#393939'  }} />
            </Box>
            :
          <div className={classes.doc_stats}>
            <h6>{workspace.curDocName}</h6>
            <em>Text Entries: {workspace.elements.length}</em>
          </div>            
          }
          <button className={classes.doc_button} onClick={handleFetchNextDoc}><img src={right_icon} />
          </button>
        </div>
        <div className={classes.doc_content}>
          <Box>
          </Box>
          <Box>
            { 
              isCategoryLoaded && currentContentData.map((element, index) => 
                <Element
                  searchedItemIndex={searchedItemIndex}
                  numOfElemPerPage={numOfElemPerPage}
                  key={index + firstPageIndex} 
                  id={'L' + index + firstPageIndex} 
                  keyEventHandler={(e) => handleKeyEvent(e, len_elements)}
                  focusedState={workspace.focusedState}
                  index={index +  firstPageIndex}
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