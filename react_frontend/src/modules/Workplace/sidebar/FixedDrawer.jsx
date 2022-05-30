
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import classes from './FixedDrawer.module.css';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import search_icon from '../Asset/search.svg';
import recommend_icon from '../Asset/query-queue.svg'
import { getElementToLabel } from '../DataSlice.jsx';
import { useDispatch } from 'react-redux';


const FixedDrawer = ({ setDrawerContent, handleDrawerOpen }) => {
    const dispatch = useDispatch()

    return (
        <Drawer variant="permanent" anchor="right" PaperProps={{
            sx: {
                minWidth: 50,
            }
        }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: 'center', justifyContent: 'space-between', margin: '5px' }}>
                <Tooltip title='Search all documents (supports regular expressions)' placement="left">
                    <IconButton className={classes.top_nav_icons} onClick={() => {
                        setDrawerContent("search")
                        handleDrawerOpen()
                    }}>
                        <img src={search_icon} alt="search" />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Next to label suggest to label these texts to best assist its learning process' placement="left">
                    <IconButton className={classes.top_nav_icons} onClick={() => {
                        setDrawerContent("rcmd")
                        dispatch(getElementToLabel())
                        handleDrawerOpen()
                    }}>
                        <img src={recommend_icon} alt="recommendation" />
                    </IconButton>
                </Tooltip>
                
                
            </Box>

        </Drawer>

    );
};

export default FixedDrawer;