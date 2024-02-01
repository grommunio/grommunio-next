import { Download } from "@mui/icons-material";
import { FileAttachment } from "microsoft-graph"
import { downloadBase64Content, readableBytesFormat } from "../utils";
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
    <span>
      <Typography style={{ marginRight: 4 }}>{attachment.name}</Typography>
      <Typography
        style={{ marginRight: 4 }}
        variant="caption"
      >
        {readableBytesFormat(attachment.size || 0)}
      </Typography>
    </span>
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <Download color="primary" />
    </span>
  </span> 
}

export default AttachmentItem;
