// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, ButtonGroup, Chip, Divider, IconButton, Link, ListItemIcon, ListItemText, Menu, MenuItem, Popover, TextField, Tooltip, Typography } from "@mui/material";
import { ArrowDropDown, Check, CheckBox, CheckBoxOutlineBlank, Close, DeleteOutline, Edit, HelpOutline, LocationOnOutlined, LockOutlined, PeopleAltOutlined, Repeat, Schedule, Videocam } from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { deleteEvent, DeleteMode, refreshEvents, respondToEvent } from "../calendarSlice";
import { deleteModeFor, safeHttpUrl } from "../eventUtils";
import { EventReponseType } from "../../../types/calendar";
import { formatEventRange } from "../dates";
import type { CalendarEvent } from "../types";
import { presetColor } from "../../mail/categories";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DeclineDeleteDialog from "./DeclineDeleteDialog";

type EventPopoverProps = {
  event: CalendarEvent;
  anchorPosition: { top: number; left: number };
  onClose: () => void;
  onEdit: (scope: "occurrence" | "series") => void;
};

const EventPopover = ({ event, anchorPosition, onClose, onEdit }: EventPopoverProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const calendar = useTypeSelector(state => state.calendar.calendars.find(c => c.id === event.calendarId));
  const categories = useTypeSelector(state => state.mail.categories);
  // The prop is a snapshot from the click; the store has the latest response
  const liveResponse = useTypeSelector(state => state.calendar.events[event.calendarId]?.find(e => e.id === event.id)?.responseStatus?.response);
  const [scopeMenu, setScopeMenu] = useState<{ anchor: HTMLElement; action: "edit" | "delete" } | null>(null);
  const [confirm, setConfirm] = useState<"occurrence" | "series" | null>(null);
  const [rsvpMenu, setRsvpMenu] = useState<HTMLElement | null>(null);
  const [sendResponse, setSendResponse] = useState(true);
  const [respondToSeries, setRespondToSeries] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  const recurring = event.type === "occurrence" || event.type === "exception" || event.type === "seriesMaster";
  const readOnly = Boolean(event.readOnly);
  const isOrganizer = event.isOrganizer !== false && !readOnly;
  const response = liveResponse ?? event.responseStatus?.response;
  const attendees = event.attendees || [];
  const hasAttendees = attendees.length > 0;
  const deleteMode = deleteModeFor(event);
  const joinUrl = safeHttpUrl(event.onlineMeeting?.joinUrl || event.onlineMeetingUrl);

  const withScope = (action: "edit" | "delete") => (e: React.MouseEvent<HTMLElement>) => {
    if (recurring) setScopeMenu({ anchor: e.currentTarget, action });
    else if (action === "edit") onEdit("occurrence");
    else setConfirm("occurrence");
  };

  const chooseScope = (scope: "occurrence" | "series") => {
    const action = scopeMenu?.action;
    setScopeMenu(null);
    if (action === "edit") onEdit(scope);
    else setConfirm(scope);
  };

  const handleDelete = async (mode: DeleteMode, message?: string) => {
    const id = confirm === "series" && event.seriesMasterId ? event.seriesMasterId : event.id!;
    const result = await dispatch(deleteEvent({ id, mode, comment: message || undefined }));
    if (deleteEvent.fulfilled.match(result)) onClose();
  };

  const respond = async (type: EventReponseType) => {
    const series = respondToSeries && Boolean(event.seriesMasterId);
    const result = await dispatch(respondToEvent({ id: series ? event.seriesMasterId! : event.id!, response: type, comment: comment.trim() || undefined, sendResponse }));
    if (!respondToEvent.fulfilled.match(result)) return;
    setComment("");
    setShowComment(false);
    // Declines refresh on their own; series responses change every occurrence
    if (series && type !== EventReponseType.decline) dispatch(refreshEvents());
  };

  return (
    <Popover open anchorReference="anchorPosition" anchorPosition={anchorPosition} onClose={onClose} PaperProps={{ sx: { width: 360, maxWidth: "95vw" } }}>
      <Box sx={{ height: 6, bgcolor: event.color }} />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Typography variant="h6" sx={{ flex: 1, lineHeight: 1.3, wordBreak: "break-word" }}>
            {event.sensitivity === "private" && <LockOutlined fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />}
            {event.subject || t("(No title)")}
          </Typography>
          {isOrganizer && <Tooltip title={t("Edit")}><IconButton size="small" onClick={withScope("edit")} aria-label={t("Edit")}><Edit fontSize="small" /></IconButton></Tooltip>}
          {!isOrganizer && !readOnly && <Tooltip title={t("Details")}><IconButton size="small" onClick={() => onEdit("occurrence")} aria-label={t("Details")}><Edit fontSize="small" /></IconButton></Tooltip>}
          {!readOnly && <Tooltip title={t("Delete")}><IconButton size="small" onClick={withScope("delete")} aria-label={t("Delete")}><DeleteOutline fontSize="small" /></IconButton></Tooltip>}
          <IconButton size="small" onClick={onClose} aria-label={t("Close")}><Close fontSize="small" /></IconButton>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, color: "text.secondary" }}>
          <Schedule fontSize="small" />
          <Typography variant="body2">{formatEventRange(event.start_, event.end_, Boolean(event.isAllDay))}</Typography>
        </Box>
        {recurring && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5, color: "text.secondary" }}>
            <Repeat fontSize="small" />
            <Typography variant="body2">{t("Repeats")}</Typography>
          </Box>
        )}
        {event.location?.displayName && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5, color: "text.secondary" }}>
            <LocationOnOutlined fontSize="small" />
            <Typography variant="body2">{event.location.displayName}</Typography>
          </Box>
        )}
        {joinUrl && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
            <Videocam fontSize="small" color="action" />
            <Link href={joinUrl} target="_blank" rel="noopener noreferrer" variant="body2">{t("Join online meeting")}</Link>
          </Box>
        )}
        {hasAttendees && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mt: 0.5, color: "text.secondary" }}>
            <PeopleAltOutlined fontSize="small" />
            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
              {event.organizer?.emailAddress?.name && <>{event.organizer.emailAddress.name} ({t("Organizer")})<br /></>}
              {attendees.slice(0, 5).map(a => a.emailAddress?.name || a.emailAddress?.address).join(", ")}{attendees.length > 5 ? ` +${attendees.length - 5}` : ""}
            </Typography>
          </Box>
        )}
        {Boolean(event.categories?.length) && (
          <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
            {event.categories!.map(c => <Chip key={c} size="small" label={c} icon={<Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: presetColor(categories.find(x => x.displayName === c)?.color), ml: 1 }} />} />)}
          </Box>
        )}
        {event.bodyPreview && (
          <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary", whiteSpace: "pre-line", maxHeight: 96, overflow: "hidden" }}>{event.bodyPreview}</Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>{calendar?.name}</Typography>
      </Box>
      {!isOrganizer && !readOnly && (
        <>
          <Divider />
          <Box sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>{t("RSVP")}</Typography>
            <ButtonGroup size="small" variant="outlined">
              <Button color="success" variant={response === "accepted" ? "contained" : "outlined"} startIcon={<Check />} onClick={() => respond(EventReponseType.accept)}>{t("Yes")}</Button>
              <Button color="warning" variant={response === "tentativelyAccepted" ? "contained" : "outlined"} startIcon={<HelpOutline />} onClick={() => respond(EventReponseType.tentatively)}>{t("Maybe")}</Button>
              <Button color="error" variant={response === "declined" ? "contained" : "outlined"} startIcon={<Close />} onClick={() => respond(EventReponseType.decline)}>{t("No")}</Button>
            </ButtonGroup>
            <Tooltip title={t("Response options")}>
              <IconButton size="small" onClick={e => setRsvpMenu(e.currentTarget)} aria-label={t("Response options")} aria-haspopup="menu"><ArrowDropDown fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
          {showComment && (
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <TextField fullWidth size="small" multiline maxRows={4} autoFocus placeholder={t("Add a message")} value={comment} onChange={e => setComment(e.target.value)} inputProps={{ "aria-label": t("Add a message") }} />
            </Box>
          )}
          <Menu anchorEl={rsvpMenu} open={Boolean(rsvpMenu)} onClose={() => setRsvpMenu(null)}>
            <MenuItem onClick={() => { setShowComment(true); setRsvpMenu(null); }} disabled={!sendResponse}>
              <ListItemText inset>{t("Add a message")}</ListItemText>
            </MenuItem>
            <MenuItem role="menuitemcheckbox" aria-checked={!sendResponse} onClick={() => setSendResponse(!sendResponse)}>
              <ListItemIcon>{!sendResponse ? <CheckBox fontSize="small" /> : <CheckBoxOutlineBlank fontSize="small" />}</ListItemIcon>
              <ListItemText>{t("Do not send a response")}</ListItemText>
            </MenuItem>
            {event.seriesMasterId && (
              <MenuItem role="menuitemcheckbox" aria-checked={respondToSeries} onClick={() => setRespondToSeries(!respondToSeries)}>
                <ListItemIcon>{respondToSeries ? <CheckBox fontSize="small" /> : <CheckBoxOutlineBlank fontSize="small" />}</ListItemIcon>
                <ListItemText>{t("Respond to all events in the series")}</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </>
      )}
      <Menu anchorEl={scopeMenu?.anchor} open={Boolean(scopeMenu)} onClose={() => setScopeMenu(null)}>
        <MenuItem onClick={() => chooseScope("occurrence")}>{scopeMenu?.action === "edit" ? t("This event") : t("Delete this event")}</MenuItem>
        <MenuItem onClick={() => chooseScope("series")}>{scopeMenu?.action === "edit" ? t("All events in the series") : t("Delete all events in the series")}</MenuItem>
      </Menu>
      <DeclineDeleteDialog
        open={Boolean(confirm) && deleteMode === "decline"}
        series={confirm === "series"}
        onDecline={message => handleDelete("decline", message)}
        onDeleteSilently={() => handleDelete("delete")}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={Boolean(confirm) && deleteMode !== "decline"}
        title={hasAttendees && isOrganizer ? t("Cancel meeting") : t("Delete event")}
        description={hasAttendees && isOrganizer ? t("A cancellation will be sent to all attendees.") : confirm === "series" ? t("All occurrences of this series will be deleted.") : t("This event will be deleted.")}
        confirmLabel={hasAttendees && isOrganizer ? t("Cancel meeting") : t("Delete")}
        destructive
        onConfirm={() => handleDelete(deleteMode)}
        onClose={() => setConfirm(null)}
      />
    </Popover>
  );
};

export default EventPopover;
