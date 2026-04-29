// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { Add, Check, Close, DeleteOutline, ExpandLess, ExpandMore, LabelOutlined, PhotoCamera } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Contact, PhysicalAddress } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { createContact, updateContact } from "../contactsSlice";
import PersonAvatar from "../../../components/common/PersonAvatar";
import { dayjs } from "../../calendar/dates";
import { isValidEmail } from "../../mail/utils";
import { presetColor } from "../../mail/categories";
import { birthdayDate, birthdayValue, buildContactPayload, ContactDraft } from "../contactUtils";

type ContactEditorProps = {
  contact?: Contact;
  folderId?: string;
  onClose: () => void;
  onSaved?: (contact: Contact) => void;
};

type Draft = ContactDraft;

const emptyAddress = (): PhysicalAddress => ({ street: "", city: "", state: "", postalCode: "", countryOrRegion: "" });

function toDraft(contact?: Contact): Draft {
  return {
    givenName: "", middleName: "", surname: "", displayName: "", nickName: "", title: "", companyName: "", jobTitle: "", department: "",
    officeLocation: "", manager: "", assistantName: "", businessHomePage: "", mobilePhone: "", personalNotes: "", spouseName: "", profession: "",
    ...contact,
    emailAddresses: contact?.emailAddresses?.length ? contact.emailAddresses : [{ address: "", name: "" }],
    businessPhones: contact?.businessPhones?.length ? contact.businessPhones : [""],
    homePhones: contact?.homePhones?.length ? contact.homePhones : [""],
    businessAddress: { ...emptyAddress(), ...(contact?.businessAddress || {}) },
    homeAddress: { ...emptyAddress(), ...(contact?.homeAddress || {}) },
    categories: contact?.categories || [],
  };
}

const Group = ({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box sx={{ mb: 1 }}>
      <Button size="small" color="inherit" onClick={() => setOpen(!open)} endIcon={open ? <ExpandLess /> : <ExpandMore />} sx={{ fontWeight: 600, px: 0 }}>{title}</Button>
      <Collapse in={open}><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, pt: 1, pb: 1 }}>{children}</Box></Collapse>
      <Divider />
    </Box>
  );
};

const AddressFields = ({ value, onChange }: { value: PhysicalAddress; onChange: (a: PhysicalAddress) => void }) => {
  const { t } = useTranslation();
  const set = (k: keyof PhysicalAddress) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [k]: e.target.value });
  return <>
    <TextField label={t("Street")} value={value.street || ""} onChange={set("street")} sx={{ gridColumn: "1 / -1" }} multiline />
    <TextField label={t("Postal code")} value={value.postalCode || ""} onChange={set("postalCode")} />
    <TextField label={t("City")} value={value.city || ""} onChange={set("city")} />
    <TextField label={t("State/Province")} value={value.state || ""} onChange={set("state")} />
    <TextField label={t("Country/Region")} value={value.countryOrRegion || ""} onChange={set("countryOrRegion")} />
  </>;
};

const ContactEditor = ({ contact, folderId, onClose, onSaved }: ContactEditorProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const categories = useTypeSelector(state => state.mail.categories);
  const existingPhoto = useTypeSelector(state => contact?.id ? state.contacts.photos[contact.id] : undefined);
  const [draft, setDraft] = useState<Draft>(() => toDraft(contact));
  const [photo, setPhoto] = useState<File | undefined>();
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [catAnchor, setCatAnchor] = useState<HTMLElement | null>(null);
  const [nameTouched, setNameTouched] = useState(Boolean(contact?.displayName));
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const set = (key: keyof Contact) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, [key]: e.target.value });

  // Display name follows first/last name until edited explicitly
  const setName = (key: "givenName" | "middleName" | "surname") => (e: ChangeEvent<HTMLInputElement>) => {
    const next = { ...draft, [key]: e.target.value };
    if (!nameTouched) next.displayName = [next.givenName, next.middleName, next.surname].filter(Boolean).join(" ");
    setDraft(next);
  };

  const setList = (key: "businessPhones" | "homePhones", index: number, value: string) => {
    const list = [...draft[key]];
    list[index] = value;
    setDraft({ ...draft, [key]: list });
  };

  const setEmail = (index: number, address: string) => {
    const list = [...draft.emailAddresses];
    list[index] = { ...list[index], address };
    setDraft({ ...draft, emailAddresses: list });
  };

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoUrl(URL.createObjectURL(file)); }
    e.target.value = "";
  };

  const invalidEmails = draft.emailAddresses.filter(e => e.address && !isValidEmail(e.address));

  const handleSave = async () => {
    const payload = buildContactPayload(draft, contact?.id ? contact : undefined);
    setBusy(true);
    const result = contact?.id ?
      await dispatch(updateContact({ contact: { ...payload, id: contact.id }, photo })) :
      await dispatch(createContact({ contact: payload, folderId, photo }));
    setBusy(false);
    if (updateContact.fulfilled.match(result)) { onSaved?.(result.payload); onClose(); }
    else if (createContact.fulfilled.match(result)) { onSaved?.(result.payload.contact); onClose(); }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: "95vh" } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1 }}>{contact?.id ? t("Edit contact") : t("New contact")}</Box>
        <IconButton onClick={onClose} aria-label={t("Close")}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", mb: 2 }}>
          <Box sx={{ position: "relative" }}>
            <PersonAvatar name={draft.displayName || draft.givenName} email={draft.emailAddresses[0]?.address} src={photoUrl || existingPhoto} size={96} sx={{ fontSize: 36 }} />
            <Tooltip title={t("Change photo")}>
              <IconButton size="small" onClick={() => photoInput.current?.click()} sx={{ position: "absolute", right: -4, bottom: -4, bgcolor: "background.paper", boxShadow: 1, "&:hover": { bgcolor: "background.paper" } }} aria-label={t("Change photo")}>
                <PhotoCamera fontSize="small" />
              </IconButton>
            </Tooltip>
            <input ref={photoInput} type="file" accept="image/*" hidden onChange={handlePhoto} />
          </Box>
          <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <TextField label={t("First name")} value={draft.givenName || ""} onChange={setName("givenName")} autoFocus={!contact} />
            <TextField label={t("Last name")} value={draft.surname || ""} onChange={setName("surname")} />
            <TextField label={t("Middle name")} value={draft.middleName || ""} onChange={setName("middleName")} />
            <TextField label={t("Title")} value={draft.title || ""} onChange={set("title")} placeholder={t("Dr., Prof., …")} />
            <TextField label={t("Display name")} value={draft.displayName || ""} onChange={e => { setNameTouched(true); set("displayName")(e); }} sx={{ gridColumn: "1 / -1" }} />
          </Box>
        </Box>

        <Group title={t("Email")}>
          {draft.emailAddresses.map((e, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1, gridColumn: "1 / -1" }}>
              <TextField fullWidth type="email" label={i === 0 ? t("Email") : t("Email {{n}}", { n: i + 1 })} value={e.address || ""} onChange={ev => setEmail(i, ev.target.value)} error={Boolean(e.address) && !isValidEmail(e.address!)} />
              {draft.emailAddresses.length > 1 && <IconButton onClick={() => setDraft({ ...draft, emailAddresses: draft.emailAddresses.filter((_x, j) => j !== i) })} aria-label={t("Remove")}><DeleteOutline /></IconButton>}
            </Box>
          ))}
          {draft.emailAddresses.length < 3 && <Button size="small" startIcon={<Add />} onClick={() => setDraft({ ...draft, emailAddresses: [...draft.emailAddresses, { address: "" }] })} sx={{ justifySelf: "start" }}>{t("Add email")}</Button>}
        </Group>

        <Group title={t("Phone")}>
          <TextField label={t("Mobile")} value={draft.mobilePhone || ""} onChange={set("mobilePhone")} />
          {draft.businessPhones.map((p, i) => <TextField key={"b" + i} label={t("Business")} value={p} onChange={e => setList("businessPhones", i, e.target.value)} />)}
          {draft.homePhones.map((p, i) => <TextField key={"h" + i} label={t("Home")} value={p} onChange={e => setList("homePhones", i, e.target.value)} />)}
          <Box sx={{ display: "flex", gap: 1, gridColumn: "1 / -1" }}>
            <Button size="small" startIcon={<Add />} onClick={() => setDraft({ ...draft, businessPhones: [...draft.businessPhones, ""] })}>{t("Business")}</Button>
            <Button size="small" startIcon={<Add />} onClick={() => setDraft({ ...draft, homePhones: [...draft.homePhones, ""] })}>{t("Home")}</Button>
          </Box>
        </Group>

        <Group title={t("Work")}>
          <TextField label={t("Company")} value={draft.companyName || ""} onChange={set("companyName")} />
          <TextField label={t("Job title")} value={draft.jobTitle || ""} onChange={set("jobTitle")} />
          <TextField label={t("Department")} value={draft.department || ""} onChange={set("department")} />
          <TextField label={t("Office")} value={draft.officeLocation || ""} onChange={set("officeLocation")} />
          <TextField label={t("Manager")} value={draft.manager || ""} onChange={set("manager")} />
          <TextField label={t("Assistant")} value={draft.assistantName || ""} onChange={set("assistantName")} />
          <TextField label={t("Website")} value={draft.businessHomePage || ""} onChange={set("businessHomePage")} sx={{ gridColumn: "1 / -1" }} />
        </Group>

        <Group title={t("Business address")} defaultOpen={Boolean(contact?.businessAddress?.street || contact?.businessAddress?.city)}>
          <AddressFields value={draft.businessAddress!} onChange={a => setDraft({ ...draft, businessAddress: a })} />
        </Group>
        <Group title={t("Home address")} defaultOpen={Boolean(contact?.homeAddress?.street || contact?.homeAddress?.city)}>
          <AddressFields value={draft.homeAddress!} onChange={a => setDraft({ ...draft, homeAddress: a })} />
        </Group>

        <Group title={t("Personal")} defaultOpen={Boolean(contact?.birthday || contact?.nickName || contact?.spouseName)}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjs.locale()}>
            <DatePicker label={t("Birthday")} value={birthdayDate(draft.birthday) ? dayjs(birthdayDate(draft.birthday)) : null} onChange={v => setDraft({ ...draft, birthday: birthdayValue(v && v.isValid() ? v.format("YYYY-MM-DD") : null) })} slotProps={{ textField: { size: "small" }, field: { clearable: true } }} />
          </LocalizationProvider>
          <TextField label={t("Nickname")} value={draft.nickName || ""} onChange={set("nickName")} />
          <TextField label={t("Spouse/Partner")} value={draft.spouseName || ""} onChange={set("spouseName")} />
          <TextField label={t("Profession")} value={draft.profession || ""} onChange={set("profession")} />
        </Group>

        <Group title={t("Notes")} defaultOpen={Boolean(contact?.personalNotes)}>
          <TextField multiline minRows={3} value={draft.personalNotes || ""} onChange={set("personalNotes")} sx={{ gridColumn: "1 / -1" }} inputProps={{ "aria-label": t("Notes") }} />
        </Group>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Button size="small" startIcon={<LabelOutlined />} onClick={e => setCatAnchor(e.currentTarget)}>{t("Categorize")}</Button>
          {draft.categories!.map(c => <Chip key={c} size="small" label={c} onDelete={() => setDraft({ ...draft, categories: draft.categories!.filter(x => x !== c) })} icon={<Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: presetColor(categories.find(x => x.displayName === c)?.color), ml: 1 }} />} />)}
          <Menu anchorEl={catAnchor} open={Boolean(catAnchor)} onClose={() => setCatAnchor(null)}>
            {categories.length === 0 && <MenuItem disabled>{t("No categories yet")}</MenuItem>}
            {categories.map(c => (
              <MenuItem key={c.id} onClick={() => setDraft({ ...draft, categories: draft.categories!.includes(c.displayName!) ? draft.categories!.filter(x => x !== c.displayName) : [...draft.categories!, c.displayName!] })}>
                <ListItemIcon><Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: presetColor(c.color) }} /></ListItemIcon>
                <ListItemText>{c.displayName}</ListItemText>
                {draft.categories!.includes(c.displayName!) && <Check fontSize="small" />}
              </MenuItem>
            ))}
          </Menu>
        </Box>
        {invalidEmails.length > 0 && <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>{t("Some addresses are invalid")}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button variant="contained" onClick={handleSave} disabled={busy || invalidEmails.length > 0 || !(draft.displayName || draft.givenName || draft.surname || draft.emailAddresses[0]?.address)}>{t("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactEditor;
