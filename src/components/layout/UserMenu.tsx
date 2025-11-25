// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Avatar, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { Logout } from "@mui/icons-material";
import { MouseEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppContext } from "../../azure/AppContext";
import { useTypeSelector } from "../../store";
import { getMyPhoto } from "../../api/user";
import { avatarColor, initialsOf } from "../../utils";

const UserMenu = () => {
  const { t } = useTranslation();
  const app = useAppContext();
  const me = useTypeSelector(state => state.session.me);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    getMyPhoto().then(url => {
      if (!revoked) setPhoto(url);
      else if (url) URL.revokeObjectURL(url);
    }).catch(() => setPhoto(null));
    return () => { revoked = true; };
  }, [me.mail]);

  const open = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const close = () => setAnchor(null);

  const name = me.displayName || "";
  const email = me.mail || me.userPrincipalName || "";

  return <>
    <Tooltip title={name || t("Account")}>
      <IconButton onClick={open} sx={{ p: 0.5 }} aria-label={t("Account")}>
        <Avatar src={photo || undefined} sx={{ width: 32, height: 32, bgcolor: avatarColor(email || name), fontSize: 13 }}>
          {initialsOf(name || email)}
        </Avatar>
      </IconButton>
    </Tooltip>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close} transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, minWidth: 260 }}>
        <Avatar src={photo || undefined} sx={{ width: 48, height: 48, bgcolor: avatarColor(email || name) }}>{initialsOf(name || email)}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>{name}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{email}</Typography>
        </Box>
      </Box>
      <Divider />
      <MenuItem onClick={() => { close(); app.signOut().catch(err => console.error(err)); }}>
        <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
        {t("Sign out")}
      </MenuItem>
    </Menu>
  </>;
};

export default UserMenu;
