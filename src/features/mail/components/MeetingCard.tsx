// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2023-2024 grommunio GmbH

import { Box, Button, ButtonGroup, CircularProgress, Collapse, Divider, Menu, MenuItem, TextField, Typography } from "@mui/material";
import { ArrowDropDown, Check, Close, EventBusy, EventOutlined, HelpOutline, LocationOnOutlined, Schedule } from "@mui/icons-material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { EventMessage } from "microsoft-graph";
import { useTypeDispatch } from "../../../store";
import { deleteEvent, getEventFromEventMessage, respondToEvent } from "../../../api/calendar";
import { EventReponseType } from "../../../types/calendar";
import { toReadableTimeInTimezone } from "../../../utils";
import { pushAlertStack } from "../../../actions/alerts";
import { deleteMessages } from "../mailSlice";

type MeetingCardProps = {
  message: EventMessage;
};

const MeetingCard = ({ message }: MeetingCardProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; type: EventReponseType } | null>(null);

  const start = toReadableTimeInTimezone(message.startDateTime, message.isAllDay ? "ll" : "llll");
  const end = toReadableTimeInTimezone(message.endDateTime, message.isAllDay ? "ll" : "LT");
  const cancelled = message.meetingMessageType === "meetingCancelled";
  const isRequest = message.meetingMessageType === "meetingRequest";

  const respond = async (type: EventReponseType, sendResponse: boolean) => {
    setMenu(null);
    setBusy(true);
    try {
      const details = await getEventFromEventMessage(message.id || "");
      const eventId = details?.event?.id;
      if (!eventId) throw new Error(t("The meeting could not be found in your calendar"));
      await respondToEvent(eventId, type, { comment, sendResponse });
      dispatch(pushAlertStack({ message: t("Response sent"), severity: "success" }));
      dispatch(deleteMessages({ ids: [message.id!] }));
    } catch (err: any) {
      dispatch(pushAlertStack({ message: err?.message || String(err), severity: "error" }));
    } finally {
      setBusy(false);
    }
  };

  const removeFromCalendar = async () => {
    setBusy(true);
    try {
      const details = await getEventFromEventMessage(message.id || "");
      if (details?.event?.id) await deleteEvent(details.event.id);
      dispatch(deleteMessages({ ids: [message.id!] }));
    } catch (err: any) {
      dispatch(pushAlertStack({ message: err?.message || String(err), severity: "error" }));
    } finally {
      setBusy(false);
    }
  };

  const responseButton = (type: EventReponseType, label: string, icon: JSX.Element, color: "success" | "warning" | "error") => (
    <ButtonGroup key={type} variant="outlined" size="small" color={color} disabled={busy}>
      <Button startIcon={icon} onClick={() => respond(type, true)}>{label}</Button>
      <Button size="small" onClick={e => setMenu({ anchor: e.currentTarget, type })} aria-label={t("Response options")}><ArrowDropDown /></Button>
    </ButtonGroup>
  );

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, mb: 2, overflow: "hidden" }}>
      <Box sx={{ p: 1.5, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: cancelled ? "error.main" : "primary.main", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {cancelled ? <EventBusy /> : <EventOutlined />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">{cancelled ? t("Meeting cancelled") : t("Meeting invitation")}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", mt: 0.5 }}>
            <Schedule fontSize="small" />
            <Typography variant="body2" sx={{ textDecoration: cancelled ? "line-through" : "none" }}>
              {start}{end ? ` – ${end}` : ""}{message.isAllDay ? ` (${t("All day")})` : ""}
            </Typography>
          </Box>
          {message.location?.displayName && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", mt: 0.5 }}>
              <LocationOnOutlined fontSize="small" />
              <Typography variant="body2">{message.location.displayName}</Typography>
            </Box>
          )}
        </Box>
        {busy && <CircularProgress size={20} />}
      </Box>
      <Divider />
      <Box sx={{ p: 1.5, bgcolor: "background.default", display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        {isRequest && <>
          {responseButton(EventReponseType.accept, t("Accept"), <Check />, "success")}
          {responseButton(EventReponseType.tentatively, t("Tentative"), <HelpOutline />, "warning")}
          {responseButton(EventReponseType.decline, t("Decline"), <Close />, "error")}
          <Button size="small" onClick={() => setShowComment(!showComment)} sx={{ ml: "auto" }}>{t("Add a message")}</Button>
        </>}
        {cancelled && (
          <Button variant="outlined" size="small" startIcon={<EventBusy />} onClick={removeFromCalendar} disabled={busy}>
            {t("Remove from calendar")}
          </Button>
        )}
      </Box>
      <Collapse in={showComment}>
        <Box sx={{ p: 1.5, pt: 0, bgcolor: "background.default" }}>
          <TextField fullWidth multiline minRows={2} placeholder={t("Message to the organizer")} value={comment} onChange={e => setComment(e.target.value)} />
        </Box>
      </Collapse>
      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => menu && respond(menu.type, true)}>{t("Send the response now")}</MenuItem>
        <MenuItem onClick={() => menu && respond(menu.type, false)}>{t("Do not send a response")}</MenuItem>
      </Menu>
    </Box>
  );
};

export default MeetingCard;
