import React from "react";

import FormControl from '@mui/material/FormControl';
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { makeStyles } from '@mui/styles';
import Select from '@mui/material/Select';
import {Typography} from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import CardContent from '@mui/material/Card';
import {getConfig} from "./utilities"
import InputLabel from '@mui/material/InputLabel';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DisplayProfile from "./components/DisplayProfile"
import DisplaySourceCode from "./components/DisplaySourceCode"
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import {runPioreactorJob} from "./utilities"
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Link } from 'react-router-dom';
import SelectButton from "./components/SelectButton";
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewTimelineOutlinedIcon from '@mui/icons-material/ViewTimelineOutlined';
import { Client, Message } from "paho-mqtt";


const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: "15px"
  },
  formControl: {
    margin: theme.spacing(2),
  },
  title: {
    fontSize: 14,
  },
  cardContent: {
    padding: "10px"
  },
  pos: {
    marginBottom: 0,
  },
  caption: {
    marginLeft: "30px",
    maxWidth: "650px"
  },
  headerMenu: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
    [theme.breakpoints.down('lg')]:{
      flexFlow: "nowrap",
      flexDirection: "column",
    }
  },
  headerButtons: {display: "flex", flexDirection: "row", justifyContent: "flex-start", flexFlow: "wrap"},
  textIcon: {
    verticalAlign: "middle",
    margin: "0px 3px"
  },
}));


function ExperimentProfilesContent(props) {
  const classes = useStyles();
  const config = props.config

  const [experimentProfilesAvailable, setExperimentProfilesAvailable] = React.useState([])
  const [selectedExperimentProfile, setSelectedExperimentProfile] = React.useState('')
  const [confirmed, setConfirmed] = React.useState(false)
  const [viewSource, setViewSource] = React.useState(false)
  const [source, setSource] = React.useState("")
  const [dryRun, setDryRun] = React.useState(false)
  const [isProfileActive, setIsProfileActive] = React.useState(false)
  const [experimentMetadata, setExperimentMetadata] = React.useState({})
  const [client, setClient] = React.useState(null);
  const [runningProfileName, setRunningProfileName] = React.useState(null);


  React.useEffect(() => {
    fetch("/api/contrib/experiment_profiles")
      .then(response => {
        return response.json();
      })
      .then(profiles => {
        const profilesByKey = profiles.reduce((acc, cur) => ({ ...acc, [cur.file]: cur.experimentProfile}), {})
        setExperimentProfilesAvailable(profilesByKey)
        setSelectedExperimentProfile(Object.keys(profilesByKey)[0] ?? "")
      })
    fetch("/api/experiments/latest")
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setExperimentMetadata(data)
      });

  }, [])


  React.useEffect(() => {
    if (!config['cluster.topology']){
      return
    }

    if (experimentMetadata.length === 0){
      return
    }

    const onSuccess = () => {
      client.subscribe(`pioreactor/${config['cluster.topology']?.leader_hostname}/${experimentMetadata.experiment}/experiment_profile/+`, { qos: 1 })
    }

    var client
    if (config.remote && config.remote.ws_url) {
      client = new Client(
        `ws://${config.remote.ws_url}/`,
        "webui_Profiles" + Math.floor(Math.random()*10000)
      )}
    else {
      client = new Client(
        `${config['cluster.topology']['leader_address']}`, 9001,
        "webui_Profiles" + Math.floor(Math.random()*10000)
      );
    }
    client.connect({userName: 'pioreactor', password: 'raspberry', onSuccess: onSuccess});
    client.onMessageArrived = onMessageArrived;
    setClient(client)

  },[config, experimentMetadata])


  const onMessageArrived = (message) => {
    const payload = message.payloadString
    const setting = message.topic.split("/")[4]
    if ((setting === "$state") && (payload === "ready")){
      setIsProfileActive(true)
    }
    else if ((setting === "$state") && (payload === "disconnected")){
      setIsProfileActive(false)
    }
    else if(setting === "experiment_profile_name") {
      setRunningProfileName(payload === "" ? null : payload)
      props.setRunningProfileName(payload === "" ? null : payload)
    }
  }

  const onSubmit = () => runPioreactorJob(config['cluster.topology']?.leader_hostname, 'experiment_profile', ['execute', selectedExperimentProfile], dryRun ? {'dry-run': null} : {}, () => setConfirmed(true))

  const onStop = () => {
    var message = new Message("disconnected");
    message.destinationName = `pioreactor/${config['cluster.topology']?.leader_hostname}/${experimentMetadata.experiment}/experiment_profile/$state/set`
    client.publish(message)
    setIsProfileActive(false)
  }

  const onSelectExperimentProfileChange = (e) => {
    setSelectedExperimentProfile(e.target.value)
    setViewSource(false)
  }

  const deleteProfile = () => {
    fetch(`/api/contrib/experiment_profiles/${selectedExperimentProfile.split('/').pop()}`, {
          method: "DELETE",
      }).then(res => {
          if (res.ok) {
            window.location.reload();
          }
      })
  }

  const getSourceAndView = (e) => {
    if (!viewSource){
      fetch(`/api/contrib/experiment_profiles/${selectedExperimentProfile.split('/').pop()}`, {
            method: "GET",
        }).then(res => {
          if (res.ok) {
            return res.text();
          }
        }).then(text => {
          setSource(text)
        })
    }
    setViewSource(!viewSource)
  }


  return (
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <div style={{width: "100%", margin: "10px", display: "flex", justifyContent:"space-between"}}>
            <FormControl style={{minWidth: "300px"}}>
              <FormLabel component="legend">Experiment profile</FormLabel>
              <Select
                labelId="profileSelect"
                variant="standard"
                value={selectedExperimentProfile}
                onChange={onSelectExperimentProfileChange}
                label="Experiment profile"
              >
                {Object.keys(experimentProfilesAvailable).map((file) => {
                  const profile = experimentProfilesAvailable[file]
                  return <MenuItem key={file} value={file}>{profile.experiment_profile_name} (from {file.split('/').pop()})</MenuItem>
                  }
                )}
              </Select>
            </FormControl>
          </div>
        </Grid>
        <Grid item xs={2} />
        <Grid container item xs={4} direction="column" alignItems="flex-end">
          <Grid item xs={4} />
          <Grid item xs={8} >
            <Button
              variant="text"
              size="small"
              color="primary"
              aria-label="edit source code"
              style={{textTransform: "none"}}
              to={`/edit-experiment-profile?profile=${selectedExperimentProfile.split("/").pop()}`}
              component={Link}
              disabled={isProfileActive}
            >
              <EditIcon fontSize="15" classes={{root: classes.textIcon}} /> Edit
            </Button>
            <Button
              variant="text"
              size="small"
              color="primary"
              aria-label="view source code"
              disabled={selectedExperimentProfile === ""}
              onClick={getSourceAndView}
              style={{textTransform: "none"}}
            >
              <CodeIcon fontSize="15" classes={{root: classes.textIcon}} /> {viewSource ? "View description": "View source"}
            </Button>
            <Button
              variant="text"
              size="small"
              color="secondary"
              aria-label="delete profile"
              onClick={deleteProfile}
              style={{marginRight: "10px", textTransform: "none"}}
            >
              <DeleteIcon fontSize="15" classes={{root: classes.textIcon}} /> Delete
            </Button>
          </Grid>

        </Grid>

        <Grid item xs={12}>
          {selectedExperimentProfile !== "" && !viewSource &&
            <DisplayProfile data={experimentProfilesAvailable[selectedExperimentProfile]} />
          }
          {selectedExperimentProfile !== "" && viewSource &&
            <DisplaySourceCode sourceCode={source}/>
          }
        </Grid>
        <div style={{display: "flex", justifyContent: "flex-end", marginLeft: "20px"}}>
            <SelectButton
              variant="contained"
              color="primary"
              value={dryRun ? "execute_dry_run" : "execute"}
              onClick={onSubmit}
              endIcon={dryRun ? <VisibilityIcon />  : <PlayArrowIcon />}
              disabled={(selectedExperimentProfile === "") || confirmed || (isProfileActive)}
              onChange={({target: { value } }) =>
                setDryRun(value === "execute_dry_run")
              }
            >
              <MenuItem value={"execute"}>Run profile</MenuItem>
              <MenuItem value={"execute_dry_run"}>Preview profile</MenuItem>
           </SelectButton>
          <Button
            variant="text"
            color="secondary"
            style={{marginLeft: "20px"}}
            onClick={onStop}
            endIcon={ <CloseIcon /> }
            disabled={!isProfileActive}
          >
            Stop
         </Button>
        </div>
      </Grid>
  );
}

function ProfilesContainer(props){
  const classes = useStyles();
  const [runningProfileName, setRunningProfileName] = React.useState(null)

  return(
    <React.Fragment>
      <div>
        <div className={classes.headerMenu}>
          <Typography variant="h5" component="h2">
            <Box fontWeight="fontWeightBold">
              Experiment Profiles
            </Box>
          </Typography>
          <div className={classes.headerButtons}>
            <Button to={`/create-experiment-profile`} component={Link} style={{textTransform: 'none', marginRight: "0px", float: "right"}} color="primary">
              <AddIcon fontSize="15" classes={{root: classes.textIcon}}/> Create new profle
            </Button>
          </div>
        </div>
        <Divider/>
        <div style={{margin: "10px 2px 10px 2px", display: "flex", flexDirection: "row", justifyContent: "flex-start", flexFlow: "wrap"}}>
          <Typography variant="subtitle2" style={{flexGrow: 1}}>
            <div style={{display:"inline"}}>
              <Box fontWeight="fontWeightBold" style={{display:"inline-block"}}>
                <ViewTimelineOutlinedIcon style={{ fontSize: 12, verticalAlign: "-1px" }}/> Profile running:&nbsp;
              </Box>
              <Box fontWeight="fontWeightRegular" style={{marginRight: "1%", display:"inline-block"}}>
                {runningProfileName ?? "None"}
              </Box>
            </div>

          </Typography>
        </div>

      </div>
      <Card className={classes.root}>
        <CardContent className={classes.cardContent}>
          <ExperimentProfilesContent config={props.config} setRunningProfileName={setRunningProfileName}/>
          <p style={{textAlign: "center", marginTop: "30px"}}>Learn more about <a href="https://docs.pioreactor.com/user-guide/experiment-profiles" target="_blank" rel="noopener noreferrer">experiment profiles</a>.</p>
        </CardContent>
      </Card>
    </React.Fragment>
)}


function Profiles(props) {
    const [config, setConfig] = React.useState({})

    React.useEffect(() => {
      getConfig(setConfig)
    }, [])

    React.useEffect(() => {
      document.title = props.title;
    }, [props.title]);
    return (
        <Grid container spacing={2} >
          <Grid item md={12} xs={12}>
            <ProfilesContainer config={config}/>
          </Grid>
        </Grid>
    )
}

export default Profiles;
