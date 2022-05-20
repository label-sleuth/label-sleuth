import {useState} from 'react';
import '../styles.css'
import FixedDrower from './FixedDrawer';
import SlidingDrawer from './SlidingDrawer';


const Sidebar = ({ open, setOpen, handleSearchPanelClick }) => {

    const [drawerContent, setDrawerContent] = useState("");

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        console.log(`Close`)
        setOpen(false);
    };

    return (
        <>
            <FixedDrower
                setDrawerContent={setDrawerContent}
                drawerContent={setDrawerContent}
                handleDrawerOpen={handleDrawerOpen}
            />
            <SlidingDrawer
                setDrawerContent={setDrawerContent}
                drawerContent={drawerContent}
                handleDrawerClose={handleDrawerClose}
                open={open}
                setOpen={setOpen}
                handleSearchPanelClick={handleSearchPanelClick}
            />
        </>
    );
};

export default Sidebar;

