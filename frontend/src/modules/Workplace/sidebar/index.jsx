import Drawer from '@mui/material/Drawer';
import SearchPanel from './SearchPanel'
import { Box, IconButton, Tooltip } from '@mui/material';
import classes from './index.module.css';
import search_icon from '../Asset/search.svg';
import recommend_icon from '../Asset/query-queue.svg'
import { useSelector } from 'react-redux';
import RecToLabelPanel from './RecToLabelPanel';
import useTogglePanel from './customHooks/useTogglePanel'
import { SEARCH_ALL_DOCS, NEXT_TO_LABEL, SEARCH, RCMD, RIGHT_DRAWER_WIDTH } from '../../../const'
import { PanelManager } from './PanelManager';
import useUpdateLabelState from './customHooks/useUpdateLabelState'

const Sidebar = ({ open, setOpen }) => {

    const { handleDrawerClose, activateSearchPanel, activateRecToLabelPanel } = useTogglePanel(setOpen)
    const { updateSearchLabelState, updateRecLabelState, updateMainLabelState } = useUpdateLabelState()
    const workspace = useSelector(state => state.workspace)
    const activePanel = useSelector(state => state.workspace.activePanel)
    let newSearchLabelState = { ...workspace.searchLabelState }
    let newRecLabelState = { ...workspace.recommendToLabelState }
    const currSearchLabelState = workspace.searchLabelState
    const currRecLabelState = workspace.recommendToLabelState

    return (
        <>
            {/* Sliding drawer    */}
            <Drawer sx={{
                width: RIGHT_DRAWER_WIDTH, flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: RIGHT_DRAWER_WIDTH,
                    boxSizing: 'border-box',
                }
            }}
                PaperProps={{ sx: { backgroundColor: "#f8f9fa !important", right: 50, } }}
                variant="persistent"
                anchor="right"
                open={open}
                onClose={handleDrawerClose}
            >
                <PanelManager  activePanel={activePanel} updateMainLabelState={updateMainLabelState} >
                    {open && activePanel == SEARCH &&
                        <SearchPanel
                            handleDrawerClose={handleDrawerClose}
                            newLabelState={newSearchLabelState}
                            currLabelState={currSearchLabelState}
                            updateLabelState={updateSearchLabelState}
                        />}
                    {activePanel == RCMD &&
                        <RecToLabelPanel
                            handleDrawerClose={handleDrawerClose}
                            newLabelState={newRecLabelState}
                            currLabelState={currRecLabelState}
                            updateLabelState={updateRecLabelState}
                        />}
                </PanelManager>

            </Drawer>

            {/* Fixed drawer    */}
            <Drawer variant="permanent" anchor="right" PaperProps={{ sx: { minWidth: 50, } }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: 'center', justifyContent: 'space-between', margin: '5px' }}>
                    <Tooltip title={SEARCH_ALL_DOCS} placement="left">
                        <IconButton className={classes.top_nav_icons} onClick={activateSearchPanel}>
                            <img src={search_icon} alt="search" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={NEXT_TO_LABEL} placement="left">
                        <IconButton className={classes.top_nav_icons} onClick={activateRecToLabelPanel}>
                            <img src={recommend_icon} alt="recommendation" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Drawer>
        </>
    );
};

export default Sidebar;

