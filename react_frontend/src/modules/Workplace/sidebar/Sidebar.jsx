import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import '../styles.css'
import IconButton from '@mui/material/IconButton';
import { useDispatch, useSelector } from 'react-redux';
import search_icon from '../Asset/search.svg';
import recommend_icon from '../Asset/query-queue.svg'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SearchBar from "material-ui-search-bar";
import { getElementToLabel, searchKeywords } from '../DataSlice.jsx';
import SearchPanel from '../sidebar/SearchPanel'
import { InputBase, Paper } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

const Sidebar = ({ open, setOpen }) => {

    const [drawerContent, setDrawerContent] = React.useState("");
    const dispatch = useDispatch()
    const [searchInput, setSearchInput] = React.useState("");
    const workspace = useSelector(state => state.workspace)
    const [numLabel, setNumLabel] = React.useState({ pos: 0, neg: 0 })
    const [numLabelGlobal, setNumLabelGlobal] = React.useState({ pos: workspace.pos_label_num, neg: workspace.neg_label_num })
    const rightDrawerWidth = 360;

    React.useEffect(()=>{
        setDrawerContent("search")
        handleDrawerOpen()
    },[])

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        console.log(`Close`)
        setOpen(false);
    };

    const handleSearch = (e) => {
        dispatch(searchKeywords({ keyword: searchInput }))
    }

    const clearSearch = () => {
        textInput.current.value = "";
    }

    const handleChange = (event) => {
        setSearchInput(event.target.value)
    }

    const textInput = React.useRef(null);

    return (
        <>
            <Drawer variant="permanent" anchor="right" PaperProps={{
                sx: {
                    minWidth: 50,
                }
            }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: 'center', justifyContent: 'space-between', margin: '5px' }}>
                    <IconButton className="top_nav_icons" onClick={() => {
                        setDrawerContent("search")
                        handleDrawerOpen()
                    }}>
                        <img src={search_icon} alt="search" />
                    </IconButton>
                    <IconButton className="top_nav_icons" onClick={() => {
                        setDrawerContent("rcmd")
                        dispatch(getElementToLabel())
                        handleDrawerOpen()
                    }}>
                        <img src={recommend_icon} alt="recommendation" />
                    </IconButton>
                </Box>
            </Drawer>
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
                        right: 50
                    }
                }}
                variant="persistent"
                anchor="right"
                open={open}
                // variant="permanent"
                onClose={handleDrawerClose}
            >
                {
                    open && drawerContent == 'search' &&

                    <Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItem: 'center', marginTop: 3 }} >
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
                                        if (ev.key === 'Enter') {
                                            handleSearch()
                                            ev.preventDefault();
                                        }
                                    }}
                                    onChange={handleChange}
                                    inputRef={textInput}
                                />
                                {searchInput && textInput.current.value &&
                                    <>
                                        <IconButton sx={{ p: '10px' }} aria-label="search" onClick={clearSearch} >
                                            <ClearIcon />
                                        </IconButton>
                                        {<IconButton sx={{ p: '10px' }} aria-label="search" onClick={handleSearch} >
                                            <SearchIcon />
                                        </IconButton>}
                                    </>


                                }
                            </Paper>
                        </Box>
                        {
                            workspace.searchResult.map((r) => {
                                return (
                                    <SearchPanel numLabelGlobal={numLabelGlobal} numLabelGlobalHandler={setNumLabelGlobal} numLabel={numLabel} prediction={r.model_predictions.length > 0 ? r.model_predictions[Object.keys(r.model_predictions)[Object.keys(r.model_predictions).length - 1]] : null} element_id={r.id} numLabelHandler={setNumLabel} text={r.text} searchInput={searchInput} docid={r.docid} id={r.id} />
                                )
                            })
                        }
                    </Box>
                }
                {
                    drawerContent == 'rcmd' &&
                    <Box>
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItem: 'center', marginTop: 3 }} >
                            <IconButton onClick={handleDrawerClose}>
                                <ChevronLeftIcon />
                            </IconButton>
                            <p style={{ width: '100%', textAlign: "center", marginRight: "20px" }}><strong>Recommend to label</strong></p>
                        </Box>

                        <Box>
                            {workspace.elementsToLabel.map((r) => {
                                return (
                                    <SearchPanel numLabelGlobal={numLabelGlobal} numLabelGlobalHandler={setNumLabelGlobal} numLabel={numLabel} prediction={r.model_predictions[workspace.curCategory]} element_id={r.id} numLabelHandler={setNumLabel} text={r.text} searchInput={searchInput} docid={r.docid} id={r.id} />
                                )
                            })}
                        </Box>
                    </Box>
                }
            </Drawer>
        </>
    );
};

export default Sidebar;

