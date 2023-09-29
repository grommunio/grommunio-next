import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import { useState } from "react";
import {
  postUserCalendar,
  patchCalendarData
} from "../../actions/calendar";
import { useTypeDispatch } from "../../store";

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


function AddandEditCalendar(props) {

  const { onHide, visible, switchside, id, name } = props;

  const [createCalender, setCreateCalender] = useState("");

  const dispatch = useTypeDispatch();

  const handleChange = (e) => {
    setCreateCalender(e.target.value)
  };

  const onSubmit = (e) => {
    if (switchside === true) {
      dispatch(postUserCalendar(createCalender));
    } else {
      dispatch(patchCalendarData({ id: id, updateCalendar: createCalender }))
    }
    e.preventDefault();
    setCreateCalender()
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
          <form className={classes.wrapper} onSubmit={onSubmit}>
            <input
              type="text"
              placeholder={name}
              className={classes.input}
              required
              value={createCalender}
              onChange={handleChange}
            />
            <Button variant="contained" size="medium" type="submit">
              {switchside ? "Add" : "Edit"}
            </Button>
          </form>
        </DialogContent>
      </StyledDiv>
    </Dialog>
  );
}



export default AddandEditCalendar;
