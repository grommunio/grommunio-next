// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Recipient } from "microsoft-graph";
import RecipientField from "../../mail/components/RecipientField";
import { useTypeDispatch } from "../../../store";
import { addSharedCalendar, ALREADY_OPEN } from "../calendarSlice";

type AddSharedCalendarDialogProps = {
  open: boolean;
  onClose: () => void;
};

const AddSharedCalendarDialog = ({ open, onClose }: AddSharedCalendarDialogProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const titleId = useId();
  const [people, setPeople] = useState<Recipient[]>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Array<{ name: string; error: string }>>([]);

  const close = () => {
    setPeople([]);
    setErrors([]);
    onClose();
  };

  // Only failed entries stay in the field, with their error
  const handleAdd = async () => {
    setBusy(true);
    const remaining: Recipient[] = [];
    const failures: Array<{ name: string; error: string }> = [];
    for (const person of people) {
      const address = person.emailAddress?.address;
      if (!address) continue;
      const name = person.emailAddress?.name || address;
      const result = await dispatch(addSharedCalendar({ address, name: person.emailAddress?.name || undefined }));
      if (addSharedCalendar.rejected.match(result) && result.payload !== ALREADY_OPEN) {
        remaining.push(person);
        failures.push({ name, error: result.payload || result.error.message || "" });
      }
    }
    setBusy(false);
    if (!remaining.length) close();
    else {
      setPeople(remaining);
      setErrors(failures);
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{t("Add a shared calendar")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("Open the calendar of a person who shared it with you. Shared calendars are read-only here.")}
        </Typography>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, px: 1.5, py: 0.5 }}>
          <RecipientField label={t("People")} value={people} onChange={setPeople} autoFocus />
        </Box>
        {errors.map(e => (
          <Typography key={e.name} variant="body2" color="error" role="alert" sx={{ mt: 1 }}>
            {t("The calendar of {{name}} could not be opened. It may not be shared with you.", { name: e.name })}
            {e.error && <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block" }}>{e.error}</Typography>}
          </Typography>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{t("Cancel")}</Button>
        <Button variant="contained" onClick={handleAdd} disabled={busy || people.length === 0}>{t("Add")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSharedCalendarDialog;
