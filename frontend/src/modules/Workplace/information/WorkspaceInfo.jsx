import * as React from 'react';
import { useCallback, useRef } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import sleuth_logo from '../Asset/sleuth_logo.png';
import info_icon from '../../../assets/workspace/help.svg';
import logout_icon from '../../../assets/workspace/logout.svg';
import workspace_icon from '../../../assets/workspace/change_catalog.svg';
import LinearWithValueLabel from './ModelProgressBar'
import { useDispatch, useSelector } from 'react-redux';
import { fetchElements, downloadLabeling, getElementToLabel, checkStatus, fetchCategories, getPositiveElementForCategory, checkModelUpdate, fetchDocuments, setWorkspaceId } from '../DataSlice.jsx';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import useLogOut from '../../../customHooks/useLogOut';
import { useNavigate } from 'react-router-dom';
import classes from './WorkspaceInfo.module.css';
import { APP_NAME, WORKSPACE_CONFIG_PATH } from '../../../config';

const drawerWidth = 280; // left navigation panel width

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 2),
    ...theme.mixins.toolbar,
}));

const Divider = styled('div')(() => ({
    borderTop: 'solid 1px #393939'
}))

const StatsContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    justifyContent: 'space-between',
    paddingTop: theme.spacing(1),
}));

const AccountInfo = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2, 2),
}));

const ModelName = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: "row",
    alignItems: 'start',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
}));

const StackBarContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    margin: theme.spacing(0, 0),
    padding: theme.spacing(0, 2),
}));

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}
 

export default function Workspace({workspaceId}) {
    const navigate = useNavigate()
    const theme = useTheme();
    const { logout } = useLogOut()
    const workspace = useSelector(state => state.workspace)
    const [tabValue, setTabValue] = React.useState(0);
    const [tabStatus, setTabStatus] = React.useState(0)
    const refAnimationInstance = useRef(null);
    
    React.useEffect(()=>{
        if(workspaceId){
            dispatch(setWorkspaceId(workspaceId))
        } 
      },[workspaceId])
      
    const getInstance = useCallback((instance) => {
        refAnimationInstance.current = instance;
    }, []);

    const makeShot = useCallback((particleRatio, opts) => {
        refAnimationInstance.current &&
            refAnimationInstance.current({
                ...opts,
                origin: { y: 0.7 },
                particleCount: Math.floor(100 * particleRatio),
                colors: ["#BE3092", "#166CFF", "#8ECCF3", "#88A8FB"]
            });
    }, []);

    const fire = useCallback(() => {

        makeShot(0.25, {
            spread: 26,
            startVelocity: 55
        });

        makeShot(0.2, {
            spread: 60
        });

        makeShot(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8
        });

        makeShot(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2
        });

        makeShot(0.1, {
            spread: 120,
            startVelocity: 45
        });
    }, [makeShot]);

    const dispatch = useDispatch();

    React.useEffect(() => {

        dispatch(fetchDocuments()).then(() => dispatch(fetchElements()).then(() => dispatch(fetchCategories()).then(() => {
            dispatch(checkStatus()).then(() => {
                dispatch(getElementToLabel()).then(() => {

                })
            })
        })))

        const interval = setInterval(() => {

            console.log(`curCategory value: ${workspace.curCategory}`)

            if (workspace.curCategory != null) {
                dispatch(checkModelUpdate()).then(() => {
                })
            } else {
            }

        }, 5000);

        return () => clearInterval(interval);

    }, [workspace.curCategory])

    React.useEffect(() => {

        console.log(`model updated, data retrieved, model version: ${workspace.model_version}`)
        if (workspace.model_version > 0) {
            fire();
        }

        dispatch(getPositiveElementForCategory()).then(() => dispatch(getElementToLabel()))

    }, [workspace.model_version])


    const handleChange = (event, newValue) => {
        setTabValue(newValue);
        setTabStatus(newValue)
    };

    // placeholder for finding documents stats
    let doc_stats = {
        pos: Object.values(workspace.labelState).filter(function (d) { return d == 'pos' }).length,
        neg: Object.values(workspace.labelState).filter(function (d) { return d == 'neg' }).length,
        total: workspace.elements.length
    };

    // placeholder for finding workspace  stats
    let workspace_stats = {
        pos: workspace.pos_label_num,
        neg: workspace.neg_label_num,
        total: workspace.documents.length * 10
    };

    const open_introSlides = function () {
        console.log("this is where the tutorial starts");
        // document.getElementById("presentation").style.display = "flex";
    };

    return (
        <>
            {/* <Presentation /> */}
            <Box style={{
                backgroundColor: '#161616',
                width: drawerWidth,
                height: '100vh'
            }}>
                <ReactCanvasConfetti refConfetti={getInstance} className={classes.confetti_canvas} />
                <Drawer
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            color: '#fff',
                            zIndex: '10000',
                            background: 'transparent'
                        },
                    }}
                    variant="permanent"
                    // open={open}
                    anchor="left">

                    <DrawerHeader>
                        <h2 className={classes.sleuth_title}>
                            <img src={sleuth_logo} className={classes.sleuthlogo} alt="Sleuth Logo" />
                            {APP_NAME}
                            <img onClick={open_introSlides} src={info_icon} className={classes.moreinfo} alt="Open Tutorial"/>
                        </h2>
                        <img onClick={logout} className={classes.logout} src={logout_icon}/> 
                    </DrawerHeader>

                    <p className={classes.sleuth_desc}>A tool that allows humans to work effectively with partial-automation ML models, making data annotation more efficient and more effective in the NLP domain.</p>
                    
                    <Divider />
                    
                    <DrawerHeader style={{padding: '12px 16px', alignItems: 'flex-end'}}>
                        <div className={classes.account_info}>
                            <label>User ID</label>
                            <p><b>{localStorage.username}</b></p>
                            <label>Workspace</label>
                            <p><b>{workspaceId}</b></p>
                        </div>
                        <img onClick={()=>{navigate(WORKSPACE_CONFIG_PATH)}} className={classes.workspace_nav} src={workspace_icon} alt="Change to Another Workspace" style={{marginBottom: '10px'}}/> 
                    </DrawerHeader>
                    
                    <Divider />
                    {workspace.curCategory ? 
                    
                    <Stack style={{paddingTop: '12px'}}>
                        <Box sx={{ width: '100%', padding: theme.spacing(0, 2) }}>
                            <Box sx={{ borderBottom: 1, borderColor: '#393939' }}>
                                <Tabs
                                    className={classes.tabroot}
                                    value={tabValue}
                                    onChange={handleChange}
                                    aria-label="workspace toggle tab"
                                    variant="fullWidth">
                                    <Tab label="Workspace" {...a11yProps(0)} className={classes.tabs}/>
                                    <Tab label="Document" {...a11yProps(1)} className={classes.tabs}/>
                                </Tabs>
                            </Box>
                            <TabPanel className={classes.entries_tab} value={tabValue} index={0} onClick={() => {
                                setTabStatus('workspace')
                            }}>
                                <Stack spacing={0}>
                                    <label style={{fontSize: '12px', opacity: 0.5}}>Labeled for Entire Workspace:</label>
                                    <StatsContainer>
                                        <Typography><strong>Positive</strong></Typography>
                                        <Typography sx={{ color: workspace_stats.pos > 0 ? "#8ccad9" : "#fff" }}><strong>{workspace_stats.pos}</strong></Typography>
                                    </StatsContainer>
                                    <StatsContainer>
                                        <Typography><strong>Negative</strong></Typography>
                                        <Typography sx={{ color: workspace_stats.neg > 0 ? "#ff758f" : "#fff" }}><strong>{workspace_stats.neg}</strong></Typography>
                                    </StatsContainer>
                                    <StatsContainer>
                                        <Typography><strong>Total</strong></Typography>
                                        <Typography><strong>{workspace_stats.pos + workspace_stats.neg}</strong></Typography>
                                    </StatsContainer>
                                </Stack>
                            </TabPanel>
                            <TabPanel className={classes.entries_tab} value={tabValue} index={1} onClick={() => {
                                console.log(`tab document`)
                                setTabStatus('document')
                            }}>
                                <Stack spacing={0}>
                                    <label style={{fontSize: '12px', opacity: 0.5}}>Labeled for Current Doc:</label>
                                    <StatsContainer>
                                        <Typography><strong>Positive</strong></Typography>
                                        <Typography sx={{ color: doc_stats.pos > 0 ? "#8ccad9" : "#fff" }}><strong>{doc_stats.pos}</strong></Typography>
                                    </StatsContainer>
                                    <StatsContainer>
                                        <Typography><strong>Negative</strong></Typography>
                                        <Typography sx={{ color: doc_stats.neg > 0 ? "#ff758f" : "#fff" }}><strong>{doc_stats.neg}</strong></Typography>
                                    </StatsContainer>
                                    <StatsContainer>
                                        <Typography><strong>Total</strong></Typography>
                                        <Typography><strong>{doc_stats.pos + doc_stats.neg}</strong></Typography>
                                    </StatsContainer>
                                </Stack>
                            </TabPanel>
                        </Box>
                        <ModelName>
                            <Typography>Current Model:</Typography>
                            {
                                workspace.model_version > -1 ? <Typography><strong>v.{workspace.model_version}_Model</strong></Typography>
                                    : <Typography><strong>None</strong></Typography>
                            }
                        </ModelName>
                        <LinearWithValueLabel />
                        <div className={classes.modelStatus}>{workspace['modelStatus']}</div>
                        <Button sx={{ marginTop: 3 }} onClick={() => dispatch(downloadLabeling())}> Download Data </Button>
                    </Stack>

                    : null}
                </Drawer>
            </Box>
        </>

    );
}

