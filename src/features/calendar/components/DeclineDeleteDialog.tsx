// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

type DeclineDeleteDialogProps = {
  open: boolean;
  series?: boolean;
  onDecline: (comment: string) => void;
  onDeleteSilently: () => void;
  onClose: () => void;
};

// Decline and notify the organizer by default, like Outlook
const DeclineDeleteDialog = ({ open, series, onDecline, onDeleteSilently, onClose }: DeclineDeleteDialogProps) => {
  const { t } = useTranslation();
  const titleId = useId();
  const [comment, setComment] = useState("");

  const finish = (action: () => void) => {
    action();
    setComment("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{t("Delete meeting")}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {series ? t("You will decline all meetings of this series and the organizer will be notified.") : t("You will decline this meeting and the organizer will be notified.")}
        </DialogContentText>
        <TextField fullWidth size="small" multiline maxRows={4} placeholder={t("Add a message")} value={comment} onChange={e => setComment(e.target.value)} inputProps={{ "aria-label": t("Add a message") }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => finish(onDeleteSilently)} color="inherit">{t("Delete without notifying")}</Button>
        <Button onClick={onClose} color="inherit">{t("Cancel")}</Button>
        <Button onClick={() => finish(() => onDecline(comment.trim()))} variant="contained" color="error" autoFocus>{t("Decline and delete")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeclineDeleteDialog;
