// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useRef, useState } from 'react';
import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent, TextField,
  Button, DialogActions, Grid,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { TodoTask } from 'microsoft-graph';
import { useAppContext } from '../../azure/AppContext';
import withTinyMCE from '../hocs/withTinyMCE';
import { Editor } from '@tinymce/tinymce-react';
import { postTaskData } from '../../actions/tasks';
import { useTypeDispatch } from '../../store';

const styles = (theme: any) => ({
  gridItem: {
    display: 'flex',
  },
  propertyInput: {
    margin: theme.spacing(1, 0),
    flex: 1,
  },
});

function AddTask(props: any) {
  const app = useAppContext();
  const editorRef = useRef<any>(null);
  const { classes, t, open, onClose, taskListId } = props;
  const [ task, setTask ] = useState<TodoTask>({});
  const { title } = task;
  const dispatch = useTypeDispatch();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const inputName = e.target.name;
    setTask((prevState: any)=> {
      return({
        ...prevState,
        [inputName]: newValue,
      });
    });
  }

  const handleAdd = () => {
    const mergedTask: TodoTask = {
      ...task,
      body: {
        contentType: 'text', // TODO: Support html
        content: editorRef.current ? editorRef.current.getContent() : '',
      },
    }
    dispatch(postTaskData({app, taskListId, task: mergedTask}))
      .then(resp => {
        if(resp) {
          onClose();
          setTask({});
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
      <DialogTitle>{t('addHeadline', { item: 'Task' })}</DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid item xs={12} className={classes.gridItem}>
            <TextField
              name="title"
              className={classes.propertyInput}
              fullWidth
              label={t("Title")}
              value={title || ''}
              onChange={handleChange}
              autoFocus
            />
          
          </Grid>
          <Grid item xs={12} className={classes.gridItem}>
            <Editor
              tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={''}
              init={{
                width: "100%",
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                skin: "oxide-dark",
                content_css: "dark"
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
          disabled={!title || !taskListId}
        >
          {t('Add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

withTinyMCE(AddTask)

export default withTranslation()(withStyles(styles)(AddTask));
