import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import '../styles.css'
import IconButton from '@mui/material/IconButton';
import { getPositiveElementForCategory, fetchPrevDocElements, fetchNextDocElements } from '../DataSlice.jsx';
import Element from "./Element"
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useDispatch, useSelector } from 'react-redux';
import Pagination from '../../../components/pagination/Pagination'
import '../../../components/pagination/pagination.css'
import useMainPagination from './useMainPagination'

let numOfElemPerPage = 4;
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
}));


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
  const { currentContentData, currentPage, setCurrentPage, searchedItemIndex } = useMainPagination(searchedItem, numOfElemPerPage)

  return (
    <>
      <Main className="main_content" open={open}>
        <Box sx={{ display: 'flex', flexDirection:'column',  justifyContent: 'center', mr: 4 }}>
        <Box>
        <TitleBar>
          <IconButton onClick={() => {
            if (workspace.curDocId > 0) {
              dispatch(fetchPrevDocElements()).then(() => dispatch(getPositiveElementForCategory()).then(() => setNumLabel({ pos: workspace.pos_label_num_doc, neg: workspace.neg_label_num_doc })))
            }
          }}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography className="document_name" sx={{ fontSize: 20, textAlign: 'center' }}>
            <Typography variant="h6" component="h6">
              {workspace.curDocName}
            </Typography>
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
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center',  mb: 1  }}>
          <Pagination
            className="pagination-bar"
            currentPage={currentPage}
            totalCount={workspace.elements.length}
            pageSize={numOfElemPerPage}
            onPageChange={page => setCurrentPage(page)}
          />
        </Box>
        <Box>
          {
            currentContentData.map((element, index) =>
              <Element 
                searchedItemIndex={searchedItemIndex}
                numOfElemPerPage ={numOfElemPerPage}
                 key={index} id={'L' + index} keyEventHandler={(e) => handleKeyEvent(e, len_elements)}
                focusedState={workspace.focusedState}
                index={index}
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
        </Box>

      </Main>
    </>
  );
};

export default MainContent;