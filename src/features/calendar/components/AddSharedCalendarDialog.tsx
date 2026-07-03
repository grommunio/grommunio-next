// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Recipient } from "microsoft-graph";
import RecipientField from "../../mail/components/RecipientField";
import { useTypeDispatch } from "../../../store";
import { addSharedCalendar } from "../calendarSlice";

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

  const close = () => {
    setPeople([]);
    onClose();
  };

  const handleAdd = async () => {
    setBusy(true);
    let failed = false;
    for (const person of people) {
      const address = person.emailAddress?.address;
      if (!address) continue;
      const result = await dispatch(addSharedCalendar({ address, name: person.emailAddress?.name || undefined }));
      if (addSharedCalendar.rejected.match(result)) failed = true;
    }
    setBusy(false);
    if (!failed) close();
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
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{t("Cancel")}</Button>
        <Button variant="contained" onClick={handleAdd} disabled={busy || people.length === 0}>{t("Add")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSharedCalendarDialog;
