// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import {
  Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, FormControlLabel, IconButton, InputBase,
  ListItemIcon, ListItemText, Menu, MenuItem, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import {
  AccessTime, AttachFile, Check, Close, EventAvailable, EventBusy, HelpOutline, KeyboardArrowDown, LabelOutlined, LocationOnOutlined,
  LockOutlined, NotificationsOutlined, PendingOutlined, PeopleAltOutlined, Repeat, Subject, Videocam,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Editor } from "@tinymce/tinymce-react";
import { useTheme } from "@mui/material/styles";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Attachment, Attendee, Event, FileAttachment, PatternedRecurrence, Recipient, Sensitivity } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { createEvent, deleteEvent, loadEventDetails, updateEvent } from "../calendarSlice";
import { dateToGraphDate, dayjs, Dayjs, graphDateToDate, roundToStep } from "../dates";
import RecipientField from "../../mail/components/RecipientField";
import AttachmentList from "../../mail/components/AttachmentList";
import RecurrenceEditor, { describeRecurrence } from "./RecurrenceEditor";
import SchedulingAssistant from "./SchedulingAssistant";
import { TINYMCE_SCRIPT_SRC } from "../../../constants";
import { FREEBUSY_TYPES, REMINDER_OPTIONS } from "../../../constants";
import { purify } from "../../mail/utils-compose";
import { deleteEventAttachment, eventAttachments, getEventAttachmentContent } from "../../../api/calendar";
import { presetColor } from "../../mail/categories";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import type { CalendarEvent } from "../types";

export type EventEditorTarget =
  | { mode: "create"; start: Date; end: Date; allDay?: boolean; calendarId?: string }
  | { mode: "edit"; event: CalendarEvent; scope: "occurrence" | "series" };

type EventEditorProps = {
  target: EventEditorTarget;
  onClose: () => void;
};

function statusIcon(status?: string | null) {
  switch (status) {
  case "accepted": return <Tooltip title="Accepted"><EventAvailable fontSize="small" color="success" /></Tooltip>;
  case "tentativelyAccepted": return <Tooltip title="Tentative"><HelpOutline fontSize="small" color="warning" /></Tooltip>;
  case "declined": return <Tooltip title="Declined"><EventBusy fontSize="small" color="error" /></Tooltip>;
  default: return <Tooltip title="No response"><PendingOutlined fontSize="small" color="disabled" /></Tooltip>;
  }
}

const EventEditor = ({ target, onClose }: EventEditorProps) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const calendars = useTypeSelector(state => state.calendar.calendars);
  const details = useTypeSelector(state => target.mode === "edit" ? state.calendar.details[target.scope === "series" && target.event.seriesMasterId ? target.event.seriesMasterId : target.event.id!] : undefined);
  const categories = useTypeSelector(state => state.mail.categories);
  const me = useTypeSelector(state => state.session.me);
  const prefs = useTypeSelector(state => state.calendar.prefs);
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editing = target.mode === "edit";
  const editId = editing ? (target.scope === "series" && target.event.seriesMasterId ? target.event.seriesMasterId : target.event.id!) : undefined;
  const source: Event | undefined = editing ? (details || target.event) : undefined;

  const [subject, setSubject] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [start, setStart] = useState<Dayjs>(dayjs());
  const [end, setEnd] = useState<Dayjs>(dayjs().add(30, "minute"));
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState<Recipient[]>([]);
  const [optional, setOptional] = useState<Recipient[]>([]);
  const [showOptional, setShowOptional] = useState(false);
  const [recurrence, setRecurrence] = useState<PatternedRecurrence | null>(null);
  const [recurrenceOpen, setRecurrenceOpen] = useState(false);
  const [reminder, setReminder] = useState<number>(prefs.defaultReminder);
  const [showAs, setShowAs] = useState<string>("busy");
  const [sensitivity, setSensitivity] = useState<Sensitivity>("normal");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [responseRequested, setResponseRequested] = useState(true);
  const [hideAttendees, setHideAttendees] = useState(false);
  const [onlineMeeting, setOnlineMeeting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [catAnchor, setCatAnchor] = useState<HTMLElement | null>(null);
  const [saveAnchor, setSaveAnchor] = useState<HTMLElement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [initialised, setInitialised] = useState(false);

  // Load full details (body, attendees) when editing
  useEffect(() => {
    if (editing && editId) {
      dispatch(loadEventDetails(editId));
      eventAttachments({ id: editId }).then(setAttachments).catch(() => undefined);
    }
  }, [editId]);

  useEffect(() => {
    if (initialised && !details) return;
    if (target.mode === "create") {
      const s = dayjs(target.start);
      const e = dayjs(target.end);
      setStart(s);
      setEnd(e.isAfter(s) ? e : s.add(prefs.defaultDuration, "minute"));
      setAllDay(Boolean(target.allDay));
      setCalendarId(target.calendarId || calendars.find(c => c.isDefaultCalendar)?.id || calendars[0]?.id || "");
      setInitialised(true);
      return;
    }
    const ev = source!;
    setSubject(ev.subject || "");
    setCalendarId(target.event.calendarId);
    setStart(dayjs(graphDateToDate(ev.start)));
    setEnd(dayjs(graphDateToDate(ev.end)));
    setAllDay(Boolean(ev.isAllDay));
    setLocation(ev.location?.displayName || "");
    const required = (ev.attendees || []).filter(a => a.type !== "optional").map(a => ({ emailAddress: a.emailAddress }));
    const opt = (ev.attendees || []).filter(a => a.type === "optional").map(a => ({ emailAddress: a.emailAddress }));
    setAttendees(required);
    setOptional(opt);
    setShowOptional(opt.length > 0);
    setRecurrence(ev.recurrence || null);
    setReminder(ev.isReminderOn ? (ev.reminderMinutesBeforeStart ?? 15) : -1);
    setShowAs(ev.showAs || "busy");
    setSensitivity(ev.sensitivity || "normal");
    setSelectedCategories(ev.categories || []);
    setResponseRequested(ev.responseRequested !== false);
    setHideAttendees(Boolean(ev.hideAttendees));
    setOnlineMeeting(Boolean(ev.isOnlineMeeting));
    setInitialised(true);
  }, [details, target]);

  const isOrganizer = !editing || source?.isOrganizer !== false;
  const hasAttendees = attendees.length + optional.length > 0;

  const handleStart = (value: Dayjs | null) => {
    if (!value) return;
    const duration = end.diff(start, "minute");
    setStart(value);
    setEnd(value.add(Math.max(duration, allDay ? 0 : 15), "minute"));
  };

  const handleEnd = (value: Dayjs | null) => {
    if (!value) return;
    setEnd(value.isAfter(start) ? value : start.add(allDay ? 0 : 30, "minute"));
  };

  const buildEvent = (): Event => {
    const body = editorRef.current ? purify(editorRef.current.getContent()) : (source?.body?.content || "");
    const all: Attendee[] = [
      ...attendees.map(a => ({ emailAddress: a.emailAddress, type: "required" as const })),
      ...optional.map(a => ({ emailAddress: a.emailAddress, type: "optional" as const })),
    ];
    const s = allDay ? start.startOf("day") : start;
    const e = allDay ? end.startOf("day").add(end.startOf("day").isSame(s, "day") ? 1 : 0, "day") : end;
    return {
      subject,
      body: { contentType: "html", content: body },
      start: dateToGraphDate(s, allDay),
      end: dateToGraphDate(e, allDay),
      isAllDay: allDay,
      location: location ? { displayName: location } : undefined,
      attendees: all,
      recurrence: recurrence || undefined,
      isReminderOn: reminder >= 0,
      reminderMinutesBeforeStart: reminder >= 0 ? reminder : 0,
      showAs: showAs as Event["showAs"],
      sensitivity,
      categories: selectedCategories,
      responseRequested,
      hideAttendees,
      isOnlineMeeting: onlineMeeting || undefined,
      onlineMeetingProvider: onlineMeeting ? "teamsForBusiness" : undefined,
    };
  };

  const handleSave = async () => {
    setSaveAnchor(null);
    setBusy(true);
    const event = buildEvent();
    const result = editing ?
      await dispatch(updateEvent({ event: { ...event, id: editId, recurrence: target.mode === "edit" && target.scope === "occurrence" ? undefined : event.recurrence }, files })) :
      await dispatch(createEvent({ event, calendarId, files }));
    setBusy(false);
    if (createEvent.fulfilled.match(result) || updateEvent.fulfilled.match(result)) onClose();
  };

  const handleDelete = async () => {
    if (!editId) return;
    setBusy(true);
    const result = await dispatch(deleteEvent({ id: editId, notify: isOrganizer && hasAttendees }));
    setBusy(false);
    if (deleteEvent.fulfilled.match(result)) onClose();
  };

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    setFiles([...files, ...Array.from(e.target.files || [])]);
    e.target.value = "";
  };

  const removeAttachment = async (attachment: Attachment) => {
    if (!editId) return;
    await deleteEventAttachment(editId, attachment.id!);
    setAttachments(attachments.filter(a => a.id !== attachment.id));
  };

  const fetchContent = async (attachment: Attachment) => {
    return (attachment as FileAttachment).contentBytes ? attachment as FileAttachment : getEventAttachmentContent(editId!, attachment.id!);
  };

  const pendingAttachments: Attachment[] = useMemo(() => files.map((f, i) => ({ id: `pending-${i}`, name: f.name, size: f.size, contentType: f.type })), [files]);

  const title = editing ? (target.scope === "series" ? t("Edit series") : t("Edit event")) : t("New event");

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: "min(860px, 95vh)" } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>{title}</Typography>
        {isOrganizer && <>
          <Button variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <Check />} onClick={handleSave} disabled={busy || !subject.trim()}>
            {hasAttendees ? t("Send") : t("Save")}
          </Button>
          {editing && (
            <Button color="error" startIcon={<EventBusy />} onClick={() => setConfirmDelete(true)} disabled={busy}>
              {hasAttendees ? t("Cancel meeting") : t("Delete")}
            </Button>
          )}
        </>}
        <Box sx={{ flex: 1 }} />
        <Button size="small" color="inherit" startIcon={<LabelOutlined />} endIcon={<KeyboardArrowDown />} onClick={e => setCatAnchor(e.currentTarget)}>{t("Categorize")}</Button>
        <Menu anchorEl={catAnchor} open={Boolean(catAnchor)} onClose={() => setCatAnchor(null)}>
          {categories.length === 0 && <MenuItem disabled>{t("No categories yet")}</MenuItem>}
          {categories.map(c => (
            <MenuItem key={c.id} onClick={() => setSelectedCategories(selectedCategories.includes(c.displayName!) ? selectedCategories.filter(x => x !== c.displayName) : [...selectedCategories, c.displayName!])}>
              <ListItemIcon><Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: presetColor(c.color) }} /></ListItemIcon>
              <ListItemText>{c.displayName}</ListItemText>
              {selectedCategories.includes(c.displayName!) && <Check fontSize="small" />}
            </MenuItem>
          ))}
        </Menu>
        <Tooltip title={sensitivity === "private" ? t("Private") : t("Mark as private")}>
          <IconButton color={sensitivity === "private" ? "primary" : "default"} onClick={() => setSensitivity(sensitivity === "private" ? "normal" : "private")} aria-pressed={sensitivity === "private"} aria-label={t("Private")}>
            <LockOutlined />
          </IconButton>
        </Tooltip>
        <IconButton onClick={onClose} aria-label={t("Close")}><Close /></IconButton>
      </Box>

      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        {!initialised ? <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box> : (
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <Box sx={{ px: 3, pt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <TextField
                  select
                  size="small"
                  value={calendarId}
                  onChange={e => setCalendarId(e.target.value)}
                  disabled={editing}
                  sx={{ minWidth: 180 }}
                  inputProps={{ "aria-label": t("Calendar") }}
                >
                  {calendars.map(c => <MenuItem key={c.id} value={c.id!}>{c.name}</MenuItem>)}
                </TextField>
                {selectedCategories.map(c => (
                  <Chip key={c} size="small" label={c} onDelete={() => setSelectedCategories(selectedCategories.filter(x => x !== c))} icon={<Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: presetColor(categories.find(x => x.displayName === c)?.color), ml: 1 }} />} />
                ))}
              </Box>
              <InputBase
                fullWidth
                autoFocus={!editing}
                placeholder={t("Add a title")}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                disabled={!isOrganizer}
                sx={{ fontSize: 22, fontWeight: 600, my: 1.5, borderBottom: 1, borderColor: "divider", pb: 0.5 }}
                inputProps={{ "aria-label": t("Title") }}
              />
            </Box>

            <Box sx={{ px: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <PeopleAltOutlined sx={{ color: "text.secondary", mt: 1 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <RecipientField label={t("Invite")} value={attendees} onChange={setAttendees} endAdornment={
                      !showOptional ? <Button size="small" onClick={() => setShowOptional(true)} sx={{ whiteSpace: "nowrap" }}>{t("Optional")}</Button> : undefined
                    } />
                  </Box>
                  {showOptional && (
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                      <RecipientField label={t("Optional")} value={optional} onChange={setOptional} />
                    </Box>
                  )}
                  {hasAttendees && (
                    <Button size="small" onClick={() => setShowAssistant(!showAssistant)} sx={{ mt: 0.5 }}>
                      {showAssistant ? t("Hide availability") : t("Show availability")}
                    </Button>
                  )}
                  {showAssistant && hasAttendees && <SchedulingAssistant attendees={[...attendees, ...optional]} ownAddress={me.mail || undefined} start={start} end={end} />}
                </Box>
              </Box>

              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjs.locale()}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <AccessTime sx={{ color: "text.secondary" }} />
                  <DatePicker value={start} onChange={handleStart} disabled={!isOrganizer} slotProps={{ textField: { size: "small", sx: { width: 160 } } }} />
                  {!allDay && <TimePicker value={start} onChange={handleStart} disabled={!isOrganizer} minutesStep={5} slotProps={{ textField: { size: "small", sx: { width: 130 } } }} />}
                  <Typography color="text.secondary">–</Typography>
                  <DatePicker value={end} onChange={handleEnd} minDate={start} disabled={!isOrganizer} slotProps={{ textField: { size: "small", sx: { width: 160 } } }} />
                  {!allDay && <TimePicker value={end} onChange={handleEnd} disabled={!isOrganizer} minutesStep={5} slotProps={{ textField: { size: "small", sx: { width: 130 } } }} />}
                  <FormControlLabel control={<Switch size="small" checked={allDay} onChange={e => { setAllDay(e.target.checked); if (e.target.checked) { setStart(start.startOf("day")); setEnd(end.startOf("day")); } else { setStart(roundToStep(start.hour(dayjs().hour()))); setEnd(roundToStep(start.hour(dayjs().hour())).add(prefs.defaultDuration, "minute")); } }} disabled={!isOrganizer} />} label={t("All day")} />
                </Box>
              </LocalizationProvider>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Repeat sx={{ color: "text.secondary" }} />
                <Button variant="outlined" size="small" onClick={() => setRecurrenceOpen(true)} disabled={!isOrganizer || (editing && target.scope === "occurrence")}>
                  {describeRecurrence(recurrence, t)}
                </Button>
                {editing && target.scope === "occurrence" && target.event.type === "occurrence" && (
                  <Typography variant="caption" color="text.secondary">{t("You are editing a single occurrence")}</Typography>
                )}
                <NotificationsOutlined sx={{ color: "text.secondary", ml: 2 }} />
                <TextField select size="small" value={reminder} onChange={e => setReminder(Number(e.target.value))} sx={{ width: 170 }} inputProps={{ "aria-label": t("Reminder") }}>
                  {REMINDER_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{t(o.label)}</MenuItem>)}
                </TextField>
                <TextField select size="small" value={showAs} onChange={e => setShowAs(e.target.value)} sx={{ width: 170 }} inputProps={{ "aria-label": t("Show as") }}>
                  {FREEBUSY_TYPES.map(o => <MenuItem key={o.value} value={o.value}>{t(o.label)}</MenuItem>)}
                </TextField>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <LocationOnOutlined sx={{ color: "text.secondary" }} />
                <TextField fullWidth size="small" placeholder={t("Add a location")} value={location} onChange={e => setLocation(e.target.value)} disabled={!isOrganizer} inputProps={{ "aria-label": t("Location") }} />
                <Tooltip title={t("Online meeting")}>
                  <FormControlLabel control={<Switch size="small" checked={onlineMeeting} onChange={e => setOnlineMeeting(e.target.checked)} disabled={!isOrganizer} />} label={<Videocam fontSize="small" sx={{ display: "block" }} />} sx={{ mr: 0 }} />
                </Tooltip>
              </Box>

              {hasAttendees && isOrganizer && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, pl: 5 }}>
                  <FormControlLabel control={<Checkbox size="small" checked={responseRequested} onChange={e => setResponseRequested(e.target.checked)} />} label={t("Request responses")} />
                  <FormControlLabel control={<Checkbox size="small" checked={hideAttendees} onChange={e => setHideAttendees(e.target.checked)} />} label={t("Hide attendee list")} />
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <AttachFile sx={{ color: "text.secondary" }} />
                <Button size="small" onClick={() => fileInputRef.current?.click()}>{t("Attach file")}</Button>
                <input ref={fileInputRef} type="file" hidden multiple onChange={handleFiles} />
                <Box sx={{ flex: 1 }}>
                  <AttachmentList dense attachments={[...attachments, ...pendingAttachments]} fetchContent={fetchContent}
                    onRemove={a => a.id?.startsWith("pending-") ? setFiles(files.filter((_f, i) => `pending-${i}` !== a.id)) : removeAttachment(a)} />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, px: 3, py: 2, flex: 1, minHeight: 240 }}>
              <Subject sx={{ color: "text.secondary", mt: 1 }} />
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", "& .tox-tinymce": { flex: 1, borderRadius: 1 } }}>
                <Editor
                  tinymceScriptSrc={TINYMCE_SCRIPT_SRC}
                  onInit={(_e, editor) => { editorRef.current = editor; }}
                  initialValue={source?.body?.content || ""}
                  disabled={!isOrganizer}
                  init={{
                    language: i18n.language.replace("-", "_") === "en_US" ? undefined : i18n.language.replace("-", "_"),
                    menubar: false, statusbar: false, branding: false, promotion: false,
                    skin: theme.palette.mode === "dark" ? "oxide-dark" : "oxide",
                    content_css: theme.palette.mode === "dark" ? "dark" : "default",
                    plugins: "lists link autolink autoresize",
                    toolbar: "bold italic underline | bullist numlist | link | removeformat",
                    min_height: 200,
                    autoresize_bottom_margin: 8,
                    placeholder: t("Add a description"),
                    content_style: 'body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; }',
                  }}
                />
              </Box>
              {editing && (source?.attendees?.length || 0) > 0 && (
                <Box sx={{ width: 240, borderLeft: 1, borderColor: "divider", pl: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>{t("Tracking")}</Typography>
                  <Typography variant="caption" color="text.secondary">{t("Organizer")}</Typography>
                  <Typography variant="body2" noWrap sx={{ mb: 1 }}>{source?.organizer?.emailAddress?.name || source?.organizer?.emailAddress?.address}</Typography>
                  <Typography variant="caption" color="text.secondary">{t("Attendees")}</Typography>
                  {source?.attendees?.map((a, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.25 }}>
                      {statusIcon(a.status?.response)}
                      <Typography variant="body2" noWrap title={a.emailAddress?.address || ""}>{a.emailAddress?.name || a.emailAddress?.address}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ display: "none" }} />
      <RecurrenceEditor open={recurrenceOpen} start={start} value={recurrence} onChange={setRecurrence} onClose={() => setRecurrenceOpen(false)} />
      <Menu anchorEl={saveAnchor} open={Boolean(saveAnchor)} onClose={() => setSaveAnchor(null)} />
      <ConfirmDialog
        open={confirmDelete}
        title={hasAttendees ? t("Cancel meeting") : t("Delete event")}
        description={hasAttendees ? t("A cancellation will be sent to all attendees.") : (editing && target.scope === "series" ? t("All occurrences of this series will be deleted.") : t("This event will be deleted."))}
        confirmLabel={hasAttendees ? t("Cancel meeting") : t("Delete")}
        destructive
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </Dialog>
  );
};

export default EventEditor;
