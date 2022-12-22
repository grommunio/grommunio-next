// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useRef, useState } from 'react';
import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent, TextField,
  Button, DialogActions, Grid, MenuItem,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { TodoTask, TodoTaskList } from 'microsoft-graph';
import { useAppContext } from '../../azure/AppContext';
import { postTask } from '../../api/tasks';
import { useTypeSelector } from '../../store';
import { Editor } from '@tinymce/tinymce-react';

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

function AddTask(props: any) {
  const app = useAppContext();
  const editorRef = useRef<any>(null);
  const { taskLists } = useTypeSelector(state => state.tasks);
  const { classes, t, open, onClose } = props;
  const [ task, setTask ] = useState<TodoTask>({});
  const [ selectedTaskList, setSelectedTaskList ] = useState<string>('');
  const { title } = task;

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
    postTask(app.authProvider!, selectedTaskList || '', mergedTask)
      .then(resp => resp.id ? onClose() : null); // TODO: Update table view after successful add. (Maybe create action?)
  }

  const handleTaskList = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedTaskList(e.target.value);
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
              className={classes.propertyInput}
              fullWidth
              label={t("Task list")}
              value={selectedTaskList || ''}
              onChange={handleTaskList}
              select
            >
              {taskLists.map((taskList: TodoTaskList) =>
                <MenuItem key={taskList.id} value={taskList.id}>{taskList.displayName}</MenuItem>
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} className={classes.gridItem}>
            <TextField
              name="title"
              className={classes.propertyInput}
              fullWidth
              label={t("Title")}
              value={title || ''}
              onChange={handleChange}
            />
          
          </Grid>
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


export default withTranslation()(withStyles(styles)(AddTask));
