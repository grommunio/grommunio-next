// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Forward, Print, Reply, ReplyAll } from "@mui/icons-material";
import { Avatar, IconButton, Paper, Tooltip, Typography, useTheme } from "@mui/material";
import { withStyles } from "@mui/styles";
import { Message } from "microsoft-graph";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react"; 
import { buildEmailPrintView, convertHtmlMailToDarkmode } from "../../htmlUtils";
import { purify } from "../../utils";

const styles: any = {
  root: {
    display: 'flex',
    flex: 1,
    padding: 16,
  },
  tinyMceContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  mailActionsContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  header: {
    display: 'flex',
    margin: '4px 0 8px 0',
  },
  flexRow: {
    display: 'flex',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  a: {
    textDecoration: "underline",
    cursor: 'pointer',
  },
}

type MessageProps = {
  classes: any;
  selectedMsg: Message | null,
  handleForward: () => void,
  handleReply: (all: boolean) => () => void,
}

function MessagePaper({ classes, handleForward, handleReply, selectedMsg }: MessageProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const iframeRef = useRef(null);
  const [iframeContent, setIframeContent] = useState<string>("");
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  useEffect(() => {
    const cur = iframeRef.current as HTMLIFrameElement | null;
    if(cur) {
      let htmlMail = document.createElement('html');
      htmlMail.innerHTML = purify(selectedMsg?.body?.content || "");

      // Convert emails styling to be properly displayed in darkmode
      if(theme.palette.mode == "dark" && !showOriginal) {
        htmlMail = convertHtmlMailToDarkmode(htmlMail);
      }
      setIframeContent(htmlMail.outerHTML);
    }
  }, [selectedMsg, iframeRef?.current, theme.palette.mode, showOriginal]);

  useEffect(() => {
    setShowOriginal(false);
  }, [selectedMsg]);

  const handlePrintMail = () => {
    buildEmailPrintView(iframeContent, selectedMsg);
  }

  const names = selectedMsg?.sender?.emailAddress?.name?.split(" ") || [" ", " "];
  return <Paper className={classes.root}>
    <div className={classes.avatarContainer}>
      <Avatar sx={{ width: 48, height: 48 }}>
        <Typography variant='body1'>{names[0][0]}{names[names.length - 1][0]}</Typography>
      </Avatar>
    </div>
    <div className={classes.tinyMceContainer} id="tinyMCEContainer">
      {selectedMsg && <div className={classes.header}>
        <div>
          <Typography variant="body1">
            {selectedMsg.from?.emailAddress?.name || ''} &lt;{selectedMsg.from?.emailAddress?.address || ''}&gt;
          </Typography>
          <Typography variant="body1">
            {t("To")}: {selectedMsg.toRecipients?.map(recip => recip.emailAddress?.address).join(", ")}
          </Typography>
          <Typography variant="body1">
            {t("Cc")}: {selectedMsg.ccRecipients?.map(recip => recip.emailAddress?.address).join(", ")}
          </Typography>
        </div>
        <div id="mailActionsContainer" className={classes.mailActionsContainer}>
          <Tooltip title={t("Print")} placement="top">
            <IconButton onClick={handlePrintMail}>
              <Print color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Reply all")} placement="top">
            <IconButton onClick={handleReply(true)}>
              <ReplyAll color="primary"/>
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Reply")} placement="top">
            <IconButton onClick={handleReply(false)}>
              <Reply color="primary"/>
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Forward")} placement="top">
            <IconButton onClick={handleForward}>
              <Forward color="primary"/>
            </IconButton>
          </Tooltip>
        </div>
      </div>}
      {!showOriginal && theme.palette.mode === "dark" && <div>
        <Typography variant="caption">
          {t("This content has been modified for better readability. ")}
          <a onClick={() => setShowOriginal(true)} className={classes.a}>Show original</a>
        </Typography>
      </div>}
      <div className={classes.flexRow}>
        <iframe
          id="iframe"
          ref={iframeRef}
          width="100%"
          style={{ border: "none" }}
          srcDoc={iframeContent}
        />
      </div>
    </div>
  </Paper>
  ;
}

export default withStyles(styles)(MessagePaper);