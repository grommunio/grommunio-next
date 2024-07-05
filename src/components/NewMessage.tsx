// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { ChangeEvent, MouseEvent, useRef, useState } from 'react';
import { withStyles } from '@mui/styles';
import { IconButton, Paper, Typography } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Message } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
import GABAutocompleteTextfields from './NewMessageHeader';
import { purify } from '../utils';
import { AttachFile } from '@mui/icons-material';


const styles: any = () => ({
  content: {
    display: 'flex',
    minHeight: '100%',
    height: 0,
    flexDirection: 'column',
    overflow: "auto",
  },
  tinyMceContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
  },
  attachments: {
    display: 'flex',
    alignItems: 'center',
  }
});

type MessagesProps = {
  classes: any;
  handleTabLabelChange: (label: string) => void;
  handleDraftClose: () => void;
  initialState?: any;
  handleNewMessage: (a1?: any, a2?: any) => (e: MouseEvent<HTMLElement>) => void;
}

function NewMessage({ classes, handleTabLabelChange, handleNewMessage, handleDraftClose, initialState }: MessagesProps) {
  const { i18n } = useTranslation();
  const editorRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList>();

  const submitMessage = (message: Message, send: boolean) => {
    const finalMessage: Message = {
      ...message,
      body: {
        contentType: 'html',
        content: editorRef.current ? purify(editorRef.current.getContent()) : '',
      },
    }
    postMessage(finalMessage, send, files || [])
      .then(handleDraftClose);
  }

  // handles file upload
  const handleUploadConfirm = (e: ChangeEvent<HTMLInputElement>) => {
    if(e.target.files) setFiles(e.target.files);
  };

  const handleUpload = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div className={classes.content}>
      <Paper className={classes.tinyMceContainer}>
        <GABAutocompleteTextfields
          handleNewMessage={handleNewMessage}
          initialState={initialState}
          handleTabLabelChange={handleTabLabelChange}
          submit={submitMessage}
          handleDraftClose={handleDraftClose}
        />
        <div className={classes.attachments}>
          <IconButton onClick={handleUpload}>
            <AttachFile />
          </IconButton>
          <Typography>{Array.from(files || []).map(file => file.name).join(", ")}</Typography>
        </div>
        <Editor
          tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
          onInit={(evt, editor) => editorRef.current = editor}
          initialValue={initialState?.body?.content || ''}
          init={{
            id: 'tinyMCE-editor',
            language: i18n.language,
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
        />
      </Paper>
      <input
        accept={"application/pdf"}
        hidden
        type="file"
        multiple
        ref={inputRef}
        onChange={handleUploadConfirm}
      />
    </div>
  );
}


export default withStyles(styles)(NewMessage);
