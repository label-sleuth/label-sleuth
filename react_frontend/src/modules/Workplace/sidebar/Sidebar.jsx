import {useState} from 'react';
import FixedDrawer from './FixedDrawer';
import SlidingDrawer from './SlidingDrawer';
 

const Sidebar = ({ open, setOpen } ) => {

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
            />
            <FixedDrawer
                setDrawerContent={setDrawerContent}
                drawerContent={setDrawerContent}
                handleDrawerOpen={handleDrawerOpen}
            />
        </>
    );
};

export default Sidebar;

