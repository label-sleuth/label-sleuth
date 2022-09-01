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

import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Element from "./Element"
import { useDispatch, useSelector } from 'react-redux';
import Pagination from '../../../components/pagination/Pagination';
import '../../../components/pagination/pagination.css';
import useMainPagination from './customHooks/useMainPagination';
import classes from './MainPanel.module.css';
import left_icon from '../../../assets/workspace/doc_left.svg';
import right_icon from '../../../assets/workspace/doc_right.svg'
import useFetchPrevNextDoc from './customHooks/useFetchPrevNextDoc'
import Tooltip from '@mui/material/Tooltip';
import { PREV_DOC_TOOLTIP_MSG, NEXT_DOC_TOOLTIP_MSG, panelIds } from '../../../const';
import { getMainPanelElementId } from '../../../utils/utils';
import { fetchElements } from '../redux/DataSlice';
import useScrollMainPanelElementIntoView from '../sidebar/customHooks/useScrollElementIntoView';

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


const MainPanel = ({ handleKeyEvent, open }) => {

  const curDocName = useSelector(state => state.workspace.curDocName)
  const curDocId = useSelector(state => state.workspace.curDocId)
  const documents = useSelector(state => state.workspace.documents)
  const elements = useSelector(state => state.workspace.panels[panelIds.MAIN_PANEL].elements)
  const loading = useSelector(state => state.workspace.panels.loading[panelIds.MAIN_PANEL])
  const isDocLoaded = useSelector(state => state.workspace.isDocLoaded)
  const curCategory = useSelector(state => state.workspace.curCategory)
  const modelVersion = useSelector(state => state.workspace.modelVersion)

  const dispatch = useDispatch()

  const { currentContentData, currentPage, setCurrentPage, firstPageIndex } = useMainPagination(numOfElemPerPage)
  const { handleFetchNextDoc, handleFetchPrevDoc } = useFetchPrevNextDoc()

  React.useEffect(() => {
    if (isDocLoaded && elements === null) {
      dispatch(fetchElements())
    }
  }, [isDocLoaded, elements, dispatch])

  React.useEffect(() => {
    // elements has to be re-fetched when the category changes
    if (isDocLoaded) {
      dispatch(fetchElements())
    }
  }, [isDocLoaded, curCategory, modelVersion, dispatch])

  React.useEffect(() => {
    if (isDocLoaded && !loading) {
      setCurrentPage(1)
    }
  }, [setCurrentPage, loading, isDocLoaded])

  useScrollMainPanelElementIntoView();

  return (
    <>
      <Main className={classes.main_content} open={open}>
        <div className={classes.doc_header}>
          <Tooltip title={curDocId !== 0 ? PREV_DOC_TOOLTIP_MSG : ""}
            placement="right"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: curDocId !== 0 ? 'common.black' : "transparent",
                },
              },
            }}
          >
            <button className={curDocId === 0 ? classes["doc_button_disabled"] : classes["doc_button"]} onClick={handleFetchPrevDoc}>
              <img src={left_icon} alt={"previous document"}/>
            </button>
          </Tooltip>
          <div className={classes.doc_stats}>
            <h6>{curDocName}</h6>
            <em>Text Entries: {elements ? Object.keys(elements).length : 0}</em>
          </div>
          <Tooltip title={documents.length - 1 !== curDocId ? NEXT_DOC_TOOLTIP_MSG : ""}
            placement="left"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: documents.length - 1 !== curDocId ? 'common.black' : "transparent",
                },
              },
            }}
          >
            <button className={documents.length - 1 === curDocId ? classes["doc_button_disabled"] : classes["doc_button"]} onClick={handleFetchNextDoc}>
              <img src={right_icon} alt={"next document"} />
            </button>
          </Tooltip>
        </div>
        <div className={classes.doc_content}>
          <Box>
          </Box>
          <Box id="main-element-view">
            {
              currentContentData && currentContentData.map((element) =>
                <Element
                  keyEventHandler={(e) => handleKeyEvent(e, Object.keys(elements).length)}
                  element={element}  
                  key={getMainPanelElementId(element.id)}
                />
              )
            }
          </Box>
        </div>
        <div className={classes.pagination}>
          <Pagination
            currentPage={currentPage}
            totalCount={elements ? Object.values(elements).length : 0}
            pageSize={numOfElemPerPage}
            onPageChange={page => setCurrentPage(page)}
          />
        </div>
      </Main>
    </>
  );
};

export default MainPanel;