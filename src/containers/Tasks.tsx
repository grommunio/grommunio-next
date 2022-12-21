// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { MouseEvent, useEffect, useRef, useState } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';
import { useAppContext } from '../azure/AppContext';
import './Calendar.css';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { deleteTaskData, fetchTaskListsData, fetchTasksData, patchTaskData } from '../actions/tasks';
import { Button, IconButton, List, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import { TodoTask, TodoTaskList } from 'microsoft-graph';
import { Editor } from '@tinymce/tinymce-react';
import AddTask from '../components/dialogs/AddTask';
import { Delete } from '@mui/icons-material';
import theme from '../theme';
import AddTaskList from '../components/dialogs/AddTaskList';
import { withTranslation } from 'react-i18next';

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

function Tasks({ t, classes }: any) {
  const app = useAppContext();
  const editorRef = useRef<any>(null);
  const dispatch = useTypeDispatch();
  const [ dirty, setDirty ] = useState<boolean>(false);
  const { taskLists, tasks } = useTypeSelector(state => state.tasks);
  const [addingTaskList, setAddingTaskList] = useState<boolean>(false);
  const [addingTask, setAddingTask] = useState<boolean>(false);
  const [selectedTaskList, setSelectedTaskList] = useState<TodoTaskList | null>(null);
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchTaskListsData(app));
  }, []);

  const handleTaskListClick = (taskList: TodoTaskList) => () => {
    setSelectedTaskList(taskList);
    setSelectedTask(null);
    setDirty(false);
    dispatch(fetchTasksData({taskList, app}));
  }

  const handleTaskClick = (task: TodoTask) => () => {
    setSelectedTask(task);
    setDirty(false);
  }

  const handleAddingTask = (val: boolean) => () => setAddingTask(val || false);
  const handleAddingTaskList = (val: boolean) => () => setAddingTaskList(val || false);

  const handleTaskDelete = (taskId: string) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(deleteTaskData({
      app,
      taskId,
      taskListId: (selectedTaskList as TodoTaskList)?.id || ''
    }));
  }

  const handleSave = () => {
    const mergedTask: TodoTask = {
      ...selectedTask,
      body: {
        ...selectedTask?.body,
        ...(editorRef.current ? {
          content: editorRef.current.getContent()
         } : {}),
      }
    }
    dispatch(patchTaskData({
      app,
      taskListId: selectedTaskList?.id || '',
      task: mergedTask
    }))
      .then(() => setDirty(false));
  }

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Typography variant="h4">Tasks</Typography>
        
        <div className={classes.content}>
          <Paper>
            <div className={classes.action}>
              <Button
                onClick={handleAddingTaskList(true)}
                variant='contained'
                color="primary"
              >
                New Task List
              </Button>
            </div>
            <List className={classes.mailList}>
              {taskLists.map((taskList: TodoTaskList) =>
                <ListItemButton
                  key={taskList.id}
                  onClick={handleTaskListClick(taskList)}
                  divider
                >
                  <ListItemText
                    primary={taskList.displayName}
                  />
                </ListItemButton>
              )}
            </List>
          </Paper>
          <Paper elevation={4}>
            <div className={classes.action}>
              <Button
                onClick={handleAddingTask(true)}
                variant='contained'
                color="primary"
              >
                New Task
              </Button>
            </div>
            <List className={classes.mailList}>
              {tasks.map((task: TodoTask) =>
                <ListItemButton
                  key={task.id}
                  onClick={handleTaskClick(task)}
                  divider
                >
                  <ListItemText
                    primary={task.title}
                  />
                  <IconButton onClick={handleTaskDelete(task.id || '')}>
                    <Delete color="error"/>
                  </IconButton>
                </ListItemButton>
              )}
            </List>
          </Paper>
          <Paper elevation={8} className={classes.tinyMceContainer}>
            {selectedTask?.body?.content && <Editor
              tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={selectedTask?.body?.content}
              onDirty={() => setDirty(true)}
              init={{
                height: 400,
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />}
            {selectedTask &&
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
      <AddTask
        open={addingTask}
        onClose={handleAddingTask(false)}
      />
      <AddTaskList
        open={addingTaskList}
        onClose={handleAddingTaskList(false)}
      />
    </AuthenticatedTemplate>
  );
}

export default withTranslation()(withStyles(styles)(Tasks));
