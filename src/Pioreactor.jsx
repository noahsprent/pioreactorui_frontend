import moment from 'moment';

import React, {useState, useEffect} from "react";

import Grid from '@mui/material/Grid';
import { useMediaQuery } from "@mui/material";
import { styled } from '@mui/material/styles';

import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/Card';
import {Typography} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from "@mui/material/Button";
import LoadingButton from '@mui/lab/LoadingButton';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import FlareIcon from '@mui/icons-material/Flare';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListSubheader from '@mui/material/ListSubheader';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import Switch from '@mui/material/Switch';
import { useConfirm } from 'material-ui-confirm';
import {getConfig, getRelabelMap, runPioreactorJob, colors} from "./utilities"
import Alert from '@mui/material/Alert';

import {Link, useParams  } from 'react-router-dom'

import SelfTestDialog from "./components/SelfTestDialog"
import ChangeAutomationsDialog from "./components/ChangeAutomationsDialog"
import ActionDosingForm from "./components/ActionDosingForm"
import ActionManualDosingForm from "./components/ActionManualDosingForm"
import ActionCirculatingForm from "./components/ActionCirculatingForm"
import ActionLEDForm from "./components/ActionLEDForm"
import PioreactorIcon from "./components/PioreactorIcon"
import UnderlineSpan from "./components/UnderlineSpan";
import BioreactorDiagram from "./components/Bioreactor";
import Chart from "./components/Chart";
import LogTableByUnit from "./components/LogTableByUnit";
import { MQTTProvider, useMQTT } from './providers/MQTTContext';
import { useExperiment } from './providers/ExperimentContext';


const readyGreen = "#176114"
const disconnectedGrey = "#585858"
const lostRed = "#DE3618"
const disabledColor = "rgba(0, 0, 0, 0.38)"


const stateDisplay = {
  "init":          {display: "Starting", color: readyGreen, backgroundColor: "#DDFFDC"},
  "ready":         {display: "On", color: readyGreen, backgroundColor: "#DDFFDC"},
  "sleeping":      {display: "Paused", color: disconnectedGrey, backgroundColor: null},
  "disconnected":  {display: "Off", color: disconnectedGrey, backgroundColor: null},
  "lost":          {display: "Lost", color: lostRed, backgroundColor: null},
  "NA":            {display: "Not available", color: disconnectedGrey, backgroundColor: null},
}


function StateTypography({ state, isDisabled=false }) {
  const style = {
    color: isDisabled ? disabledColor : stateDisplay[state].color,
    padding: "1px 10px",
    borderRadius: "16px",
    backgroundColor: stateDisplay[state].backgroundColor,
    display: "inline-block",
    fontWeight: 500
  };

  return (
    <Typography display="block" gutterBottom sx={style}>
      {stateDisplay[state].display}
    </Typography>
  );
}


const StylizedCode = styled('code')(({ theme }) => ({
  backgroundColor: "rgba(0, 0, 0, 0.07)",
  padding: "1px 4px"
}));

const DisplaySettingsTable = styled('span')(({ theme }) => ({
  width: "55px",
  display: "inline-block"
}));

const ManageDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(2), // equivalent to 16px if the default spacing unit is 8px
  marginBottom: theme.spacing(1.25) // equivalent to 10px
}));

const RowOfUnitSettingDisplayBox  = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "stretch",
    alignContent: "stretch",
}));


function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      key={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
          <div>{children}</div>
      )}
    </div>
  );
}

function UnitSettingDisplaySubtext(props){

  if (props.subtext){
    return <Chip size="small" sx={{fontSize: "11px", wordBreak: "break-word", padding: "5px 0px"}} label={props.subtext.replaceAll("_", " ")} />
  }
  else{
    return <Box sx={{minHeight: "15px"}}></Box>
  };
}


function UnitSettingDisplay(props) {

  const value = props.value === null ?  ""  : props.value

  function prettyPrint(x){
    if (x >= 10){
      return x.toFixed(0)
    }
    else if (x===0){
      return "0"
    }
    else if (x < 1){
      return `<1`
    } else {
      return (x).toFixed(1).replace(/[.,]0$/, "");
    }
  }

  function formatForDisplay(value){
    if (typeof value === "string"){
      return value
    } else if (typeof value === "boolean"){
      return value ? "On" : "Off"
    }
    else {
      return +value.toFixed(props.precision)
    }
  }

  if (props.isStateSetting) {
      return (
        <React.Fragment>
          <StateTypography state={value} isDisabled={!props.isUnitActive}/>
          <br/>
          <UnitSettingDisplaySubtext subtext={props.subtext}/>
        </React.Fragment>
    )
  } else if (props.isLEDIntensity) {
    if (!props.isUnitActive || value === "—" || value === "") {
      return <div style={{ color: disconnectedGrey, fontSize: "13px"}}> {props.default} </div>;
    } else {
      const ledIntensities = JSON.parse(value)
        // the | {} is here to protect against the UI loading from a missing config.
      const LEDMap = props.config['leds'] || {}
      const renamedA = (LEDMap['A']) ? (LEDMap['A'].replace("_", " ")) : null
      const renamedB = (LEDMap['B']) ? (LEDMap['B'].replace("_", " ")) : null
      const renamedC = (LEDMap['C']) ? (LEDMap['C'].replace("_", " ")) : null
      const renamedD = (LEDMap['D']) ? (LEDMap['D'].replace("_", " ")) : null

      return(
        <React.Fragment>
          <div style={{fontSize: "13px"}}>
            <div>
              <DisplaySettingsTable>
                <UnderlineSpan title={renamedA ? renamedA : null}>A</UnderlineSpan>: {prettyPrint(ledIntensities["A"])}%
              </DisplaySettingsTable>
              <DisplaySettingsTable>
                <UnderlineSpan title={renamedB ? renamedB : null}>B</UnderlineSpan>: {prettyPrint(ledIntensities["B"])}%
              </DisplaySettingsTable>
            </div>
            <div>
              <DisplaySettingsTable>
                <UnderlineSpan title={renamedC ? renamedC : null}>C</UnderlineSpan>: {prettyPrint(ledIntensities["C"])}%
              </DisplaySettingsTable>
              <DisplaySettingsTable>
                <UnderlineSpan title={renamedD ? renamedD : null}>D</UnderlineSpan>: {prettyPrint(ledIntensities["D"])}%
              </DisplaySettingsTable>
            </div>
          </div>
          <UnitSettingDisplaySubtext subtext={props.subtext}/>
        </React.Fragment>
      )
    }
  } else if (props.isPWMDc) {
    if (!props.isUnitActive || value === "—" || value === "") {
      return <div style={{ color: disconnectedGrey, fontSize: "13px"}}> {props.default} </div>;
    } else {
      const pwmDcs = JSON.parse(value)
      const PWM_TO_PIN = {1: "17",  2: "13", 3: "16",  4: "12"}

      const PWMMap = props.config['PWM']
      const renamed1 = (PWMMap[1]) ? (PWMMap[1].replace("_", " ")) : null
      const renamed2 = (PWMMap[2]) ? (PWMMap[2].replace("_", " ")) : null
      const renamed3 = (PWMMap[3]) ? (PWMMap[3].replace("_", " ")) : null
      const renamed4 = (PWMMap[4]) ? (PWMMap[4].replace("_", " ")) : null


      return(
        <React.Fragment>
          <div style={{fontSize: "13px"}}>
            <div>
              <DisplaySettingsTable>
                <UnderlineSpan title={renamed1 ? renamed1 : null}>1</UnderlineSpan>: {prettyPrint(pwmDcs[PWM_TO_PIN[1]] || 0)}%
              </DisplaySettingsTable>
              <DisplaySettingsTable>
               <UnderlineSpan title={renamed2 ? renamed2 : null}>2</UnderlineSpan>: {prettyPrint(pwmDcs[PWM_TO_PIN[2]] || 0)}%
              </DisplaySettingsTable>
            </div>
            <div>
              <DisplaySettingsTable>
                <UnderlineSpan title={renamed3 ? renamed3 : null}>3</UnderlineSpan>: {prettyPrint(pwmDcs[PWM_TO_PIN[3]] || 0)}%
              </DisplaySettingsTable>
              <DisplaySettingsTable>
                <UnderlineSpan title={renamed4 ? renamed4 : null}>4</UnderlineSpan>: {prettyPrint(pwmDcs[PWM_TO_PIN[4]] || 0)}%
              </DisplaySettingsTable>
            </div>
          </div>
          <UnitSettingDisplaySubtext subtext={props.subtext}/>
        </React.Fragment>
      )
    }
  } else {
    if (!props.isUnitActive || value === "—" || value === "") {
      return (
        <React.Fragment>
          <div style={{ color: disconnectedGrey, fontSize: "13px"}}> {props.default} </div>
          <UnitSettingDisplaySubtext subtext={props.subtext}/>
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          <Chip size="small" style={{ fontSize: "13px"}}
            label={formatForDisplay(value) + " " +
              (props.measurementUnit ? props.measurementUnit : "")}
          />
          <UnitSettingDisplaySubtext subtext={props.subtext}/>
        </React.Fragment>
      );
    }
  }
}



function ButtonStopProcess({experiment, unit}) {
  const confirm = useConfirm();

  const handleClick = () => {
    confirm({
      description: 'This will immediately stop all running activities. Do you wish to continue?',
      title: "Stop all activities?",
      confirmationText: "Confirm",
      confirmationButtonProps: {color: "primary"},
      cancellationButtonProps: {color: "secondary"},

      }).then(() =>
        fetch(`/api/workers/${unit}/experiments/${experiment}/stop`, {method: "POST"})
    ).catch(() => {});

  };

  return (
    <Button style={{textTransform: 'none', float: "right" }} color="secondary" onClick={handleClick}>
      <ClearIcon fontSize="15" sx={{verticalAlign: "middle", margin: "0px 3px"}}/> Stop all activity
    </Button>
  );
}





function PioreactorHeader({unit, assignedExperiment, isActive}) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h5" component="h1">
        <Box sx={{display:"inline"}}>
          <Button to={`/pioreactors`} component={Link} sx={{ textTransform: 'none' }}>
            <ArrowBackIcon sx={{ verticalAlign: "middle", mr: 0.5 }} fontSize="small"/> Back to all Pioreactors
          </Button>
        </Box>
        </Typography>
        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-start", flexFlow: "wrap"}}>
          <ButtonStopProcess experiment={assignedExperiment} unit={unit}/>
          {/* <Divider orientation="vertical" flexItem variant="middle"/> */}
          {/* <ManagePioreactorMenu experiment={experiment} unit={unit}/> */}
        </Box>
      </Box>
     <Divider />

        <Box sx={{m: "10px 2px 0px 2px", display: "flex", flexDirection: "row", justifyContent: "flex-start", flexFlow: "wrap"}}>
          <Typography variant="subtitle2" sx={{flexGrow: 1}}>
            <Box sx={{display:"inline"}}>
              <Box fontWeight="fontWeightBold" sx={{display:"inline-block"}}>
                <ScienceOutlinedIcon sx={{ fontSize: 14, verticalAlign: "-2px" }}/> Experiment assigned:&nbsp;
              </Box>
              <Box fontWeight="fontWeightRegular" sx={{mr: "1%", display:"inline-block"}}>
                {assignedExperiment}
              </Box>
            </Box>
            <Box sx={{display:"inline"}}>
              <Box fontWeight="fontWeightBold" sx={{display:"inline-block"}}>
                <ToggleOnIcon sx={{ fontSize: 14, verticalAlign: "-2px" }}/> Availability:&nbsp;
              </Box>
              <Box fontWeight="fontWeightRegular" sx={{mr: "1%", display:"inline-block"}}>
                {isActive ? "Active" : "Inactive"}
              </Box>
            </Box>

          </Typography>
        </Box>


    </Box>
  )
}


function PatientButton(props) {
  const [buttonText, setButtonText] = useState(props.buttonText)

  useEffect(() => {
      setButtonText(props.buttonText)
    }
  , [props.buttonText])

  const onClick = () => {
      setButtonText(<CircularProgress color="inherit" size={21}/>)
      props.onClick()
      setTimeout(() => setButtonText(props.buttonText), 30000)
  }

  return (
    <Button
      disableElevation
      sx={{width: "70px", mt: "5px", height: "31px", mr: '3px'}}
      color={props.color}
      variant={props.variant}
      disabled={props.disabled}
      size="small"
      onClick={onClick}
    >
      {buttonText}
    </Button>
  )
}


function CalibrateDialog(props) {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);


  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false)
    setTimeout(()=> setTabValue(0), 200) // we put a timeout here so the switching tabs doesn't occur during the close transition.
  };


  function createUserButtonsBasedOnState(jobState, job, always_disable=false){

    switch (jobState){
      case "ready":
      case "init":
      case "sleeping":
       return (<div>
               <PatientButton
                color="primary"
                variant="contained"
                buttonText="Running"
                disabled={true || always_disable}
               />
              </div>)
      default:
       return (<div>
               <PatientButton
                color="primary"
                variant="contained"
                onClick={() => runPioreactorJob(props.unit, '$experiment', job)}
                buttonText="Start"
                disabled={always_disable}
               />
              </div>)
    }
   }

  const isGrowRateJobRunning = props.growthRateJobState === "ready"
  const blankODButton = createUserButtonsBasedOnState(props.odBlankJobState, "od_blank", isGrowRateJobRunning)
  const stirringCalibrationButton = createUserButtonsBasedOnState(props.stirringCalibrationState, "stirring_calibration")

  return (
    <React.Fragment>
      <Button style={{textTransform: 'none', float: "right" }} color="primary" disabled={props.disabled} onClick={handleClickOpen}>
        <TuneIcon color={props.disabled ? "disabled" : "primary"} fontSize="15" sx={{verticalAlign: "middle", margin: "0px 3px"}}/> Calibrate
      </Button>
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle>
          <Typography sx={{fontSize: "13px", color: "rgba(0, 0, 0, 0.60)",}}>
            <PioreactorIcon style={{verticalAlign: "middle", fontSize: "1.2em"}}/> {(props.label) ? `${props.label} / ${props.unit}` : `${props.unit}`}
          </Typography>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            >
            <Tab label="Blanks"/>
            <Tab label="Stirring"/>
            <Tab label="Dosing" />
            <Tab label="OD600"  />
          </Tabs>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
            size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TabPanel value={tabValue} index={0}>
            <Typography  gutterBottom>
             Record optical densities of blank (optional)
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
              For more accurate growth rate and biomass inferences, the Pioreactor can subtract out the
              media's <i>un-inoculated</i> optical density <i>per experiment</i>. Read more about <a href="https://docs.pioreactor.com/user-guide/od-normal-growth-rate#blanking">using blanks</a>.
            </Typography>
            <Typography variant="body2" component="p" style={{margin: "20px 0px"}}>
              Recorded optical densities of blank vial: <code>{props.odBlankReading ? Object.entries(JSON.parse(props.odBlankReading)).map( ([k, v]) => `${k}:${v.toFixed(5)}` ).join(", ") : "—"}</code>
            </Typography>

            <div style={{display: "flex"}}>
              {blankODButton}
              <div>
                <Button size="small" sx={{width: "70px", mt: "5px", height: "31px", mr: '3px'}} color="secondary" disabled={(props.odBlankReading === null) || (isGrowRateJobRunning)} onClick={() => runPioreactorJob(props.unit, '$experiment', "od_blank", ['delete']) }> Clear </Button>
              </div>
            </div>
            <ManageDivider/>

          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Typography  gutterBottom>
             Stirring calibration (optional)
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
              You can improve the responsiveness of stirring RPM changes by running this calibration. This calibration is
              optional, and stirring RPM changes can still occur without running this calibration. Only needs to be performed once - results are saved to disk.
            </Typography>

            <Typography variant="body2" component="p" gutterBottom>
            Add a vial, with a stirbar and ~15ml of liquid, to the Pioreactor, then hit Start below. This calibration will take less than five minutes.
            </Typography>

            {stirringCalibrationButton}

            <ManageDivider/>

          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <Typography  gutterBottom>
             Dosing calibration for pumps
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
            To use a peristatlic pump with your Pioreactor, you'll need to calibrate it to accuractly dose specific volumes.
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
            See instructions <a target="_blank" rel="noopener noreferrer" href="https://docs.pioreactor.com/user-guide/hardware-calibrations#pump-calibration">here</a>.
            </Typography>
            <ManageDivider/>

          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography  gutterBottom>
             OD600 Calibration (optional)
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
            By performing the following calibration, you can relate Pioreactor's internal OD readings (measured in volts) to an offline OD600 value. The UI and datasets will be measured in your OD600 values instead of voltages.
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
            See instructions <a target="_blank" rel="noopener noreferrer" href="https://docs.pioreactor.com/user-guide/calibrate-od600">here</a>.
            </Typography>
            <ManageDivider/>
          </TabPanel>
        </DialogContent>
      </Dialog>
  </React.Fragment>
  );
}






function SettingsActionsDialog(props) {
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [rebooting, setRebooting] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);
  const [openChangeDosingDialog, setOpenChangeDosingDialog] = useState(false);
  const [openChangeLEDDialog, setOpenChangeLEDDialog] = useState(false);
  const [openChangeTemperatureDialog, setOpenChangeTemperatureDialog] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };


  function setPioreactorJobState(job, state) {
    return function() {
      setPioreactorJobAttr(`${job}/$state`, state)
    };
  }


  function rebootRaspberryPi(){
    return function() {
      setRebooting(true)
      fetch(`/api/units/${props.unit}/reboot`, {method: "POST"})
    }
  }

  function shutDownRaspberryPi(){
    return function() {
      setShuttingDown(true)
      fetch(`/api/units/${props.unit}/shutdown`, {method: "POST"})
    }
  }

  function stopPioreactorJob(job){
    return function() {
      setPioreactorJobAttr(`${job}/$state`, "disconnected")
    }
  }

  function setPioreactorJobAttr(job_attr, value) {
    const topic = `pioreactor/${props.unit}/${props.experiment}/${job_attr}/set`
    props.client.publish(topic, String(value), {qos: 1});
  }


  function updateRenameUnit(_, value) {
      const relabeledTo = value
      setSnackbarMessage(`Updating to ${relabeledTo}`)
      setSnackbarOpen(true)
      fetch(`/api/experiments/${props.experiment}/unit_labels`,{
          method: "PUT",
          body: JSON.stringify({label: relabeledTo, unit: props.unit}),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }).then(res => {
          if (res.ok) {
            props.setLabel(relabeledTo)
          }
        })
    }


  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(()=> setTabValue(0), 200) // we put a timeout here so the switching tabs doesn't occur during the close transition.
  };

  const handleSnackbarClose = (e, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false)
  }

  function createUserButtonsBasedOnState(jobState, job){
    switch (jobState){
      case "lost":
        return (<div key={"patient_buttons_lost" + job}>
                  <PatientButton
                    color="primary"
                    variant="contained"
                    onClick={() => runPioreactorJob(props.unit, props.experiment, job)}
                    buttonText="Start"
                  />
        </div>)
      case "disconnected":
       return (<div key={"patient_buttons_disconnected" + job}>
                 <PatientButton
                  color="primary"
                  variant="contained"
                  onClick={() => runPioreactorJob(props.unit, props.experiment, job)}
                  buttonText="Start"
                 />
                <PatientButton
                  color="secondary"
                  disabled={true}
                  buttonText="Stop"
                />
              </div>)
      case "init":
        return (
          <div key={"patient_buttons_init" + job}>
            <PatientButton
              color="primary"
              variant="contained"
              onClick={()=>(false)}
              buttonText=<CircularProgress color="inherit" size={22}/>
              disabled={true}
            />
            <PatientButton
              color="secondary"
              onClick={stopPioreactorJob(job)}
              buttonText="Stop"
            />
          </div>
        )
      case "ready":
        return (
          <div key={"patient_buttons_ready" + job}>
            <PatientButton
              color="secondary"
              variant="contained"
              onClick={setPioreactorJobState(job, "sleeping")}
              buttonText="Pause"
            />
            <PatientButton
              color="secondary"
              onClick={stopPioreactorJob(job)}
              buttonText="Stop"
            />
          </div>
          )
      case "sleeping":
        return (
          <div key={"patient_buttons_sleeping" + job}>
            <PatientButton
              color="primary"
              variant="contained"
              onClick={setPioreactorJobState(job, "ready")}
              buttonText="Resume"
            />
            <PatientButton
              color="secondary"
              onClick={stopPioreactorJob(job)}
              buttonText="Stop"
            />
          </div>
          )
      default:
        return(<div key={"patient_buttons_empty" + job}></div>)
    }
   }

  // Define a function to determine which component to render based on the type of setting
  function renderSettingComponent(setting, job_key, setting_key, state) {
    const commonProps = {
      onUpdate: setPioreactorJobAttr,
      setSnackbarMessage: setSnackbarMessage,
      setSnackbarOpen: setSnackbarOpen,
      value: setting.value,
      units: setting.unit,
      id: `${job_key}/${setting_key}`,
      disabled: state === "disconnected",
    };

    switch (setting.type) {
      case "boolean":
        return <SettingSwitchField {...commonProps} />;
      case "numeric":
        return <SettingNumericField {...commonProps} />;
      default:
        return <SettingTextField {...commonProps} />;
    }
  }


  const LEDMap = props.config['leds'] || {}
  const buttons = Object.fromEntries(Object.entries(props.jobs).map( ([job_key, job], i) => [job_key, createUserButtonsBasedOnState(job.state, job_key)]))
  const versionInfo = JSON.parse(props.jobs.monitor.publishedSettings.versions.value || "{}")
  const voltageInfo = JSON.parse(props.jobs.monitor.publishedSettings.voltage_on_pwm_rail.value || "{}")
  const ipInfo = props.jobs.monitor.publishedSettings.ipv4.value
  const macInfoWlan = props.jobs.monitor.publishedSettings.wlan_mac_address.value
  const macInfoEth = props.jobs.monitor.publishedSettings.eth_mac_address.value

  const isLargeScreen = useMediaQuery(theme => theme.breakpoints.down('xl'));
  const dosingControlJob = props.jobs.dosing_automation
  const ledControlJob = props.jobs.led_automation
  const temperatureControlJob = props.jobs.temperature_automation

  return (
    <div>
    <Button style={{textTransform: 'none', float: "right" }} disabled={props.disabled} onClick={handleClickOpen} color="primary">
      <SettingsIcon color={props.disabled ? "disabled" : "primary"} fontSize="15" sx={{verticalAlign: "middle", margin: "0px 3px"}}/> Manage
    </Button>
    <Dialog maxWidth={isLargeScreen ? "sm" : "md"} fullWidth={true} open={open} onClose={handleClose} PaperProps={{
      sx: {
        height: "calc(100% - 64px)"
      }
    }}>
      <DialogTitle>
        <Typography sx={{fontSize: "13px", color: "rgba(0, 0, 0, 0.60)",}}>
          <PioreactorIcon style={{verticalAlign: "middle", fontSize: "1.2em"}}/>
          <span> {props.label ? `${props.label} / ${props.unit}` : `${props.unit}`} </span>
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          size="large">
          <CloseIcon />
        </IconButton>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        >
        <Tab label="Activities"/>
        <Tab label="Settings"/>
        <Tab label="Dosing"/>
        <Tab label="LEDs"/>
        <Tab label="System"/>
      </Tabs>
      </DialogTitle>
      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          {/* Unit Specific Activites */}
          {Object.entries(props.jobs)
            .filter(([job_key, job]) => job.metadata.display)
            .filter(([job_key, job]) => !['dosing_automation', 'led_automation', 'temperature_automation'].includes(job_key)) //these are added later
            .map(([job_key, job]) =>
            <div key={job_key}>
              <div style={{justifyContent: "space-between", display: "flex"}}>
                <Typography display="block">
                  {job.metadata.display_name}
                </Typography>
                <StateTypography state={job.state}/>
              </div>
              <Typography variant="caption" display="block" gutterBottom color="textSecondary">
                {job.metadata.source !== "app" ? `Installed by ${job.metadata.source || "unknown"}` : ""}
              </Typography>
              <Typography variant="body2" component="p" gutterBottom>
                <div dangerouslySetInnerHTML={{__html: job.metadata.description}}/>
              </Typography>

              {buttons[job_key]}

              <ManageDivider/>
            </div>
          )}


          {/* Unit Specific Automations */}
          {temperatureControlJob &&
          <React.Fragment>
            <div style={{justifyContent: "space-between", display: "flex"}}>
              <Typography display="block">
                Temperature automation
              </Typography>
              <StateTypography state={temperatureControlJob.state}/>
            </div>

            <div key={temperatureControlJob.metadata.key}>
              {(temperatureControlJob.state === "ready") || (temperatureControlJob.state === "sleeping") || (temperatureControlJob.state === "init")
              ?<React.Fragment>
                <Typography variant="body2" component="p" gutterBottom>
                Currently running temperature automation <Chip size="small" label={temperatureControlJob.publishedSettings.automation_name.value} />.
                </Typography>
                {buttons[temperatureControlJob.metadata.key]}
               </React.Fragment>
              :<React.Fragment>
                <Typography variant="body2" component="p" gutterBottom>
                  <span dangerouslySetInnerHTML={{__html: temperatureControlJob.metadata.description}}/>
                </Typography>

                <Button
                  sx={{width: "70px", mt: "5px", height: "31px", mr: '3px'}}
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => setOpenChangeTemperatureDialog(true)}
                >
                  Start
                </Button>
                <Button
                  sx={{width: "70px", mt: "5px", height: "31px", mr: '3px'}}
                  size="small"
                  color="primary"
                  disabled={true}
                >
                  Stop
                </Button>

               </React.Fragment>
              }
            </div>

            <ChangeAutomationsDialog
              open={openChangeTemperatureDialog}
              onFinished={() => setOpenChangeTemperatureDialog(false)}
              unit={props.unit}
              label={props.label}
              experiment={props.experiment}
              automationType="temperature"
              no_skip_first_run={true}
            />
          </React.Fragment>
          }

          <ManageDivider/>

          {dosingControlJob &&
          <React.Fragment>
            <div style={{justifyContent: "space-between", display: "flex"}}>
              <Typography display="block">
                Dosing automation
              </Typography>
              <StateTypography state={dosingControlJob.state}/>
            </div>
            <div key={dosingControlJob.metadata.key}>
              {(dosingControlJob.state === "ready") || (dosingControlJob.state === "sleeping") || (temperatureControlJob.state === "init")
              ?<React.Fragment>
                <Typography variant="body2" component="p" gutterBottom>
                Currently running dosing automation <Chip size="small" label={dosingControlJob.publishedSettings.automation_name.value}/>.
                </Typography>
                {buttons[dosingControlJob.metadata.key]}
               </React.Fragment>
              :<React.Fragment>
                <Typography variant="body2" component="p" gutterBottom>
                  <span dangerouslySetInnerHTML={{__html: dosingControlJob.metadata.description}}/>
                </Typography>

                <Button
                  sx={{width: "70px", mt: "5px", height: "31px", mr: '3px'}}
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => setOpenChangeDosingDialog(true)}
                >
                  Start
                </Button>
                <Button
                  sx={{width: "70px", mt: "5px", height: "31px", mr: '3px'}}
                  size="small"
                  color="primary"
                  disabled={true}
                >
                  Stop
                </Button>
               </React.Fragment>
              }
            </div>


            <ChangeAutomationsDialog
              automationType="dosing"
              open={openChangeDosingDialog}
              onFinished={() => setOpenChangeDosingDialog(false)}
              unit={props.unit}
              label={props.label}
              experiment={props.experiment}
              no_skip_first_run={false}
            />
          </React.Fragment>
          }

          <ManageDivider/>


          {ledControlJob &&
          <React.Fragment>
            <div style={{justifyContent: "space-between", display: "flex"}}>
              <Typography display="block">
                LED automation
              </Typography>
              <StateTypography state={ledControlJob.state}/>
            </div>

            <div key={ledControlJob.metadata.key}>
              {(ledControlJob.state === "ready") || (ledControlJob.state === "sleeping") || (temperatureControlJob.state === "init")
              ?<React.Fragment>
                <Typography variant="body2" component="p" gutterBottom>
                Currently running LED automation <Chip size="small" label={ledControlJob.publishedSettings.automation_name.value}/>.
                </Typography>
                {buttons[ledControlJob.metadata.key]}
               </React.Fragment>
              :<React.Fragment>
                <Typography variant="body2" component="p" gutterBottom>
                  <span dangerouslySetInnerHTML={{__html: ledControlJob.metadata.description}}/>
                </Typography>

                <Button
                  sx={{width: "70px", mt: "5px", height: "31px", mr: '3px'}}
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => setOpenChangeLEDDialog(true)}
                >
                  Start
                </Button>
                <Button
                  sx={{width: "70px", mt: "5px", height: "31px", mr: '3px'}}
                  size="small"
                  color="primary"
                  disabled={true}
                >
                  Stop
                </Button>
               </React.Fragment>
              }
            </div>

            <ChangeAutomationsDialog
              automationType="led"
              open={openChangeLEDDialog}
              onFinished={() => setOpenChangeLEDDialog(false)}
              unit={props.unit}
              label={props.label}
              experiment={props.experiment}
              no_skip_first_run={false}
            />
          </React.Fragment>
          }

          <ManageDivider/>


        </TabPanel>


        <TabPanel value={tabValue} index={1}>
          <Typography  gutterBottom>
            Assign temporary label to Pioreactor
          </Typography>
          <Typography variant="body2" component="p">
            Assign a temporary label to this Pioreactor for this experiment. The new label will display in graph legends, and throughout the interface.
          </Typography>
          <SettingTextField
            value={props.label}
            onUpdate={updateRenameUnit}
            setSnackbarMessage={setSnackbarMessage}
            setSnackbarOpen={setSnackbarOpen}
            id={'relabeller' + props.unit}
            disabled={false}
          />
          <ManageDivider/>

          {Object.values(props.jobs)
            .filter(job => job.metadata.display)
            .map(job => [job.state, job.metadata.key, job.publishedSettings])
            .map(([state, job_key, settings], index) => (
              Object.entries(settings)
                .filter(([setting_key, setting],_) => setting.display)
                .map(([setting_key, setting],_) =>
                        <React.Fragment key={setting_key}>
                          <Typography gutterBottom>
                            {setting.label}
                          </Typography>

                          <Typography variant="body2" component="p">
                            {setting.description}
                          </Typography>

                          {renderSettingComponent(setting, job_key, setting_key, state)}

                          <ManageDivider/>
                        </React.Fragment>
          )))}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography  gutterBottom>
            Cycle Media
          </Typography>
          <Typography variant="body2" component="p">
            Safely cycle media in and out of your Pioreactor for a set duration (seconds) by running the media periodically and waste pump continuously.
          </Typography>

          <ActionCirculatingForm action="circulate_media" unit={props.unit} experiment={props.experiment} job={props.jobs.circulate_media} />

          <ManageDivider/>

          <Typography  gutterBottom>
            Cycle alternative media
          </Typography>
          <Typography variant="body2" component="p">
            Safely cycle alternative media in and out of your Pioreactor for a set duration (seconds) by running the alt-media periodically and waste pump continuously.
          </Typography>

          <ActionCirculatingForm action="circulate_alt_media" unit={props.unit} experiment={props.experiment} job={props.jobs.circulate_alt_media} />

          <ManageDivider/>

          <Alert severity="warning" style={{marginBottom: '10px', marginTop: '10px'}}>It's easy to overflow your vial. Make sure you don't add too much media.</Alert>

          <Typography  gutterBottom>
            Add media
          </Typography>
          <Typography variant="body2" component="p" gutterBottom>
            Run the media pump for a set duration (s), moving a set volume (mL), or continuously add until stopped.
          </Typography>
          <Typography variant="body2" component="p">
            Specify how you’d like to add media:
          </Typography>
          <ActionDosingForm action="add_media" unit={props.unit} experiment={props.experiment} job={props.jobs.add_media} />
          <ManageDivider/>
          <Typography  gutterBottom>
            Remove waste
          </Typography>
          <Typography variant="body2" component="p" gutterBottom>
            Run the waste pump for a set duration (s), moving a set volume (mL), or continuously remove until stopped.
          </Typography>
          <Typography variant="body2" component="p">
            Specify how you’d like to remove waste:
          </Typography>
          <ActionDosingForm action="remove_waste" unit={props.unit} experiment={props.experiment} job={props.jobs.remove_waste} />
          <ManageDivider/>
          <Typography gutterBottom>
            Add alternative media
          </Typography>
          <Typography variant="body2" component="p" gutterBottom>
            Run the alt-media pump for a set duration (s), moving a set volume (mL), or continuously add until stopped.
          </Typography>
          <Typography variant="body2" component="p">
            Specify how you’d like to add alt-media:
          </Typography>
          <ActionDosingForm action="add_alt_media" unit={props.unit} experiment={props.experiment} job={props.jobs.add_alt_media} />
          <ManageDivider/>
          <Typography gutterBottom>
            Manual adjustments
          </Typography>
          <Typography variant="body2" component="p" gutterBottom>
            Record adjustments before manually adding or removing from the vial. This is recorded in the database and will ensure accurate metrics.
          </Typography>
          <ActionManualDosingForm unit={props.unit} experiment={props.experiment}/>


        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography style={{textTransform: "capitalize"}}>
            {(LEDMap['A']) ? (LEDMap['A'].replace("_", " ").replace("led", "LED")) : "Channel A" }
          </Typography>
          <Typography sx={{fontSize: "13px", color: "rgba(0, 0, 0, 0.60)",}} color="textSecondary">
            {(LEDMap['A']) ? "Channel A" : ""}
          </Typography>
          <ActionLEDForm experiment={props.experiment} channel="A" unit={props.unit} />
          <ManageDivider/>

          <Typography style={{textTransform: "capitalize"}}>
            {(LEDMap['B']) ? (LEDMap['B'].replace("_", " ").replace("led", "LED")) : "Channel B" }
          </Typography>
          <Typography sx={{fontSize: "13px", color: "rgba(0, 0, 0, 0.60)",}} color="textSecondary">
            {(LEDMap['B']) ? "Channel B" : ""}
          </Typography>
          <ActionLEDForm experiment={props.experiment} channel="B" unit={props.unit} />
          <ManageDivider/>

          <Typography style={{textTransform: "capitalize"}}>
            {(LEDMap['C']) ? (LEDMap['C'].replace("_", " ").replace("led", "LED")) : "Channel C" }
          </Typography>
          <Typography sx={{fontSize: "13px", color: "rgba(0, 0, 0, 0.60)",}} color="textSecondary">
            {(LEDMap['C']) ? "Channel C" : ""}
          </Typography>

          <ActionLEDForm experiment={props.experiment} channel="C" unit={props.unit} />
          <ManageDivider/>

          <Typography style={{textTransform: "capitalize"}}>
            {(LEDMap['D']) ? (LEDMap['D'].replace("_", " ").replace("led", "LED")) : "Channel D" }
          </Typography>
          <Typography sx={{fontSize: "13px", color: "rgba(0, 0, 0, 0.60)",}} color="textSecondary">
            {(LEDMap['D']) ? "Channel D" : ""}
          </Typography>
          <ActionLEDForm experiment={props.experiment} channel="D" unit={props.unit} />
          <ManageDivider/>
        </TabPanel>
        <TabPanel value={tabValue} index={4}>

          <Typography  gutterBottom>
            Addresses and hostname
          </Typography>

            <Typography variant="body2" component="p" gutterBottom>
              Learn about how to <a target="_blank" rel="noopener noreferrer" href="https://docs.pioreactor.com/user-guide/accessing-raspberry-pi">access the Pioreactor's Raspberry Pi</a>.
            </Typography>

            <table style={{borderCollapse: "separate", borderSpacing: "5px", fontSize: "0.90rem"}}>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    IPv4
                </td>
                <td>
                  <StylizedCode>{ipInfo || "-"}</StylizedCode>
                </td>
              </tr>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    Hostname
                </td>
                <td>
                  <StylizedCode>{props.unit}.local</StylizedCode>
                </td>
              </tr>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    WLAN MAC
                </td>
                <td>
                  <StylizedCode>{macInfoWlan || "-"}</StylizedCode>
                </td>
              </tr>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    Ethernet MAC
                </td>
                <td>
                  <StylizedCode>{macInfoEth || "-"}</StylizedCode>
                </td>
              </tr>
            </table>


          <ManageDivider/>

          <Typography  gutterBottom>
            Version information
          </Typography>


            <table style={{borderCollapse: "separate", borderSpacing: "5px", fontSize: "0.90rem"}}>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    Pioreactor model
                </td>
                <td >
                  <StylizedCode>{("Pioreactor " + versionInfo.pioreactor_model?.substring(11) + ", v" + versionInfo.pioreactor_version) || "-"}</StylizedCode>
                </td>
              </tr>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    Software version
                </td>
                <td >
                  <StylizedCode>{versionInfo.app || "-"}</StylizedCode>
                </td>
              </tr>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    Raspberry Pi
                </td>
                <td >
                  <StylizedCode>{versionInfo.rpi_machine || "-"}</StylizedCode>
                </td>
              </tr>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    HAT version
                </td>
                <td >
                  <StylizedCode>{versionInfo.hat || "-"}</StylizedCode>
                </td>
              </tr>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    HAT serial number
                </td>
                <td >
                  <StylizedCode>{versionInfo.hat_serial || "-"}</StylizedCode>
                </td>
              </tr>
            </table>


          <ManageDivider/>

          <Typography  gutterBottom>
            Voltage on PWM rail
          </Typography>

            <table style={{borderCollapse: "separate", borderSpacing: "5px", fontSize: "0.90rem"}}>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    Voltage
                </td>
                <td >
                  <StylizedCode>{voltageInfo.voltage ? `${voltageInfo.voltage} V` : "-" }</StylizedCode>
                </td>
              </tr>
              <tr>
                <td style={{textAlign: "right", minWidth: "120px", color: ""}}>
                    Last updated at
                </td>
                <td >
                  <StylizedCode>{voltageInfo.timestamp ? moment.utc(voltageInfo.timestamp, 'YYYY-MM-DD[T]HH:mm:ss.SSSSS[Z]').local().format('MMMM Do, h:mm a') : "-"}</StylizedCode>
                </td>
              </tr>
            </table>


          <ManageDivider/>

          <Typography  gutterBottom>
            Reboot
          </Typography>
          <Typography variant="body2" component="p">
            Reboot the Raspberry Pi operating system. This will stop all jobs, and the Pioreactor will be inaccessible for a few minutes. It will blink its blue LED when back up, or press the onboard button to light up the blue LED.
          </Typography>

          <LoadingButton
            loadingIndicator="Rebooting"
            loading={rebooting}
            variant="text"
            color="primary"
            style={{marginTop: "15px", textTransform: 'none'}}
            onClick={rebootRaspberryPi()}
          >
            Reboot RPi
          </LoadingButton>

          <ManageDivider/>

          <Typography  gutterBottom>
            Shut down
          </Typography>
          <Typography variant="body2" component="p">
            After 20 seconds, shut down the Pioreactor. This will stop all jobs, and the Pioreactor will be inaccessible until it is restarted by unplugging and replugging the power supply.
          </Typography>
          <LoadingButton
            loadingIndicator="😵"
            loading={shuttingDown}
            variant="text"
            color="primary"
            style={{marginTop: "15px", textTransform: 'none'}}
            onClick={shutDownRaspberryPi()}
          >
            Shut down
          </LoadingButton>

          <ManageDivider/>



        </TabPanel>

      </DialogContent>
    </Dialog>
    <Snackbar
      anchorOrigin={{vertical: "bottom", horizontal: "center"}}
      open={snackbarOpen}
      onClose={handleSnackbarClose}
      message={snackbarMessage}
      autoHideDuration={7000}
      resumeHideDuration={2000}
      key={"snackbar" + props.unit + "settings"}
    />
    </div>
  );
}


function SettingTextField(props){


    const [value, setValue] = useState(props.value || "")
    const [activeSubmit, setActiveSumbit] = useState(false)

    useEffect(() => {
      if (props.value !== value) {
        setValue(props.value || "");
      }
    }, [props.value]);


    const onChange = (e) => {
      setActiveSumbit(true)
      setValue(e.target.value)
    }

    const onKeyPress = (e) => {
        if ((e.key === "Enter") && (e.target.value)) {
          onSubmit()
      }
    }

    const onSubmit = () => {
        props.onUpdate(props.id, value);
        if (value !== "") {
          props.setSnackbarMessage(`Updating to ${value}${(!props.units) ? "" : (" "+props.units)}.`)
        } else {
          props.setSnackbarMessage("Updating.")
        }
        props.setSnackbarOpen(true)
        setActiveSumbit(false)
    }

    return (
     <div style={{display: "flex"}}>
        <TextField
          size="small"
          autoComplete="off"
          disabled={props.disabled}
          id={props.id}
          value={value}
          InputProps={{
            endAdornment: <InputAdornment position="end">{props.units}</InputAdornment>,
            autoComplete: 'new-password',
          }}
          variant="outlined"
          onChange={onChange}
          onKeyPress={onKeyPress}
          sx={{mt: 2, maxWidth: "180px",}}
        />
        <Button
          size="small"
          color="primary"
          disabled={!activeSubmit}
          onClick={onSubmit}
          style={{textTransform: 'none', marginTop: "15px", marginLeft: "7px", display: (props.disabled ? "None" : "") }}
        >
          Update
        </Button>
     </div>
    )
}


function SettingSwitchField(props){
    const [value, setValue] = useState(props.value || false)

    useEffect(() => {
      if (props.value !== value) {
        setValue(props.value|| false);
      }
    }, [props.value]); //TODO: this use to be [props]

    const onChange = (e) => {
      setValue(e.target.checked)
      props.onUpdate(props.id,  e.target.checked ? 1 : 0);
      props.setSnackbarMessage(`Updating to ${e.target.checked ? "on" : "off"}.`)
      props.setSnackbarOpen(true)
    }

    return (
      <Switch
        checked={value}
        disabled={props.disabled}
        onChange={onChange}
        id={props.id}
      />
    )
}


function SettingNumericField(props) {

  const [value, setValue] = useState(props.value || "");
  const [error, setError] = useState(false);
  const [activeSubmit, setActiveSubmit] = useState(false);

  useEffect(() => {
    if (props.value !== value) {
      setValue(props.value || "");
    }
  }, [props.value]);

  const validateNumericInput = (input) => {
    const numericPattern = /^-?\d*\.?\d*$/; // Allows negative and decimal numbers
    return numericPattern.test(input);
  };

  const onChange = (e) => {
    const input = e.target.value;
    const isValid = validateNumericInput(input);
    setError(!isValid);
    setActiveSubmit(isValid);
    setValue(input);
  };

  const onKeyPress = (e) => {
    if (e.key === "Enter" && e.target.value && !error) {
      onSubmit();
    }
  };

  const onSubmit = () => {
    if (!error) {
      props.onUpdate(props.id, value);
      const message = value !== "" ? `Updating to ${value}${props.units ? " " + props.units : ""}.` : "Updating.";
      props.setSnackbarMessage(message);
      props.setSnackbarOpen(true);
      setActiveSubmit(false);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <TextField
        type="number"
        size="small"
        autoComplete="off"
        disabled={props.disabled}
        id={props.id}
        value={value}
        error={error}
        InputProps={{
          endAdornment: <InputAdornment position="end">{props.units}</InputAdornment>,
          autoComplete: 'new-password',
        }}
        variant="outlined"
        onChange={onChange}
        onKeyPress={onKeyPress}
        sx={{mt: 2, maxWidth: "140px"}}
      />
      <Button
        size="small"
        color="primary"
        disabled={!activeSubmit || error}
        onClick={onSubmit}
        style={{ textTransform: 'none', marginTop: "15px", marginLeft: "7px", display: (props.disabled ? "None" : "") }}
      >
        Update
      </Button>
    </div>
  );
}



function UnitCard({unit, experiment, config, isAssignedToExperiment, isActive}){
  const [relabelMap, setRelabelMap] = useState({})

  useEffect(() => {

    if (experiment){
      getRelabelMap(setRelabelMap, experiment)
    }
  }, [experiment])

  return (
    <React.Fragment>
      <div>
         <PioreactorCard isUnitActive={isAssignedToExperiment && isActive} unit={unit} config={config} experiment={experiment} label={relabelMap[unit]}/>
      </div>
    </React.Fragment>
)}


function FlashLEDButton(props){

  const [flashing, setFlashing] = useState(false)


  const onClick = () => {
    setFlashing(true)
    const sendMessage = () => {
      const topic = `pioreactor/${props.unit}/$experiment/monitor/flicker_led_response_okay`
      try{
        props.client.publish(topic, "1", {qos: 0});
      }
      catch (e){
        console.log(e)

        setTimeout(() => {sendMessage()}, 1000)
      }
    }

    sendMessage()
    setTimeout(() => {setFlashing(false)}, 3600 ) // .9 * 4
  }

  return (
    <Button style={{textTransform: 'none', float: "right"}} className={flashing ? 'blinkled' : ''}  disabled={props.disabled} onClick={onClick} color="primary">
      <FlareIcon color={props.disabled ? "disabled" : "primary"} fontSize="15" sx={{verticalAlign: "middle", margin: "0px 3px"}}/> <span > Identify </span>
    </Button>
)}


function PioreactorCard(props){
  const unit = props.unit
  const isUnitActive = props.isUnitActive
  const experiment = props.experiment
  const config = props.config
  const [jobFetchComplete, setJobFetchComplete] = useState(false)
  const [label, setLabel] = useState("")
  const {client, subscribeToTopic } = useMQTT();

  const [jobs, setJobs] = useState({
    monitor: {
      state : null,
      metadata: {display: false},
      publishedSettings: {
        versions: {
            value: null, label: null, type: "json", unit: null, display: false, description: null
        },
        voltage_on_pwm_rail: {
            value: null, label: null, type: "json", unit: null, display: false, description: null
        },
        ipv4: {
            value: null, label: null, type: "string", unit: null, display: false, description: null
        },
        wlan_mac_address: {
            value: null, label: null, type: "string", unit: null, display: false, description: null
        },
        eth_mac_address: {
            value: null, label: null, type: "string", unit: null, display: false, description: null
        },
      },
    },
  })

  useEffect(() => {
    setLabel(props.label)
  }, [props.label])


  useEffect(() => {
    function fetchContribBackgroundJobs() {
      fetch("/api/contrib/jobs")
        .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('Something went wrong');
            }
          })
        .then((listOfJobs) => {
          var jobs_ = {}
          for (const job of listOfJobs){
            var metaData_ = {state: "disconnected", publishedSettings: {}, metadata: {display_name: job.display_name, subtext: job.subtext, display: job.display, description: job.description, key: job.job_name, source: job.source}}
            for(var i = 0; i < job["published_settings"].length; ++i){
              var field = job["published_settings"][i]
              metaData_.publishedSettings[field.key] = {value: field.default || null, label: field.label, type: field.type, unit: field.unit || null, display: field.display, description: field.description}
            }
            jobs_[job.job_name] = metaData_
          }
          setJobs((prev) => ({...prev, ...jobs_}))
          setJobFetchComplete(true)
        })
        .catch((error) => {})
    }
    fetchContribBackgroundJobs();
  }, [])

  const parseToType = (payloadString, typeOfSetting) => {
    if (typeOfSetting === "numeric"){
      return [null, ""].includes(payloadString) ? payloadString : parseFloat(payloadString)
    }
    else if (typeOfSetting === "boolean"){
      if ([null, ""].includes(payloadString)){
        return null
      }
      return (["1", "true", "True", 1].includes(payloadString))
    }
    return payloadString
  }

  useEffect(() => {

    if (!isUnitActive){
      return
    }

    if (!jobFetchComplete){
      return
    }

    if (!experiment){
      return
    }

    if (!client){
      return
    }

    subscribeToTopic(`pioreactor/${unit}/$experiment/monitor/$state`, onMessage, "PioreactorCard");
    for (const job of Object.keys(jobs)) {

      subscribeToTopic(`pioreactor/${unit}/${experiment}/${job}/$state`, onMessage, "PioreactorCard");
      for (const setting of Object.keys(jobs[job].publishedSettings)){
          var topic = [
            "pioreactor",
            unit,
            (job === "monitor" ? "$experiment" : experiment),
            job,
            setting
          ].join("/")
          subscribeToTopic(topic, onMessage, "PioreactorCard");
      }
    }

  },[experiment, jobFetchComplete, isUnitActive, client])

  const onMessage = (topic, message, packet) => {
    var [job, setting] = topic.toString().split('/').slice(-2)
    var payload;
    if (setting === "$state"){
      payload = message.toString()
      setJobs((prev) => ({...prev, [job]: {...prev[job], state: payload}}))
    } else {
      payload = parseToType(message.toString(), jobs[job].publishedSettings[setting].type)
      setJobs(prev => {
        const updatedJob = { ...prev[job] };
        const updatedSetting = { ...updatedJob.publishedSettings[setting], value: payload };

        updatedJob.publishedSettings = { ...updatedJob.publishedSettings, [setting]: updatedSetting };

        return { ...prev, [job]: updatedJob };
      });
    }
  }

  const getInicatorLabel = (state, isActive) => {
    if ((state === "disconnected") && isActive) {
      return "Offline"
    }
    else if ((state === "disconnected") && !isActive){
      return "Offline, change inventory status in config.ini"
    }
    else if (state === "lost"){
      return "Lost, something went wrong. Try manually power-cycling the unit."
    }
    else if (state === null){
      return "Waiting for information..."
    }
    else {
      return "Online"
    }
  }

  const getIndicatorDotColor = (state) => {
    if (state === "disconnected") {
      return disconnectedGrey
    }
    else if (state === "lost"){
      return lostRed
    }
    else if (state === null){
      return "#ececec"
    }
    else {
      return "#2FBB39"
    }
  }

  const indicatorDotColor = getIndicatorDotColor(jobs.monitor.state)
  const indicatorDotShadow = 2
  const indicatorLabel = getInicatorLabel(jobs.monitor.state, isUnitActive)

  return (
    <Card  id={unit} aria-disabled={!isUnitActive}>
      <CardContent sx={{p: "10px 20px 20px 20px"}}>
        <Box className={"fixme"}>
          <Typography sx={{fontSize: "13px", color: "rgba(0, 0, 0, 0.60)",}} color="textSecondary">
            {(label) ? unit : ""}
          </Typography>
          <Box sx={(theme) => ({
            display: "flex",
            justifyContent: "space-between",
            [theme.breakpoints.down('md')]:{
              flexFlow: "nowrap",
              flexDirection: "column",
            }
          })}>
            <div style={{display: "flex", justifyContent: "left"}}>
              <Typography sx={{
                  fontSize: 20,
                  color: "rgba(0, 0, 0, 0.87)",
                  fontWeight: 500,
                  ...(isUnitActive ? {} : { color: disabledColor }),
                }}
                gutterBottom>
                <PioreactorIcon color={isUnitActive ? "inherit" : "disabled"} sx={{verticalAlign: "middle", marginRight: "3px", display: {xs: 'none', sm: 'none', md: 'inline' } }}/>
                {(label ) ? label : unit }
              </Typography>
              <Tooltip title={indicatorLabel} placement="right">
                <div>
                  <div className="indicator-dot" style={{boxShadow: `0 0 ${indicatorDotShadow}px ${indicatorDotColor}, inset 0 0 12px  ${indicatorDotColor}`}}/>
                </div>
              </Tooltip>
            </div>
            <Box sx={(theme) => ({
              display: "flex",
              justifyContent: "flex-end",
              flexDirection: "row",
              flexWrap: "wrap",
              [theme.breakpoints.down('md')]: {
                justifyContent: "space-between",
            }})}
            >
              <div>
                <SelfTestDialog
                  client={client}
                  disabled={!isUnitActive}
                  unit={unit}
                  label={label}
                  selfTestState={jobs['self_test'] ? jobs['self_test'].state : null}
                  selfTestTests={jobs['self_test'] ? jobs['self_test'] : null}
                />
              </div>
              <div>
                <FlashLEDButton client={client} disabled={!isUnitActive} unit={unit}/>
              </div>
              <div>
                <CalibrateDialog
                  client={client}
                  odBlankReading={jobs['od_blank'] ? jobs['od_blank'].publishedSettings.means.value : null}
                  odBlankJobState={jobs['od_blank'] ? jobs['od_blank'].state : null}
                  growthRateJobState={jobs['growth_rate_calculating'] ? jobs['growth_rate_calculating'].state : null}
                  stirringCalibrationState={jobs['stirring_calibration'] ? jobs['stirring_calibration'].state : null}
                  experiment={experiment}
                  unit={unit}
                  label={label}
                  disabled={!isUnitActive}
                />
              </div>
              <SettingsActionsDialog
                config={config}
                client={client}
                unit={unit}
                label={label}
                disabled={!isUnitActive}
                experiment={experiment}
                jobs={jobs}
                setLabel={setLabel}
              />
            </Box>
          </Box>
        </Box>


      <Box sx={{
          display: "flex",
          m: "15px 20px 20px 0px",
          flexDirection: "row",
        }}>
        <Box sx={{width: "100px", mt: "10px", mr: "5px"}}>
          <Typography variant="body2">
            <Box fontWeight="fontWeightBold" sx={{ color: !props.isUnitActive ? disabledColor : 'inherit' }}>
              Activities:
            </Box>
          </Typography>
        </Box>
        <RowOfUnitSettingDisplayBox>
          {Object.values(jobs)
              .filter(job => job.metadata.display)
              .map(job => (
            <Box sx={{width: "130px", mt: "10px"}} key={job.metadata.key}>
              <Typography variant="body2" style={{fontSize: "0.84rem"}} sx={{ color: !props.isUnitActive ? disabledColor : 'inherit' }}>
                {job.metadata.display_name}
              </Typography>
              <UnitSettingDisplay
                value={job.state}
                isUnitActive={isUnitActive}
                default="disconnected"
                subtext={job.metadata.subtext ? job.publishedSettings[job.metadata.subtext].value : null}
                isStateSetting
              />
            </Box>
         ))}

        </RowOfUnitSettingDisplayBox>
      </Box>

      <Divider/>

      <Box style={{
          display: "flex",
          m: "15px 20px 20px 0px",
          flexDirection: "row",
        }}>
        <Box sx={{width: "100px", mt: "10px", mr: "5px"}}>
          <Typography variant="body2">
            <Box fontWeight="fontWeightBold" sx={{ color: !props.isUnitActive ? disabledColor : 'inherit' }}>
              Settings:
            </Box>
          </Typography>
        </Box>
        <RowOfUnitSettingDisplayBox>
          {Object.values(jobs)
            //.filter(job => (job.state !== "disconnected") || (job.metadata.key === "leds"))
            .map(job => [job.state, job.metadata.key, job.publishedSettings])
            .map(([state, job_key, settings], index) => (
              Object.entries(settings)
                .filter(([setting_key, setting], _) => setting.display)
                .map(([setting_key, setting], _) =>
                  <Box sx={{width: "130px", mt: "10px"}} key={job_key + setting_key}>
                    <Typography variant="body2" style={{fontSize: "0.84rem"}} sx={{ color: !props.isUnitActive ? disabledColor : 'inherit' }}>
                      {setting.label}
                    </Typography>
                    <UnitSettingDisplay
                      value={setting.value}
                      isUnitActive={isUnitActive}
                      measurementUnit={setting.unit}
                      precision={2}
                      default="—"
                      isLEDIntensity={setting.label === "LED intensity"}
                      isPWMDc={setting.label === "PWM intensity"}
                      config={config}
                    />
                  </Box>
            )))}
        </RowOfUnitSettingDisplayBox>
      </Box>


      </CardContent>
    </Card>
)}



function Charts(props) {
  const [charts, setCharts] = useState({})
  const config = props.config
  const { client, subscribeToTopic, unsubscribeFromTopic } = useMQTT();

  useEffect(() => {
    fetch('/api/contrib/charts')
      .then((response) => response.json())
      .then((data) => {
        setCharts(data.reduce((map, obj) => ((map[obj.chart_key] = obj), map), {}));
      });
  }, []);


  return (
    <React.Fragment>
      {Object.entries(charts)
        .filter(([chart_key, _]) => config['ui.overview.charts'] && (config['ui.overview.charts'][chart_key] === "1"))
        .map(([chart_key, chart]) =>
          <React.Fragment key={`grid-chart-${chart_key}`}>
            <Grid item xs={12}>
              <Card sx={{ maxHeight: "100%"}}>
                <Chart
                  unit={props.unit}
                  key={`chart-${chart_key}`}
                  chartKey={chart_key}
                  config={config}
                  dataSource={chart.data_source}
                  title={chart.title}
                  topic={chart.mqtt_topic}
                  payloadKey={chart.payload_key}
                  yAxisLabel={chart.y_axis_label}
                  experiment={props.experimentMetadata.experiment}
                  deltaHours={props.experimentMetadata.delta_hours}
                  experimentStartTime={props.experimentMetadata.created_at}
                  downSample={chart.down_sample}
                  interpolation={chart.interpolation || "stepAfter"}
                  yAxisDomain={chart.y_axis_domain ? chart.y_axis_domain : null}
                  lookback={props.timeWindow ? props.timeWindow : (chart.lookback ? eval(chart.lookback) : 10000)}
                  fixedDecimals={chart.fixed_decimals}
                  relabelMap={props.relabelMap}
                  yTransformation={eval(chart.y_transformation || "(y) => y")}
                  dataSourceColumn={chart.data_source_column}
                  isPartitionedBySensor={chart_key === "raw_optical_density"}
                  isLiveChart={true}
                  byDuration={props.timeScale === "hours"}
                  client={client}
                  subscribeToTopic={subscribeToTopic}
                  unsubscribeFromTopic={unsubscribeFromTopic}
                  unitsColorMap={props.unitsColorMap}
                />
              </Card>
            </Grid>
          </React.Fragment>
     )}
    </React.Fragment>
)}




function Pioreactor({title}) {
  const { experimentMetadata } = useExperiment();
  const [config, setConfig] = useState({})
  const {unit} = useParams();
  const [assignedExperiment, setAssignedExperiment] = useState(null)
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState(null)


  useEffect(() => {
    document.title = title;
    getConfig(setConfig)
  }, [title]);

  useEffect(() => {
    function getWorkerAssignment() {
      fetch(`/api/workers/${unit}/experiment`)
        .then((response) => {
          if (!response.ok) {
            return response.json().then((errorData) => {
              console.log(errorData)
              throw new Error(errorData.error);
            });
          }
          return response.json();
        })
        .then((json) => {
        setAssignedExperiment(json['experiment'])
        setIsActive(json['is_active'])
      })
      .catch((error) => {
        setError(error.message);
      });
    }

    if (experimentMetadata){
      getWorkerAssignment()
    }
  }, [experimentMetadata])


  if (error) {
    return (
      <Box sx={{textAlign: "center", mb: '50px', mt: "50px"}}>
        <Typography component='div' variant='body2'>
           {error}
        </Typography>
      </Box>
  )}
  else {
    return (
      <MQTTProvider name={unit} config={config} experiment={experimentMetadata.experiment}>
        <Grid container rowSpacing={1} columnSpacing={2} justifyContent="space-between">
          <Grid item md={12} xs={12}>
            <PioreactorHeader unit={unit} assignedExperiment={assignedExperiment} isActive={isActive}/>
            {experimentMetadata.experiment && assignedExperiment && experimentMetadata.experiment !== assignedExperiment &&
            <Box>
              <Alert severity="info" style={{marginBottom: '10px', marginTop: '10px'}}>This worker is part of different experiment, <i>{assignedExperiment}</i>. Switch to the experiment <i>{assignedExperiment}</i> to control this worker.</Alert>
            </Box>
          }
          </Grid>
          <Grid item lg={8} md={12} xs={12}>
            <UnitCard isActive={isActive} isAssignedToExperiment={experimentMetadata.experiment === assignedExperiment} unit={unit} experiment={experimentMetadata.experiment} config={config}/>
          </Grid>
          <Grid item lg={4} md={12} xs={12}>
            <BioreactorDiagram  experiment={experimentMetadata.experiment} unit={unit} config={config}/>
          </Grid>

          <Grid item xs={12} md={7} container spacing={2} justifyContent="flex-start" style={{height: "100%"}}>
            <Charts unit={unit} unitsColorMap={{[unit]: colors[0]}} config={config} timeScale={"clock_time"} timeWindow={10000000} experimentMetadata={experimentMetadata}/>
          </Grid>
          <Grid item xs={12} md={5} container spacing={1} justifyContent="flex-end" style={{height: "100%"}}>
            <Grid item xs={12}>
              <LogTableByUnit experiment={experimentMetadata.experiment} unit={unit}/>
            </Grid>
          </Grid>
        </Grid>
      </MQTTProvider>
    )
  }
}

export default Pioreactor;

