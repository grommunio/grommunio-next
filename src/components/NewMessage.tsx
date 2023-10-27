// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { MouseEvent, useRef } from 'react';
import { withStyles } from '@mui/styles';
import { Paper } from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import { postMessage } from '../api/messages';
import { Message } from 'microsoft-graph';
import { useTranslation } from 'react-i18next';
import GABAutocompleteTextfields from './NewMessageHeader';
import { purify } from '../utils';


const styles: any = () => ({
  content: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
  },
  tinyMceContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
  },
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

  const submitMessage = (message: Message, send: boolean) => {
    const finalMessage: Message = {
      ...message,
      body: {
        contentType: 'html',
        content: editorRef.current ? purify(editorRef.current.getContent()) : '',
      },
    }
    postMessage(finalMessage, send)
      .then(handleDraftClose);
  }

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
    </div>
  );
}


export default withStyles(styles)(NewMessage);
