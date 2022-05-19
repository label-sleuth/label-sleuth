import * as React from 'react';
import '../styles.css'
import RightFixedDrower from './RightFixedDrower';
import RightSlidingDrawer from './RightSlidingDrawer';


const Sidebar = ({ open, setOpen, handleSearchPanelClick }) => {

    const [drawerContent, setDrawerContent] = React.useState("");

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        console.log(`Close`)
        setOpen(false);
    };

    return (
        <>
            <RightFixedDrower
                setDrawerContent={setDrawerContent}
                drawerContent={setDrawerContent}
                handleDrawerOpen={handleDrawerOpen}
            />
            <RightSlidingDrawer
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

