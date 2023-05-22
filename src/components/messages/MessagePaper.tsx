// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { Forward, ReplyAll } from "@mui/icons-material";
import { Avatar, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { withStyles } from "@mui/styles";
import { Message } from "microsoft-graph";
<<<<<<< HEAD
import withTinyMCE from "../hocs/withTinyMCE";
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
import { Editor } from '@tinymce/tinymce-react';
import { useTranslation } from "react-i18next";
import { useRef } from "react";

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
  },
  header: {
    display: 'flex',
    margin: '4px 0 8px 0',
  },
  flexRow: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
}

type MessageProps = {
  classes: any;
  selectedMsg: Message | null,
  handleForward: () => void,
  handleReply: () => void,
}

function MessagePaper({ classes, handleForward, handleReply, selectedMsg }: MessageProps) {
  const { t } = useTranslation();
  const editorRef = useRef({});
  const names = selectedMsg?.sender?.emailAddress?.name?.split(" ") || [" ", " "];
  return <Paper className={classes.root}>
    <div className={classes.avatarContainer}>
      <Avatar sx={{ width: 48, height: 48 }}>
        <Typography variant='body1'>{names[0][0]}{names[names.length - 1][0]}</Typography>
      </Avatar>
    </div>
    <div className={classes.tinyMceContainer}>
      {selectedMsg && <div className={classes.header}>
        <div>
          <Typography variant="body1">
            {selectedMsg.from?.emailAddress?.name || ''} &lt;{selectedMsg.from?.emailAddress?.address || ''}&gt;
          </Typography>
          <Typography variant="body1">
            {t("To")}: {selectedMsg.toRecipients?.map(recip => recip.emailAddress?.address).join(", ")}
          </Typography>
        </div>
        <div id="mailActionsContainer" className={classes.mailActionsContainer}>
          <Tooltip title={t("Reply all")} placement="top">
            <IconButton onClick={handleReply}>
              <ReplyAll color="primary"/>
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Forward")} placement="top">
            <IconButton onClick={handleForward}>
              <Forward color="primary"/>
            </IconButton>
          </Tooltip>
        </div>
      </div>}
      {selectedMsg?.body?.content && <div className={classes.flexRow}>
        <Editor
          tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
          onInit={(evt, editor) => editorRef.current = editor}
          initialValue={selectedMsg?.body?.content}
          disabled
          init={{
            disabled: true,
            menubar: false,
            readonly: true,
            toolbar: '',
<<<<<<< HEAD
            skin: "oxide-dark",
            content_css: "dark",
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
            plugins: ['wordcount'],
            width: '100%',
            height: '100%', // Doesn't work on its own. The .tox-tinymce class has been overwritten as well
          }}
        /></div>}
    </div>
  </Paper>
  ;
}

<<<<<<< HEAD
withTinyMCE(MessagePaper)
=======
>>>>>>> b3f9afc4dddec9a0202d97ae468d825ea3b12a15
export default withStyles(styles)(MessagePaper);