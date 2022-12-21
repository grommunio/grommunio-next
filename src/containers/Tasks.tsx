// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { MouseEvent, useEffect, useRef, useState } from 'react';
import { AuthenticatedTemplate } from '@azure/msal-react';
import { useAppContext } from '../azure/AppContext';
import './Calendar.css';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { deleteTaskData, fetchTaskListsData, fetchTasksData } from '../actions/tasks';
import { Button, IconButton, List, ListItemButton, ListItemText, Paper, Typography } from '@mui/material';
import { TodoTask, TodoTaskList } from 'microsoft-graph';
import { Editor } from '@tinymce/tinymce-react';
import AddTask from '../components/dialogs/AddTask';
import { Delete } from '@mui/icons-material';

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
};

function Tasks({ classes }: any) {
  const app = useAppContext();
  const editorRef = useRef({});
  const dispatch = useTypeDispatch();
  const { taskLists, tasks } = useTypeSelector(state => state.tasks);
  const [adding, setAdding] = useState<boolean>(false);
  const [selectedTaskList, setSelectedTaskList] = useState<TodoTaskList | null>(null);
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchTaskListsData(app));
  }, []);

  const handleTaskListClick = (taskList: TodoTaskList) => () => {
    setSelectedTaskList(taskList);
    setSelectedTask(null);
    dispatch(fetchTasksData({taskList, app}));
  }

  const handleTaskClick = (task: TodoTask) => () => setSelectedTask(task);

  const handleAdding = (val: boolean) => () => setAdding(val || false);

  const handleTaskDelete = (taskId: string) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(deleteTaskData({
      app,
      taskId,
      taskListId: (selectedTaskList as TodoTaskList)?.id || ''
    }));
  }

  return (
    <AuthenticatedTemplate>
      <div className={classes.root}>
        <Typography variant="h4">Tasks</Typography>
        <div>
         <Button onClick={handleAdding(true)} variant='contained' color="primary">New Task</Button>
        </div>
        <div className={classes.content}>
          <Paper>
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
          <Paper elevation={8} id="readonlyDiv" className={classes.tinyMceContainer}>
            {selectedTask?.body?.content && <Editor
              tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={selectedTask?.body?.content}
              disabled
              init={{
                disabled: true,
                height: '100%',
                menubar: false,
                readonly: true,
                toolbar: '',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
              }}
            />}
          </Paper>
        </div>
      </div>
      <AddTask
        open={adding}
        onClose={handleAdding(false)}
      />
    </AuthenticatedTemplate>
  );
}

export default withStyles(styles)(Tasks);
