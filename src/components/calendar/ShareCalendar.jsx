import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import ConnectWithoutContactIcon from "@mui/icons-material/ConnectWithoutContact";

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
    width: "180px",
    padding: "10px 10px",
    marginRight: "10px",
  },
}));

function ShareCalendar(props) {

  const initialValue = {
    inputValue: "",
    selectValue: "",
  };

  const [shareEmail, setShareEmail] = useState(initialValue);
  const [emailList, setemailList] = useState([]);
  const [open, setOpen] = useState(false);
  const { inputValue, selectValue } = shareEmail;

  const handleChange = (e) => {
    setShareEmail((shareEmail) => ({
      ...shareEmail,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClickOpen = (event) => {
    setOpen(true);
    event.preventDefault();
  };

  function getRandomColor() {
    // Generate a random color in hexadecimal format
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  const addEmail = () => {
    if (inputValue.trim() !== "") {
      // Create a new todo object with properties
      const firstLetter = inputValue[0].toUpperCase();
      const newTodoObject = {
        email: inputValue,
        avatarBackgroundColor: getRandomColor(), // Initially set as not completed
        firstLetter,
      };

      // Add the new todo object to the todos array
      setemailList([...emailList, newTodoObject]);
    }
  };

  const deleteEmail = (index) => {
    const updatedEmailList = [...emailList];
    updatedEmailList.splice(index, 1);
    setemailList(updatedEmailList);
  };

  const onSubmit = () => {
    addEmail();
    setShareEmail({ inputValue: "", selectValue: "" });
    handleClose();
  };

  const { onHide, visible } = props;
  return (
    <Dialog open={visible} onClose={onHide} maxWidth="sm" fullWidth={true}>
      <StyledDiv>
        <DialogTitle style={{ height: "70px" }} className={classes.wrapper}>
          <h5 className={classes.titleText}>Sharing and permissions</h5>
          <IconButton
            className={classes.closeButton}
            onClick={onHide}
            size="large"
          >
            <Close color="action" />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ paddingBottom: "70px" }}>
          <h3 style={{ color: "#2196F3" }}>Calendar</h3>
          <p style={{ color: "gray", fontSize: "14px" }}>
            Send a sharing invitation in email. You can choose how much access
            to allow and change access settings any time.
          </p>
          <Dialog onClose={handleClose} open={open}>
            <DialogTitle style={{ height: "30px" }}>Select</DialogTitle>
            <List>
              <ListItem
                secondaryAction={
                  <IconButton edge="end" aria-label="delete">
                    <DeleteIcon onClick={handleClose} />
                  </IconButton>
                }
              >
                <ListItemText primary={inputValue} secondary={inputValue} />
              </ListItem>
            </List>
            <select
              style={{ margin: "0 0 10px", padding: "10px 0px" }}
              onChange={(e)=> setShareEmail((shareEmail) => ({...shareEmail,selectValue: e.target.value}))}
            >
              <option value="1">Can view all details</option>
              <option value="2">Can edit</option>
            </select>
            <Button variant="contained" size="medium" onClick={onSubmit}>
              Share
            </Button>
          </Dialog>

          <form className={classes.wrapper} onSubmit={handleClickOpen}>
            <input
              type="email"
              placeholder="Enter your email"
              className={classes.input}
              required
              value={inputValue}
              name="inputValue"
              onChange={handleChange}
            />
            <Button variant="contained" size="medium" type="submit">
              Share
            </Button>
          </form>
          {emailList.length != 0 ? (
            <span>
              <hr
                style={{
                  margin: "20px 0 25px",
                  opacity: "0.2",
                  fontWeight: "400",
                }}
              />
              <p>Currently sharing with:</p>
              <List>
                {emailList?.map((email, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <div>
                        <select
                          onChange={handleChange}
                          value={selectValue}
                          name="selectValue"
                          className={classes.select}
                        >
                          <option value="1">Can view all details</option>
                          <option value="2">Can edit</option>
                        </select>
                        <IconButton edge="end" aria-label="delete">
                          <DeleteIcon onClick={deleteEmail} />
                        </IconButton>
                      </div>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        style={{ background: email.avatarBackgroundColor }}
                      >
                        {email.firstLetter}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={email.text}
                      secondary={email.email}
                    />
                  </ListItem>
                ))}
              </List>
            </span>
          ) : (
            <div
              className={classes.wrapper}
              style={{ justifyContent: "center" }}
            >
              <ConnectWithoutContactIcon
                style={{ color: "#2196F3", fontSize: "200px" }}
              />
            </div>
          )}
        </DialogContent>
      </StyledDiv>
    </Dialog>
  );
}

export default ShareCalendar;
