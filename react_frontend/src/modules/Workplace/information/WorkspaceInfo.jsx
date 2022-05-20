import * as React from 'react';
import { useCallback, useRef } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import '../styles.css'
import sleuth_logo from '../Asset/sleuth_logo.png';
import info_icon from '../Asset/help.svg'
import Divider from '@mui/material/Divider';
import LinearWithValueLabel from './ModelProgressBar'
import IconButton from '@mui/material/IconButton';
import { useDispatch, useSelector } from 'react-redux';
import { fetchElements, downloadLabeling, getElementToLabel, checkStatus, fetchCategories, getPositiveElementForCategory, checkModelUpdate, fetchDocuments, setWorkspace } from '../DataSlice.jsx';
import Stack from '@mui/material/Stack';
import HSBar from "react-horizontal-stacked-bar-chart";
import { makeStyles } from '@mui/styles';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import LogoutIcon from '@mui/icons-material/Logout';
import useLogOut from '../../../customHooks/useLogOut';
import Presentation from './Presentation';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';
import { useNavigate } from 'react-router-dom';


const drawerWidth = 280;

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 2),
    ...theme.mixins.toolbar,
}));

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

    const [numLabel, setNumLabel] = React.useState({ pos: 0, neg: 0 })
    const [tabValue, setTabValue] = React.useState(0);
    const [tabStatus, setTabStatus] = React.useState(0)
    const [numLabelGlobal, setNumLabelGlobal] = React.useState({ pos: workspace.pos_label_num, neg: workspace.neg_label_num })
    const refAnimationInstance = useRef(null);
    

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
        setNumLabelGlobal({ pos: workspace.pos_label_num, neg: workspace.neg_label_num })
    }, [workspace.pos_label_num])

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

    // placeholder for finding total stats
    let total_stats = {
        pos: numLabel.pos,
        neg: numLabel.neg,
        total: workspace.documents.length * 10
    };

    const open_introSlides = function () {
        document.getElementById("presentation").style.display = "flex";
    }

    return (
        <>
            <Presentation />
            <Box className="left_nav" sx={{
                backgroundColor: '#161616',
                width: drawerWidth,
                height: '100vh'
            }}>
                <ReactCanvasConfetti refConfetti={getInstance} className="confetti_canvas" />
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
                        <h2><img className="sleuth_logo" src={sleuth_logo} alt="temporary sleuth logo" />Sleuth<span className="moreinfo" onClick={open_introSlides}><img src={info_icon} alt="more info" /></span></h2>
                        <IconButton onClick={logout}>
                            <LogoutIcon style={{ filter: "invert(1)" }} />
                        </IconButton>
                    </DrawerHeader>
                    <p className="sleuth_desc">A tool that allows humans to work effectively with partial-automation ML models, making data annotation more efficient and more effective in the NLP domain.</p>
                    <Divider />
                    <DrawerHeader>
                        {workspaceId} 
                        <IconButton style={{color:"white"}} onClick={()=>{navigate('/workspaces')}} >
                            <DoubleArrowIcon/>
                        </IconButton>
                    </DrawerHeader>
                    
                    <Divider />
                    <Stack>
                        <AccountInfo className="account_info">
                            <Box sx={{ flexDirection: 'column' }}>
                                <label>ID</label>
                                <p><b>Dakuo Wang</b></p>
                                <label>User Since</label>
                                <p>December 5, 2021</p>
                            </Box>
                        </AccountInfo>
                        <Divider />
                        <p className="hsbar_label">Labeled (Current: {tabStatus == 0 ? (numLabelGlobal.pos + numLabelGlobal.neg) : (doc_stats.pos + doc_stats.neg)} / {tabStatus == 0 ? total_stats.total : 10})</p>
                        <StackBarContainer>
                            <HSBar
                                height={10}
                                data={tabStatus == 0 ? [
                                    { value: workspace['pos_label_num'] + 0.01, color: "#8ccad9" },
                                    { value: workspace['neg_label_num'] + 0.01, color: "#ff758f" },
                                    { value: total_stats.total - (workspace['pos_label_num'] + workspace['neg_label_num'] + 0.01), color: "#393939" }
                                ] :
                                    [
                                        { value: doc_stats.pos + 0.01, color: "#8ccad9" },
                                        { value: doc_stats.neg + 0.01, color: "#ff758f" },
                                        { value: workspace['elements'].length - (doc_stats.pos + doc_stats.neg), color: "#393939" }
                                    ]} />
                        </StackBarContainer>
                        <Box sx={{ width: '100%', padding: theme.spacing(0, 2) }}>
                            <Box sx={{ borderBottom: 1, borderColor: '#393939' }}>
                                <Tabs
                                    value={tabValue}
                                    onChange={handleChange}
                                    aria-label="workspace toggle tab"
                                    variant="fullWidth">
                                    <Tab label="Workspace" {...a11yProps(0)} />
                                    <Tab label="Document" {...a11yProps(1)} />
                                </Tabs>
                            </Box>
                            <TabPanel className="entries_tab" value={tabValue} index={0} onClick={() => {
                                setTabStatus('workspace')
                            }}>
                                <Stack spacing={0}>
                                    <label>Labeled Entries for Entire Workspace:</label>
                                    <StatsContainer>
                                        <Typography><strong>Positive</strong></Typography>
                                        <Typography sx={{ color: numLabelGlobal.pos > 0 ? "#8ccad9" : "#fff" }}><strong>{numLabelGlobal.pos}</strong></Typography>
                                    </StatsContainer>
                                    <StatsContainer>
                                        <Typography><strong>Negative</strong></Typography>
                                        <Typography sx={{ color: numLabelGlobal.neg > 0 ? "#ff758f" : "#fff" }}><strong>{numLabelGlobal.neg}</strong></Typography>
                                    </StatsContainer>
                                    <StatsContainer>
                                        <Typography><strong>Total</strong></Typography>
                                        <Typography><strong>{numLabelGlobal.pos + numLabelGlobal.neg}/{total_stats.total}</strong></Typography>
                                    </StatsContainer>
                                </Stack>
                            </TabPanel>
                            <TabPanel className="entries_tab" value={tabValue} index={1} onClick={() => {
                                console.log(`tab document`)
                                setTabStatus('document')
                            }}>
                                <Stack spacing={0}>
                                    <label>Labeled Entries for Current Doc:</label>
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
                                        <Typography><strong>{doc_stats.pos + doc_stats.neg}/{workspace.elements.length}</strong></Typography>
                                    </StatsContainer>
                                </Stack>
                            </TabPanel>
                        </Box>
                        <label className="hsbar_label">Model Update Freq.: 5 <i className="fa fa-info-circle"><span>Model in current workspace will be automatically updated every time when you label 5 new positive sentences.</span></i></label>
                        {/* <label className="model_info">Model Information</label> */}
                        <ModelName>
                            <Typography>Current Model:</Typography>
                            {
                                workspace.model_version > -1 ? <Typography><strong>v.{workspace.model_version}_Model</strong></Typography>
                                    : <Typography><strong>None</strong></Typography>
                            }
                        </ModelName>
                        <LinearWithValueLabel />
                        <div className="modelStatus">{workspace['modelStatus']}</div>
                        <Button sx={{ marginTop: 3 }} onClick={() => dispatch(downloadLabeling())}> Download Data </Button>
                    </Stack>
                </Drawer>
            </Box>
        </>

    );
}

