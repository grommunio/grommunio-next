// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2023-2024 grommunio GmbH

import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { DeleteOutline } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Calendar, CalendarPermission, CalendarRoleType } from "microsoft-graph";
import { createCalendarPermission, deleteCalendarPermission, getCalendarPermissions, updateCalendarPermission } from "../../../api/calendar";
import PersonAvatar from "../../../components/common/PersonAvatar";
import { isValidEmail } from "../../mail/utils";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { pushAlertStack } from "../../../features/alerts/alertsSlice";
import { sameDomain } from "../eventUtils";

// Dynamic translation keys, picked up by scripts/extractTranslations.py:
// t("Can view when I'm busy")
// t("Can view titles and locations")
// t("Can view all details")
// t("Can edit")
// t("Delegate")
const ROLES: Array<{ value: CalendarRoleType; label: string }> = [
  { value: "freeBusyRead", label: "Can view when I'm busy" },
  { value: "limitedRead", label: "Can view titles and locations" },
  { value: "read", label: "Can view all details" },
  { value: "write", label: "Can edit" },
  { value: "delegateWithoutPrivateEventAccess", label: "Delegate" },
];

type ShareCalendarDialogProps = {
  calendar: Calendar;
  onClose: () => void;
};

const ShareCalendarDialog = ({ calendar, onClose }: ShareCalendarDialogProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const ownAddress = useTypeSelector(state => state.session.me.mail);
  const [permissions, setPermissions] = useState<CalendarPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CalendarRoleType>("read");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getCalendarPermissions(calendar.id!)
      .then(setPermissions)
      .catch(err => dispatch(pushAlertStack({ message: err.message, severity: "error" })))
      .finally(() => setLoading(false));
  };

  useEffect(load, [calendar.id]);

  const handleAdd = async () => {
    if (busy || !isValidEmail(email)) return;
    setBusy(true);
    try {
      const address = email.trim();
      await createCalendarPermission(calendar.id!, { emailAddress: { address }, role, isRemovable: true, isInsideOrganization: sameDomain(address, ownAddress) });
      setEmail("");
      load();
      dispatch(pushAlertStack({ message: t("Sharing invitation sent"), severity: "success" }));
    } catch (err: any) {
      dispatch(pushAlertStack({ message: err.message, severity: "error" }));
    } finally {
      setBusy(false);
    }
  };

  const handleRole = async (permission: CalendarPermission, newRole: CalendarRoleType) => {
    try {
      await updateCalendarPermission(calendar.id!, permission.id!, newRole);
      setPermissions(permissions.map(p => p.id === permission.id ? { ...p, role: newRole } : p));
    } catch (err: any) {
      dispatch(pushAlertStack({ message: err.message, severity: "error" }));
    }
  };

  const handleRemove = async (permission: CalendarPermission) => {
    try {
      await deleteCalendarPermission(calendar.id!, permission.id!);
      setPermissions(permissions.filter(p => p.id !== permission.id));
    } catch (err: any) {
      dispatch(pushAlertStack({ message: err.message, severity: "error" }));
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("Sharing and permissions")} – {calendar.name}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("Send a sharing invitation by email. You can choose how much access to allow and change it at any time.")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <TextField
            label={t("Email address")}
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            error={Boolean(email) && !isValidEmail(email)}
            sx={{ flex: 1 }}
          />
          <TextField select value={role} onChange={e => setRole(e.target.value as CalendarRoleType)} sx={{ minWidth: 200 }} label={t("Permission")}>
            {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{t(r.label)}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={handleAdd} disabled={busy || !isValidEmail(email)}>{t("Share")}</Button>
        </Box>
        <Typography variant="subtitle2" gutterBottom>{t("People with access")}</Typography>
        {loading ? <CircularProgress size={24} /> : permissions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t("This calendar is not shared with anyone.")}</Typography>
        ) : permissions.map(permission => {
          const address = permission.emailAddress?.address || "";
          const name = permission.emailAddress?.name || address || t("My organization");
          return (
            <Box key={permission.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: 1, borderColor: "divider" }}>
              <PersonAvatar name={name} email={address} size={32} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap>{name}</Typography>
                {address && address !== name && <Typography variant="caption" color="text.secondary" noWrap>{address}</Typography>}
              </Box>
              <TextField
                select
                size="small"
                value={permission.role || "read"}
                onChange={e => handleRole(permission, e.target.value as CalendarRoleType)}
                disabled={permission.isRemovable === false && !permission.allowedRoles?.length}
                sx={{ minWidth: 200 }}
              >
                {(permission.allowedRoles?.length ? ROLES.filter(r => permission.allowedRoles!.includes(r.value)) : ROLES).map(r => (
                  <MenuItem key={r.value} value={r.value}>{t(r.label)}</MenuItem>
                ))}
              </TextField>
              <Tooltip title={t("Remove")}>
                <span>
                  <IconButton size="small" onClick={() => handleRemove(permission)} disabled={permission.isRemovable === false} aria-label={t("Remove")}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareCalendarDialog;
