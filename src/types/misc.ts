import { AlertColor } from "@mui/material";

export type AlertType = {
  id: number,
  message: string;
  severity?: AlertColor;
}