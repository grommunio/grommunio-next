import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import {
  postUserCalendar,
} from "../../actions/calendar";
import { useTypeDispatch } from "../../store";

const PREFIX = "Demo";
const classes = {
  wrapper: `${PREFIX}-wrapper`,
  titleText: `${PREFIX}-titleText`,
  input: `${PREFIX}-input`,
  select: `${PREFIX}-select`,
};

const StyledDiv = styled("div")(() => ({
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


function AddCalendar(props) {
  const { onHide, visible } = props;
  const [name, setName] = useState("");

  const dispatch = useTypeDispatch();

  const handleChange = (e) => {
    setName(e.target.value)
  };

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(postUserCalendar(name));
    setName("");
    onHide();
  };

  return (
    <Dialog open={visible} onClose={onHide} maxWidth="sm" fullWidth={true}>
      <FormControl component="form" className={classes.wrapper} onSubmit={onSubmit}>
        <StyledDiv>
          <DialogTitle style={{ height: "70px" }} className={classes.wrapper}>
            New calender
          </DialogTitle>
          <DialogContent>
            <TextField
              style={{ marginTop: 8 }}
              value={name}
              onChange={handleChange}
              label="Name"
              fullWidth
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button
              className={classes.closeButton}
              onClick={onHide}
              size="large"
              color="secondary"
            >
              {"Close"}
            </Button>
            <Button variant="contained" onClick={onSubmit}>
              {"Add"}
            </Button>
          </DialogActions>
        </StyledDiv>
      </FormControl>
    </Dialog>
  );
}



export default AddCalendar;
