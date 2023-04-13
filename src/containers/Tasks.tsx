// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { MouseEvent, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../azure/AppContext';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { deleteTaskData, deleteTaskListData, fetchTaskListsData, fetchTasksData, patchTaskData } from '../actions/tasks';
import { Button, IconButton, List, ListItem, ListItemButton, ListItemText, Paper } from '@mui/material';
import { TodoTask, TodoTaskList } from 'microsoft-graph';
import { Editor } from '@tinymce/tinymce-react';
import AddTask from '../components/dialogs/AddTask';
import { Delete } from '@mui/icons-material';
import AddTaskList from '../components/dialogs/AddTaskList';
import { withTranslation } from 'react-i18next';
import AuthenticatedView from '../components/AuthenticatedView';
import FolderList from '../components/FolderList';

const styles: any = {
  content: {
    flex: 1,
    display: 'flex',
  },
  taskList: {
    width: 400,
  },
  taskPaper: {
    margin: '0 16px'
  },
  tinyMceContainer: {
    flex: 1,
  },
  action: {
    margin: 8,
    display: 'flex',
    justifyContent: 'center',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    margin: 8,
  },
};

function Tasks({ t, classes, drawerListElementClass }: any) {
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
  }, [app.authProvider]);

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

  const handleDeleteTaskList = (taskList: TodoTaskList) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(deleteTaskListData({ app, taskList }));
  }

  return (
    <AuthenticatedView
      header={t("Tasks")}
      actions={[<Button
        key={0}
        onClick={handleAddingTask(true)}
        variant='contained'
        color="primary"
        disabled={!selectedTaskList}
      >
        {t("New task")}
      </Button>]}
    >
      <div className={classes.content}>
        <FolderList>
          {taskLists.map((taskList: TodoTaskList, idx: number) => 
            <ListItem disablePadding key={idx} className={drawerListElementClass}>
              <ListItemButton
                onClick={handleTaskListClick(taskList)}
                divider
                selected={selectedTaskList?.id === taskList.id}
              >
                <ListItemText primary={taskList.displayName} />
                <IconButton size='small' onClick={handleDeleteTaskList(taskList)}>
                  <Delete color="error" fontSize='small'/>
                </IconButton>
              </ListItemButton>
            </ListItem>)}
          <Button
            sx={{m: 2}}
            onClick={handleAddingTaskList(true)}
            variant='contained'
            color="primary"
            key={-1}
          >
            {t("New task list")}
          </Button>
        </FolderList>
        <Paper elevation={1} className={classes.taskPaper}>
          <List className={classes.taskList}>
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
        <Paper elevation={4} className={classes.tinyMceContainer}>
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
      <AddTask
        open={addingTask}
        onClose={handleAddingTask(false)}
        taskListId={selectedTaskList?.id}
      />
      <AddTaskList
        open={addingTaskList}
        onClose={handleAddingTaskList(false)}
      />
    </AuthenticatedView>
  );
}

export default withTranslation()(withStyles(styles)(Tasks));
