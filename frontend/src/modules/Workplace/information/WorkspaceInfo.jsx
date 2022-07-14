/*
    Copyright (c) 2022 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import * as React from 'react';
import { useCallback, useRef } from "react";
import ReactCanvasConfetti from "react-canvas-confetti";
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import sleuth_logo from '../../../assets/sleuth_logo_white.svg';
import info_icon from '../../../assets/workspace/help.svg';
import logout_icon from '../../../assets/workspace/logout.svg';
import workspace_icon from '../../../assets/workspace/change_catalog.svg';
import { useDispatch, useSelector } from 'react-redux';
import { downloadLabeling, checkModelUpdate, setWorkspaceId } from '../DataSlice.jsx';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Tooltip } from '@mui/material';
import useLogOut from '../../../customHooks/useLogOut';
import { useNavigate } from 'react-router-dom';
import classes from './WorkspaceInfo.module.css';
import { WORKSPACE_CONFIG_PATH, AUTH_ENABLED } from '../../../config';
import { toast } from 'react-toastify';
import {
  LOGOUT_TOOLTIP_MSG,
  GO_TO_WORKSPACE_CONFIG_TOOLTIP_MSG,
  NO_MODEL_AVAILABLE_MSG,
  LABEL_SLEUTH_SHORT_DESC,
  NEXT_MODEL_TRAINING_MSG,
} from "../../../const";
import LinearWithValueLabel from './ModelProgressBar'
import { Link } from "@mui/material";

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
 

export default function WorkspaceInfo({workspaceId, setTutorialOpen, checkModelInterval=5000}) {
    const navigate = useNavigate()
    const theme = useTheme();
    const { logout } = useLogOut()
    const workspace = useSelector(state => state.workspace)
    const [tabValue, setTabValue] = React.useState(0);
    const [tabStatus, setTabStatus] = React.useState(0)
    const refAnimationInstance = useRef(null);
    
    // this state is used to not display the new model notififications the first time the model version is set
    const [modelVersionHasBeenSet, setModelVersionHasBeenSet] = React.useState(false)
    const [shouldNotifyNewModel, setShouldNotifyNewModel] = React.useState(false)
    function notifySuccess(message, toastId) {
        toast(message, {
          autoClose: false,
          type: toast.TYPE.SUCCESS,
          toastId: toastId,
        });
      }

    React.useEffect(() => {
        if (workspace.curCategory !== null) {
            if (!modelVersionHasBeenSet) {
                setModelVersionHasBeenSet(true)
                if (workspace.model_version === -1) {
                    setShouldNotifyNewModel(true)
                }
            }
            if (shouldNotifyNewModel) {
                setShouldNotifyNewModel(false)
            }
            if (workspace.model_version && workspace.model_version > -1 && modelVersionHasBeenSet) {
                fire();
                if (shouldNotifyNewModel) {
                    notifySuccess('A new model is available!', 'toast-new-model')
                    notifySuccess('There are new suggestions for labeling!', 'toast-new-suggestions-for-labelling')
                }
            }
        }
      }, [workspace.model_version])
    
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
        const interval = setInterval(() => {
            if (workspace.curCategory != null) {
                dispatch(checkModelUpdate())
            }
        }, checkModelInterval);

        setModelVersionHasBeenSet(false)
        setShouldNotifyNewModel(false)

        return () => clearInterval(interval);
    }, [workspace.curCategory, checkModelInterval])

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
        
        setTutorialOpen(true)
    };

    /**
    * Returns the suffix of a number in its ordinal form
    **/
    const getOrdinalSuffix = (x) => {
        // suffix pattern repeats every 100 numbers
        x %= 100
        let prefix = "th"
        if (x <= 3 || x >= 21) {
            switch (x % 10) {
                case 1: 
                    prefix = "st"
                    break;
                case 2: 
                    prefix = "nd"
                    break;
                case 3: 
                    prefix = "rd"
            } 
        }
        return prefix
    }

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
                            <img id="workspace-tutorial-image" onClick={open_introSlides} src={info_icon} className={classes.moreinfo} alt="Open Tutorial"/>
                        </h2>
                        { AUTH_ENABLED ?   
                            <Tooltip title={LOGOUT_TOOLTIP_MSG} placement='right'>
                                <img onClick={logout} className={classes.logout} src={logout_icon}/>
                            </Tooltip>
                        : null }
                    </DrawerHeader>

                    <p className={classes.sleuth_desc}>{LABEL_SLEUTH_SHORT_DESC}</p>
                    
                    <Divider />
                    
                    <DrawerHeader style={{padding: '12px 16px', alignItems: 'flex-end'}}>
                        <div className={classes.account_info}>
                            {AUTH_ENABLED ? 
                            <div> 
                                <label>User ID</label>
                                <p>
                                    <b>{localStorage.username}</b>
                                </p>
                            </div>
                            : null}
                            <label>Workspace</label>
                            <p><b>{workspaceId}</b></p>
                        </div>
                        <Tooltip title={GO_TO_WORKSPACE_CONFIG_TOOLTIP_MSG} placement='right'>
                            <img onClick={()=>{navigate(WORKSPACE_CONFIG_PATH)}} className={classes.workspace_nav} src={workspace_icon} alt="Change to Another Workspace" style={{marginBottom: '10px'}}/> 
                        </Tooltip>
                    </DrawerHeader>
                    
                    <Divider />
                    {workspace.curCategory !== null ? 
                    
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
                               workspace.model_version && workspace.model_version > -1 ? <Typography id="model-version"><strong>{workspace.model_version}<sup>{getOrdinalSuffix(workspace.model_version)}</sup> version</strong></Typography>
                                    : <Typography id='model-version-unavailable'><strong>{NO_MODEL_AVAILABLE_MSG}</strong></Typography>
                            }
                        </ModelName>
                        <LinearWithValueLabel />
                        {
                            workspace['nextModelShouldBeTraining'] ? (
                                <div style={{display: "flex", flexDirection: "row", alignItems: "flex-end"}}>
                                    <div className={classes.modelStatus}>{NEXT_MODEL_TRAINING_MSG}</div>    
                                    <div className={classes["dot-pulse"]}></div>
                                </div>
                            )
                            : null
                        }
                    </Stack>

                    : null}
                    <Button sx={{ marginTop: 3 }} onClick={() => dispatch(downloadLabeling())}> Download Data </Button>
                    <Link
                        className={classes["link-to-website"]}
                        href="https://ibm.biz/label-sleuth"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        Visit the website
                    </Link>
                </Drawer>
            </Box>
        </>

    );
}

