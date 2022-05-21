import {useState} from 'react';
import FixedDrower from './FixedDrawer';
import SlidingDrawer from './SlidingDrawer';


const Sidebar = ({ open, setOpen, handleSearchPanelClick }) => {

    const [drawerContent, setDrawerContent] = useState("");

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    return (
        <>
            <SlidingDrawer
                setDrawerContent={setDrawerContent}
                drawerContent={drawerContent}
                handleDrawerClose={handleDrawerClose}
                open={open}
                setOpen={setOpen}
                handleSearchPanelClick={handleSearchPanelClick}
            />
            <FixedDrower
                setDrawerContent={setDrawerContent}
                drawerContent={setDrawerContent}
                handleDrawerOpen={handleDrawerOpen}
            />
        </>
    );
};

export default Sidebar;

