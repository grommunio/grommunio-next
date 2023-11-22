import { Fragment, KeyboardEvent, MouseEvent, useEffect, useState } from "react";
import { useTypeDispatch, useTypeSelector } from "../../store";
import { useAppContext } from "../../azure/AppContext";
import { Box, Collapse, IconButton, Input, List, ListItemButton, ListItemSecondaryAction, ListItemText, Menu, MenuItem } from "@mui/material";
import AddCalendar from "./AddCalendar";
import { BsCalendarPlus } from "react-icons/bs";
import { KeyboardArrowDown, MoreVert, CalendarMonth } from "@mui/icons-material";
import { Calendar } from "microsoft-graph";
import { fetchEventsData, patchCalendarData } from "../../actions/calendar";


type MenuProps = {
  anchor: HTMLElement | null;
  calendar: Calendar;
}

const UserCalenders = () => {
  const data = useTypeSelector(state => state.calendar.calendars);
  const [open, setOpen] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<Calendar | null>(data[0] || null);
  const dispatch = useTypeDispatch();
  const app = useAppContext();
  const [adding, setAdding] = useState<boolean>(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuProps | null>();
  const [editing, setEditing] = useState<string>("");
  const [editTextfield, setEditTextfield] = useState<string>("");


  const handleMenu = (item: Calendar) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor({anchor: e.currentTarget, calendar: item });
  }

  const handleEdit = () => {
    setMenuAnchor(null);
    setEditTextfield(menuAnchor?.calendar.name || "");
    setEditing(menuAnchor?.calendar.id || "");
  }

  const handleCalendarClick = (item: Calendar) => () => {
    setSelectedItem(item);
    if(selectedItem?.id !== item?.id) dispatch(fetchEventsData({ app, id: item.id }));
  }

  const handleDialog = (open: boolean) => () => {
    setAdding(open);
  }

  // Focus edit textfield
  useEffect(() => {
    const input = document.getElementById(editing + "-textfield") as HTMLInputElement;
    if(input) {
      input.focus();
      input.select();
    }
  }, [editing]);

  // Set selected calendar on load
  useEffect(() => {
    if(!selectedItem) {
      setSelectedItem(data[0] || null);
    }
  }, [data]);

  const handleEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter') {
      dispatch(patchCalendarData({ id: editing, updateCalendar: editTextfield }))
        .then(() => setEditing(""));
    }
    if(e.key === "Escape") {
      setEditing("");
    }
  }

  return (
    <Box sx={{ pb: open ? 2 : 0 }}>
      <AddCalendar
        onHide={handleDialog(false)}
        visible={adding}
      />
      <ListItemButton alignItems="flex-start" onClick={handleDialog(true)}>
        <BsCalendarPlus />
        <ListItemText primary="Add calendar" sx={{ my: 0, pl: 2 }} />
      </ListItemButton>
      <List>
        <ListItemButton alignItems="flex-start" onClick={() => setOpen(!open)}>
          <KeyboardArrowDown
            sx={{
              mr: -1,
              transform: open ? "rotate(0)" : "rotate(-90deg)",
              transition: "0.2s",
            }}
          />
          <ListItemText primary="My Calenders" sx={{ my: 0, pl: 2 }} />
        </ListItemButton>
        <Collapse in={open}>
          {data?.map((item: Calendar, index: number) => <Fragment key={index}>
            <Input
              id={`${item.id}-textfield`}
              value={editTextfield}
              onChange={e => setEditTextfield(e.target.value)}
              autoFocus
              style={editing === item.id ? { marginLeft: 56 } : { display: "none" }}
              onKeyDown={handleEnter}
            />
            {editing !== item.id && <ListItemButton
              key={index}
              selected={selectedItem?.id === item.id}
              onClick={handleCalendarClick(item)}
              style={{
                height: 38,
              }}
            >
              <CalendarMonth fontSize="small" />
              <ListItemText
                primary={item.name}
                primaryTypographyProps={{ ml: 2 }}
              />
              <ListItemSecondaryAction>
                <IconButton disabled={index === 0} onClick={handleMenu(item)}>
                  <MoreVert fontSize="small"/>
                </IconButton>
              </ListItemSecondaryAction>
            </ListItemButton>}
          </Fragment>
            
          )}
        </Collapse>
        <Menu
          anchorEl={menuAnchor?.anchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={handleEdit}>
            Edit
          </MenuItem>
        </Menu>
        
      </List>
    </Box>
  );
};

export default UserCalenders;