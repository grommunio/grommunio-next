// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Avatar, SxProps, Theme } from "@mui/material";
import { avatarColor, initialsOf } from "../../utils";

type PersonAvatarProps = {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: number;
  sx?: SxProps<Theme>;
};

const PersonAvatar = ({ name, email, src, size = 36, sx }: PersonAvatarProps) => {
  const label = name || email || "";
  return (
    <Avatar
      src={src || undefined}
      alt={label}
      sx={{ width: size, height: size, fontSize: Math.round(size * 0.4), bgcolor: avatarColor(email || name), ...sx }}
    >
      {initialsOf(label) || "?"}
    </Avatar>
  );
};

export default PersonAvatar;
