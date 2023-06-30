// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { useRef } from 'react';
import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent,
  Button, DialogActions, Grid,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { Message } from 'microsoft-graph';
import { Editor } from '@tinymce/tinymce-react';
import { useTypeDispatch } from '../../store';
import { postNoteData } from '../../actions/notes';

const styles = {
  gridItem: {
    display: 'flex',
  },
};

function AddNote(props: any) {
  const editorRef = useRef<any>(null);
  const dispatch = useTypeDispatch();
  const { classes, t, open, onClose } = props;

  const handleAdd = () => {
    const note: Message = {
      body: {
        contentType: 'text', // TODO: Support html
        content: editorRef.current ? editorRef.current.getContent() : '',
      },
      subject: editorRef.current ? editorRef.current.getContent({ format: 'text' }) : ''
    };
    dispatch(postNoteData(note))
      .then(resp => {
        if(resp) {
          onClose();
          editorRef.current.setContent('');
        }
      });
  }

  return (
    <Dialog
      onClose={onClose}
      open={open}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>{t('addHeadline', { item: 'Note' })}</DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid item xs={12} className={classes.gridItem}>
            <Editor
              tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={''}
              init={{
                width: "100%",
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                auto_focus: true,
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="secondary"
        >
          {t('Cancel')}
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          color="primary"
        >
          {t('Add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


export default withTranslation()(withStyles(styles)(AddNote));
