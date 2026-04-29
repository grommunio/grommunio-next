// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Checkbox, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Switch, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Editor } from "@tinymce/tinymce-react";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AutomaticRepliesSetting, DateTimeTimeZone, NullableOption } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { updatePrefs } from "../../mail/mailSlice";
import { saveAutomaticReplies } from "../settingsSlice";
import { TINYMCE_SCRIPT_SRC } from "../../../constants";
import { purify, tinymceLanguage } from "../../mail/utils-compose";
import { browserTimeZone, dayjs, Dayjs, graphDateToDate } from "../../calendar/dates";
import { Section } from "./GeneralSettings";
import type { ReadingPanePosition } from "../../mail/types";

// Honours the returned timeZone; values without one are UTC
const fromGraphDate = (value: NullableOption<DateTimeTimeZone> | undefined): Dayjs =>
  value?.timeZone ? dayjs(graphDateToDate(value)) : dayjs.utc(value?.dateTime || undefined).local();

export const MailLayoutSettings = () => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const prefs = useTypeSelector(state => state.mail.prefs);
  const set = (patch: Partial<typeof prefs>) => dispatch(updatePrefs(patch));

  return <>
    <Section title={t("Reading pane")}>
      <RadioGroup row value={prefs.readingPane} onChange={e => set({ readingPane: e.target.value as ReadingPanePosition })}>
        <FormControlLabel value="right" control={<Radio />} label={t("Show on the right")} />
        <FormControlLabel value="bottom" control={<Radio />} label={t("Show at the bottom")} />
        <FormControlLabel value="off" control={<Radio />} label={t("Hide")} />
      </RadioGroup>
    </Section>
    <Section title={t("Message list")}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <FormControlLabel control={<Switch checked={prefs.density === "compact"} onChange={e => set({ density: e.target.checked ? "compact" : "comfortable" })} />} label={t("Compact layout")} />
        <FormControlLabel control={<Switch checked={prefs.showPreview} onChange={e => set({ showPreview: e.target.checked })} />} label={t("Show preview text")} />
        <FormControlLabel control={<Switch checked={prefs.showAvatars} onChange={e => set({ showAvatars: e.target.checked })} />} label={t("Show sender pictures")} />
        <FormControlLabel control={<Switch checked={prefs.focusedInbox} onChange={e => set({ focusedInbox: e.target.checked })} />} label={t("Sort messages into Focused and Other")} />
      </Box>
    </Section>
    <Section title={t("Mark as read")}>
      <RadioGroup value={prefs.markAsRead} onChange={e => set({ markAsRead: e.target.value as typeof prefs.markAsRead })}>
        <FormControlLabel value="onSelect" control={<Radio />} label={t("Mark items as read when selected")} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControlLabel value="afterDelay" control={<Radio />} label={t("Mark items as read after")} />
          <TextField type="number" size="small" value={prefs.markAsReadDelay} onChange={e => set({ markAsReadDelay: Math.max(0, Math.min(60, Number(e.target.value) || 0)) })} inputProps={{ min: 0, max: 60, "aria-label": t("Seconds") }} sx={{ width: 80 }} disabled={prefs.markAsRead !== "afterDelay"} />
          <Typography variant="body2">{t("seconds")}</Typography>
        </Box>
        <FormControlLabel value="never" control={<Radio />} label={t("Don't automatically mark items as read")} />
      </RadioGroup>
    </Section>
    <Section title={t("Deleting")}>
      <FormControlLabel control={<Switch checked={prefs.confirmDelete} onChange={e => set({ confirmDelete: e.target.checked })} />} label={t("Ask before deleting messages")} />
    </Section>
    <Section title={t("Privacy")} description={t("Images from the internet can tell senders when you opened a message.")}>
      <FormControlLabel control={<Switch checked={prefs.blockRemoteImages} onChange={e => set({ blockRemoteImages: e.target.checked })} />} label={t("Block images from the internet")} />
    </Section>
  </>;
};

export const SignatureSettings = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const prefs = useTypeSelector(state => state.mail.prefs);
  const editorRef = useRef<any>(null);
  const [dirty, setDirty] = useState(false);

  const save = () => {
    if (!editorRef.current) return;
    dispatch(updatePrefs({ signature: purify(editorRef.current.getContent()) }));
    // Reset the editor's own flag too, otherwise onDirty never fires again
    editorRef.current.setDirty(false);
    setDirty(false);
  };

  return (
    <Section title={t("Email signature")} description={t("The signature is stored in this browser and added to new messages and replies as configured below.")}>
      <Box sx={{ "& .tox-tinymce": { borderRadius: 1 }, mb: 1.5 }}>
        <Editor
          tinymceScriptSrc={TINYMCE_SCRIPT_SRC}
          onInit={(_e, editor) => { editorRef.current = editor; }}
          initialValue={prefs.signature}
          onDirty={() => setDirty(true)}
          init={{
            language: tinymceLanguage(i18n.language),
            menubar: false, statusbar: false, branding: false, promotion: false, height: 220,
            skin: theme.palette.mode === "dark" ? "oxide-dark" : "oxide",
            content_css: theme.palette.mode === "dark" ? "dark" : "default",
            plugins: "lists link image autolink",
            toolbar: "bold italic underline | forecolor | link image | alignleft aligncenter | removeformat",
            paste_data_images: true,
            content_style: 'body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; }',
          }}
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", mb: 1 }}>
        <FormControlLabel control={<Checkbox checked={prefs.signatureOnNew} onChange={e => dispatch(updatePrefs({ signatureOnNew: e.target.checked }))} />} label={t("Automatically include my signature on new messages")} />
        <FormControlLabel control={<Checkbox checked={prefs.signatureOnReply} onChange={e => dispatch(updatePrefs({ signatureOnReply: e.target.checked }))} />} label={t("Automatically include my signature on replies and forwards")} />
      </Box>
      <Button variant="contained" onClick={save} disabled={!dirty}>{t("Save")}</Button>
    </Section>
  );
};

export const AutoRepliesSettings = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const current = useTypeSelector(state => state.settings.mailboxSettings.automaticRepliesSetting);
  const [enabled, setEnabled] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [start, setStart] = useState<Dayjs>(dayjs().add(1, "hour").startOf("hour"));
  const [end, setEnd] = useState<Dayjs>(dayjs().add(1, "day").startOf("hour"));
  const [external, setExternal] = useState<"none" | "contactsOnly" | "all">("none");
  const [sameExternal, setSameExternal] = useState(true);
  const internalRef = useRef<any>(null);
  const externalRef = useRef<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!current) return;
    setEnabled(current.status !== "disabled");
    setScheduled(current.status === "scheduled");
    if (current.scheduledStartDateTime?.dateTime) setStart(fromGraphDate(current.scheduledStartDateTime));
    if (current.scheduledEndDateTime?.dateTime) setEnd(fromGraphDate(current.scheduledEndDateTime));
    setExternal((current.externalAudience as typeof external) || "none");
    setSameExternal(!current.externalReplyMessage || current.externalReplyMessage === current.internalReplyMessage);
  }, [current]);

  const validRange = !scheduled || end.isAfter(start);

  const changeStart = (value: Dayjs) => {
    setStart(value);
    // Keep the end after the start
    if (value.isValid() && !end.isAfter(value)) setEnd(value.add(1, "hour"));
  };

  const save = async () => {
    if (enabled && !validRange) return;
    const internal = internalRef.current ? purify(internalRef.current.getContent()) : current?.internalReplyMessage || "";
    const externalMsg = sameExternal ? internal : externalRef.current ? purify(externalRef.current.getContent()) : current?.externalReplyMessage || "";
    const setting: AutomaticRepliesSetting = {
      status: !enabled ? "disabled" : scheduled ? "scheduled" : "alwaysEnabled",
      externalAudience: external,
      internalReplyMessage: internal,
      externalReplyMessage: externalMsg,
      ...(enabled && scheduled ? {
        scheduledStartDateTime: { dateTime: start.utc().format("YYYY-MM-DDTHH:mm:ss"), timeZone: "UTC" },
        scheduledEndDateTime: { dateTime: end.utc().format("YYYY-MM-DDTHH:mm:ss"), timeZone: "UTC" },
      } : {}),
    };
    setBusy(true);
    await dispatch(saveAutomaticReplies(setting));
    setBusy(false);
  };

  const editorInit = {
    language: tinymceLanguage(i18n.language),
    menubar: false, statusbar: false, branding: false, promotion: false, height: 180,
    skin: theme.palette.mode === "dark" ? "oxide-dark" : "oxide",
    content_css: theme.palette.mode === "dark" ? "dark" : "default",
    plugins: "lists link autolink",
    toolbar: "bold italic underline | bullist numlist | link | removeformat",
    content_style: 'body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; }',
  };
  const disabled = !enabled;

  return (
    <Section title={t("Automatic replies")} description={t("Let people know you are away. Replies are sent once per sender while automatic replies are on.")}>
      <FormControlLabel control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />} label={t("Turn on automatic replies")} />
      <Box sx={{ opacity: enabled ? 1 : 0.5, display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
        <FormControlLabel disabled={disabled} control={<Checkbox checked={scheduled} onChange={e => setScheduled(e.target.checked)} />} label={t("Send replies only during a time period")} />
        {scheduled && (
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjs.locale()}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <DateTimePicker label={t("Start time")} value={start} onChange={v => v && changeStart(v)} disabled={disabled} slotProps={{ textField: { size: "small" } }} />
              <DateTimePicker label={t("End time")} value={end} onChange={v => v && setEnd(v)} minDateTime={start} disabled={disabled}
                slotProps={{ textField: { size: "small", error: !validRange, helperText: validRange ? undefined : t("The end time must be after the start time") } }} />
            </Box>
          </LocalizationProvider>
        )}
        <Typography variant="subtitle2">{t("Reply inside my organization")}</Typography>
        <Box sx={{ "& .tox-tinymce": { borderRadius: 1 } }}>
          <Editor key={"i" + (current?.internalReplyMessage || "").length} tinymceScriptSrc={TINYMCE_SCRIPT_SRC} onInit={(_e, ed) => { internalRef.current = ed; }} initialValue={current?.internalReplyMessage || ""} init={editorInit} disabled={disabled} />
        </Box>
        <FormControl disabled={disabled}>
          <FormLabel sx={{ fontSize: 14, fontWeight: 600, color: "text.primary" }}>{t("Reply to people outside my organization")}</FormLabel>
          <RadioGroup value={external} onChange={e => setExternal(e.target.value as typeof external)}>
            <FormControlLabel value="none" control={<Radio size="small" />} label={t("Don't send replies outside my organization")} />
            <FormControlLabel value="contactsOnly" control={<Radio size="small" />} label={t("Send replies only to my contacts")} />
            <FormControlLabel value="all" control={<Radio size="small" />} label={t("Send replies to everyone")} />
          </RadioGroup>
        </FormControl>
        {external !== "none" && <>
          <FormControlLabel disabled={disabled} control={<Checkbox checked={sameExternal} onChange={e => setSameExternal(e.target.checked)} />} label={t("Use the same message for people outside my organization")} />
          {!sameExternal && (
            <Box sx={{ "& .tox-tinymce": { borderRadius: 1 } }}>
              <Editor key={"e" + (current?.externalReplyMessage || "").length} tinymceScriptSrc={TINYMCE_SCRIPT_SRC} onInit={(_e, ed) => { externalRef.current = ed; }} initialValue={current?.externalReplyMessage || ""} init={editorInit} disabled={disabled} />
            </Box>
          )}
        </>}
      </Box>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={save} disabled={busy || (enabled && !validRange)}>{t("Save")}</Button>
      </Box>
      <Box sx={{ display: "none" }}>{browserTimeZone()}</Box>
    </Section>
  );
};
