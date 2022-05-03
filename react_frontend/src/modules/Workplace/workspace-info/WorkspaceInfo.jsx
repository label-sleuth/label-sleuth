import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import '../styles.css'
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Accordion from '@mui/material/Accordion';
import HSBar from "react-horizontal-stacked-bar-chart";
import { useSelector } from 'react-redux';
import useLogOut from '../../../customHooks/useLogOut';
import LinearWithValueLabel from '../ModelProgressBar'
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

const drawerWidth = 260;
const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}));

const ClassContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    minHeight: "8px",
    justifyContent: 'space-between',
    padding: theme.spacing(0, 2),
    marginBottom: 2
}));

const ModelName = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: "row",
    alignItems: 'start',
    justifyContent: 'space-between',
    margin: theme.spacing(2, 0),
    padding: theme.spacing(0, 2),
}));

const StackBarContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    margin: theme.spacing(0, 0),
    padding: theme.spacing(0, 2),
    ...theme.mixins.toolbar,
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

const HistoryText = styled(Box)((props) => ({
    borderRadius: 16,
    border: "thin solid black",
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    padding: 2.5
  }))

const WorkspaceInfo = () => {

    const [numLabel, setNumLabel] = React.useState({ pos: 0, neg: 0 })
    const workspace = useSelector(state => state.workspace)
    const active_workspace = useSelector(state => state.workspaces.active_workspace)
    const { logout } = useLogOut()
    const [tabValue, setTabValue] = React.useState(0);
    const handleChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Box>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
                variant="permanent"
                anchor="left">
                <DrawerHeader>
                    <Typography variant="h6" component="div">
                        Sleuth
                    </Typography>
                    <IconButton onClick={logout}>
                        <LogoutIcon />
                    </IconButton>
                </DrawerHeader>
                <Divider />
                <Stack>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                        <Typography>{active_workspace}</Typography>
                    </Box>
                    <Divider />
                    <StackBarContainer>
                        <HSBar
                            data={[
                                { value: 100 * (numLabel['pos'] / (1.0 * 131)), color: "#99d98c" },
                                { value: 100 * (numLabel['neg'] / (1.0 * 131)), color: "#ff758f" },
                                { value: 10, color: "#f9f7f3" }]} />
                    </StackBarContainer>
                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={handleChange} aria-label="basic tabs example">
                                <Tab label="Workspace" {...a11yProps(0)} />
                                <Tab label="This file" {...a11yProps(1)} />
                            </Tabs>
                        </Box>
                        <TabPanel value={tabValue} index={0}>
                            <Stack spacing={0} sx={{ marginBottom: 2 }}>
                                <ClassContainer>
                                    <Typography><strong>Positive</strong></Typography>
                                    <Typography><strong>{numLabel['pos']}</strong></Typography>
                                </ClassContainer>
                                <ClassContainer>
                                    <Typography><strong>Negative</strong></Typography>
                                    <Typography><strong>{numLabel['neg']}</strong></Typography>
                                </ClassContainer>
                                <ClassContainer>
                                    <Typography><strong>Total</strong></Typography>
                                    <Typography><strong>{workspace.elements.length}</strong></Typography>
                                </ClassContainer>
                            </Stack>
                        </TabPanel>
                        <TabPanel value={tabValue} index={1}>
                            <Stack spacing={0} sx={{ marginBottom: 2 }}>
                                <ClassContainer>
                                    <Typography><strong>Positive</strong></Typography>
                                    <Typography><strong>{numLabel['pos']}</strong></Typography>
                                </ClassContainer>
                                <ClassContainer>
                                    <Typography><strong>Negative</strong></Typography>
                                    <Typography><strong>{numLabel['neg']}</strong></Typography>
                                </ClassContainer>
                                <ClassContainer>
                                    <Typography><strong>Document</strong></Typography>
                                    <Typography><strong>{workspace.elements.length}</strong></Typography>
                                </ClassContainer>
                            </Stack>
                        </TabPanel>
                    </Box>

                    <Divider />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                        <Typography><strong>Model information</strong></Typography>
                    </Box>
                    <ModelName>
                        <Typography>Current classifier:</Typography>
                        <Typography>v.{workspace.model_version} model</Typography>
                    </ModelName>
                    <LinearWithValueLabel />
                    <Box>
                        <Accordion sx={{ backgroundColor: "grey" }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                <Typography>History</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Card>
                                    <CardContent>
                                        <Typography sx={{ whiteSpace: "normal" }} paragraph>
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                            tempor incididunt ut labore et dolore magna aliqua.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                </Stack>
            </Drawer>
        </Box>
    );
};

export default WorkspaceInfo;