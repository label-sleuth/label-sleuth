import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import '../styles.css'
import IconButton from '@mui/material/IconButton';
import search_icon from '../Asset/search.svg';
import recommend_icon from '../Asset/query-queue.svg'
import { getElementToLabel } from '../DataSlice.jsx';
import { useDispatch } from 'react-redux';


const RightFixedDrower = ({ setDrawerContent, handleDrawerOpen }) => {
    const dispatch = useDispatch()

    return (
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

    );
};

export default RightFixedDrower;