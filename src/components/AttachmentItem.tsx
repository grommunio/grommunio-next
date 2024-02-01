import { Download } from "@mui/icons-material";
import { FileAttachment } from "microsoft-graph"
import { downloadBase64Content } from "../utils";
import { Typography } from "@mui/material";

type AttachmentItemT = {
  attachment: FileAttachment;
}

const AttachmentItem = ({ attachment, ...props }: AttachmentItemT) => {

  const handleDownload = () => {
    downloadBase64Content(attachment);
  }

  return <span
    style={{ cursor: 'pointer', padding: 8, margin: 4, border: "1px solid grey", display: 'flex' }}
    onClick={handleDownload}
    {...props}
  >
    <Typography style={{ marginRight: 4 }}>{attachment.name}</Typography>
    <Download color="primary" />
  </span> 
}

export default AttachmentItem;
