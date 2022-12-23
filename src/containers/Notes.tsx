// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { MouseEvent, useEffect, useRef, useState } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { Button, IconButton, List, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import { Message } from 'microsoft-graph';
import { Editor } from '@tinymce/tinymce-react';
import { Delete } from '@mui/icons-material';
import theme from '../theme';
import { withTranslation } from 'react-i18next';
import { deleteNoteData, fetchNotesData } from '../actions/notes';
import AddNote from '../components/dialogs/AddNote';
import { patchNote } from '../api/notes';

const styles: any = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    display: 'flex',
  },
  centerRow: {
    display: 'flex',
    justifyContent: 'center',
    flex: 1,
  },
  mailList: {
    width: 400,
    height: '100%',
  },
  tinyMceContainer: {
    flex: 1,
  },
  action: {
    margin: theme.spacing(1),
    display: 'flex',
    justifyContent: 'center',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    margin: 8,
  },
};

function Notes({ t, classes }: any) {
  const app = useAppContext();
  const editorRef = useRef<any>(null);
  const dispatch = useTypeDispatch();
  const [ dirty, setDirty ] = useState<boolean>(false);
  const { notes } = useTypeSelector(state => state.notes);
  const [addingNote, setAddingNote] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<Message | null>(null);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchNotesData(app));
  }, []);

  const handleNoteClick = (note: Message) => () => {
    setSelectedNote(note);
    setDirty(false);
  }

  const handleAddNote = (val: boolean) => () => setAddingNote(val || false);

  const handleNoteDelete = (noteId: string) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(deleteNoteData({
      app,
      noteId
    }));
  }

  const handleSave = () => {
    const mergedNote: Message = {
      id: selectedNote?.id || '',
      body: {
        ...selectedNote?.body,
        ...(editorRef.current ? {
          content: editorRef.current.getContent()
         } : {}),
      },
      subject: editorRef.current ? editorRef.current.getContent({ format: 'text' }) : '',
    }
    patchNote(app.authProvider!, mergedNote);
  }

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Typography variant="h4">{t("Notes")}</Typography>
        
        <div className={classes.content}>
          <Paper>
            <div className={classes.action}>
              <Button
                onClick={handleAddNote(true)}
                variant='contained'
                color="primary"
              >
                {t("New note")}
              </Button>
            </div>
            <List className={classes.mailList}>
              {notes.map((note: Message) =>
                <ListItemButton
                  key={note.id}
                  onClick={handleNoteClick(note)}
                  divider
                >
                  <ListItemText
                    primary={note.subject}
                  />
                  <IconButton onClick={handleNoteDelete(note.id || '')}>
                    <Delete color="error"/>
                  </IconButton>
                </ListItemButton>
              )}
            </List>
          </Paper>
          <Paper elevation={8} className={classes.tinyMceContainer}>
            {selectedNote?.body?.content && <Editor
              tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={selectedNote?.body?.content}
              onDirty={() => setDirty(true)}
              init={{
                height: 400,
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />}
            {selectedNote &&
            <div className={classes.buttonRow}>
              <Button
                disabled={!dirty}
                onClick={handleSave}
                variant="contained"
              >
                {t("Save")}
              </Button>
            </div>}
          </Paper>
        </div>
      </div>
      <AddNote
        onClose={handleAddNote(false)}
        open={addingNote}
      />
    </AuthenticatedTemplate>
  );
}

export default withTranslation()(withStyles(styles)(Notes));
