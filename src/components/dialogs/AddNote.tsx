// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { useRef } from 'react';
import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent,
  Button, DialogActions, Grid,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { Message } from 'microsoft-graph';
import { useAppContext } from '../../azure/AppContext';
import { Editor } from '@tinymce/tinymce-react';
import { postNote } from '../../api/notes';

const styles = (theme: any) => ({
  form: {
    width: '100%',
    marginTop: theme.spacing(4),
  },
  grid: {
    display: 'flex',
    margin: theme.spacing(1, 1, 1, 1),
    flex: 1,
  },
  input: {
    marginBottom: theme.spacing(3),
  },
  gridItem: {
    display: 'flex',
  },
  propertyInput: {
    margin: theme.spacing(1, 1, 1, 1),
    flex: 1,
  },
  flexTextfield: {
    flex: 1,
    marginRight: 8,
  },
});

function AddNote(props: any) {
  const app = useAppContext();
  const editorRef = useRef<any>(null);
  const { classes, t, open, onClose } = props;

  const handleAdd = () => {
    const note: Message = {
      body: {
        contentType: 'text', // TODO: Support html
        content: editorRef.current ? editorRef.current.getContent() : '',
      },
      subject: editorRef.current ? editorRef.current.getContent({ format: 'text' }) : ''
    };
    postNote(app.authProvider!, note)
      .then(resp => resp.id ? onClose() : null); // TODO: Update table view after successful add. (Maybe create action?)
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
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
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
