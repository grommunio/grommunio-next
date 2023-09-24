import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { fetchUserCalenders, patchCalendarData } from "../../actions/calendar";
import { connect } from "react-redux";

const PREFIX = "Demo";
const classes = {
  wrapper: `${PREFIX}-wrapper`,
  titleText: `${PREFIX}-titleText`,
  input: `${PREFIX}-input`,
  select: `${PREFIX}-select`,
};

const StyledDiv = styled("div")(({ theme }) => ({
  [`& .${classes.wrapper}`]: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  [`& .${classes.titleText}`]: {
    fontSize: "21px",
    fontWeight: 300,
    color: "gray",
  },
  [`& .${classes.input}`]: {
    border: "2px #2196F3 solid",
    width: "83%",
    padding: "10px 10px",
    outline: "#2196F3",
  },
  [`& .${classes.select}`]: {
    border: "2px #2196F3 solid",
    width: "83%",
    padding: "10px 10px",
    outline: "#2196F3",
    marginBottom: "50px",
  },
}));

function CustomTabPanel(props) {
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

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function AddCalendar(props) {
  const initialValue = {
    updatedData: "",
    calenderid: "",
  };

  const { onHide, visible, fetchUserCalenders, calendar, patchCalendarData } = props;

  useEffect(() => {
    fetchUserCalenders();
  }, []);

  const [createCalender, setCreateCalender] = useState(initialValue);
  const { updatedData, calenderid } = createCalender;
  const [value, setValue] = useState("1");

  const handleChange = (e) => {
    setCreateCalender((shareEmail) => ({
      ...shareEmail,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChange2 = (event, newValue) => {
    setValue(newValue);
  };

  const onSubmit = (e) => {
    if ((calenderid, updatedData)) {
      patchCalendarData(calenderid.toString(), updatedData);
    }

    e.preventDefault(); // Use lowercase 'p' in 'preventDefault'

    // Assuming setShareEmail is a state updater function
    setCreateCalender({ updatedData: "", calenderid: "" });
    onHide();
  };

  return (
    <Dialog open={visible} onClose={onHide} maxWidth="sm" fullWidth={true}>
      <StyledDiv>
        <DialogTitle style={{ height: "70px" }} className={classes.wrapper}>
          <h5 className={classes.titleText}>Calender</h5>
          <IconButton
            className={classes.closeButton}
            onClick={onHide}
            size="large"
          >
            <Close color="action" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs
            value={value}
            onChange={handleChange2}
            aria-label="basic tabs example"
          >
            <Tab label="ADD" {...a11yProps(0)} />
            <Tab label="EDIT" {...a11yProps(1)} />
          </Tabs>
          <CustomTabPanel value={value} index={0}>
            <form className={classes.wrapper} onSubmit={onSubmit}>
              <input
                type="text"
                placeholder="Add calendar"
                className={classes.input}
                required
                value={updatedData}
                name="updatedData"
                onChange={handleChange}
              />
              <Button variant="contained" size="medium" type="submit">
                Add
              </Button>
            </form>
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <select
              className={classes.select}
              value={calenderid}
              name="calenderid"
              onChange={handleChange}
            >
              <option value="">select calendar</option>
              {calendar?.map((item) => (
                <option value={item.id}>{item.name}</option>
              ))}
            </select>
            <form className={classes.wrapper} onSubmit={onSubmit}>
              <TextField
                style={{ width: "80%" }}
                id="standard-basic"
                variant="standard"
                value={updatedData}
                name="updatedData"
                placeholder="Edit calendar"
                onChange={handleChange}
              />
              <Button variant="contained" size="medium" type="submit">
                Edit
              </Button>
            </form>
          </CustomTabPanel>
        </DialogContent>
      </StyledDiv>
    </Dialog>
  );
}

const mapStateToProps = (state) => {
  const { calendar } = state;
  return {
    calendar: calendar.calendar,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    patchCalendarData: async (params) =>
      await dispatch(patchCalendarData(params)),
    fetchUserCalenders: async (params) =>
      await dispatch(fetchUserCalenders(params)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AddCalendar);
