// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useTranslation } from "react-i18next";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const ConfirmDialog = ({ open, title, description, confirmLabel, destructive, onConfirm, onClose }: ConfirmDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {description && <DialogContent><DialogContentText>{description}</DialogContentText></DialogContent>}
      <DialogActions>
        <Button onClick={onClose} color="inherit">{t("Cancel")}</Button>
        <Button onClick={() => { onConfirm(); onClose(); }} variant="contained" color={destructive ? "error" : "primary"} autoFocus>
          {confirmLabel || t("OK")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
