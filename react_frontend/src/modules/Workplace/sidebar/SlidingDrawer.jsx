import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SearchPanel from './SearchPanel'
import { InputBase, Paper } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import classes from './SearchPanel.module.css';
import useSearchLabelState from './customHooks/useSearchLabelState.js';
import useSearchElement from './customHooks/useSearchElement'
import { useSelector } from 'react-redux';

const SlidingDrawer = ({ open, drawerContent, handleDrawerClose }) => {

    const rightDrawerWidth = 360;
    const workspace = useSelector(state => state.workspace)
    const { handlePosLabelState, handleNegLabelState } = useSearchLabelState()
    const { handleSearchPanelClick, handleSearch, clearSearchInput, handleSearchInputChange, textInput, searchInput} = useSearchElement()

    return (
        <Drawer
            sx={{
                width: rightDrawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: rightDrawerWidth,
                    boxSizing: 'border-box',
                }
            }}
            PaperProps={{
                sx: {
                    backgroundColor: "#f8f9fa !important",
                    right: 50,
                }
            }}
            variant="persistent"
            anchor="right"
            open={open}
            onClose={handleDrawerClose}
        >
            {
                open && drawerContent == 'search' &&

                <Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItem: 'center', marginTop: 3, borderBottom: "1px solid #e2e2e2", pb: 2 }} >
                        <IconButton onClick={handleDrawerClose}>
                            <ChevronLeftIcon />
                        </IconButton>
                        <Paper
                            component="form"
                            sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 280, height: 40, marginLeft: 1 }}
                        >
                            <InputBase
                                sx={{ ml: 1, flex: 1 }}

                                placeholder="Search"
                                inputProps={{ 'aria-label': 'search' }}
                                onKeyPress={(ev) => {
                                    if (ev && ev.key) {
                                        if (ev.key === 'Enter') {
                                            handleSearch()
                                            ev.preventDefault();
                                        }
                                    }
                                }}
                                onChange={handleSearchInputChange}
                                inputRef={textInput}
                            />
                            {searchInput &&
                                <>
                                    <IconButton sx={{ p: '10px' }} aria-label="search" onClick={clearSearchInput} >
                                        <ClearIcon />
                                    </IconButton>
                                    {<IconButton sx={{ p: '10px' }} aria-label="search" onClick={handleSearch} >
                                        <SearchIcon />
                                    </IconButton>}
                                </>
                            }
                        </Paper>
                    </Box>
                    <Box className={classes["search-results"]} >
                        {
                            workspace.searchResult.map((res, i) => {
                                return (
                                    <SearchPanel
                                        key={i}
                                        searchedIndex={i}
                                        prediction={res.model_predictions[workspace.curCategory]}
                                        text={res.text}
                                        searchInput={searchInput}
                                        id={res.id}
                                        docid={res.docid}
                                        labelValue={res.user_labels[workspace.curCategory]}
                                        handleSearchPanelClick={handleSearchPanelClick}
                                        handlePosLabelState={handlePosLabelState}
                                        handleNegLabelState={handleNegLabelState}
                                    />
                                )
                            })
                        }
                    </Box>

                </Box>
            }
            {
                drawerContent == 'rcmd' &&
                <Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItem: 'center', marginTop: 3, borderBottom: "1px solid #e2e2e2", pb: 2 }} >
                        <IconButton onClick={handleDrawerClose} style={{
                            background: 'none',
                            borderRadius: 0
                        }}>
                            <ChevronLeftIcon />
                        </IconButton>
                        <p style={{ width: '100%', textAlign: "center", marginRight: "20px" }}><strong>Recommend to label</strong></p>
                    </Box>

                    <Box className={classes["search-results"]} >
                        {workspace.elementsToLabel.map((res, i) => {
                            return (
                                <SearchPanel
                                    key={i}
                                    searchedIndex={i}
                                    prediction={res.model_predictions[workspace.curCategory]}
                                    text={res.text}
                                    searchInput={searchInput}
                                    id={res.id}
                                    docid={res.docid}
                                    labelValue={res.user_labels[workspace.curCategory]}
                                    handleSearchPanelClick={handleSearchPanelClick}
                                    handlePosLabelState={handlePosLabelState}
                                    handleNegLabelState={handleNegLabelState}
                                />
                            )
                        })}
                    </Box>
                </Box>
            }
        </Drawer>
    );
};

export default SlidingDrawer;

