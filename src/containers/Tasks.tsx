// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { MouseEvent, useEffect, useRef, useState } from 'react';
import { withStyles } from '@mui/styles';
import { useTypeDispatch, useTypeSelector } from '../store';
import { deleteTaskData, deleteTaskListData, fetchTaskListsData, fetchTasksData, patchTaskData } from '../actions/tasks';
import { Button, Checkbox, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Slide } from '@mui/material';
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
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    margin: 8,
  },
};

function Tasks({ t, classes }: any) {
  const editorRef = useRef<any>(null);
  const dispatch = useTypeDispatch();
  const { taskLists, tasks } = useTypeSelector(state => state.tasks);
  const [addingTaskList, setAddingTaskList] = useState<boolean>(false);
  const [addingTask, setAddingTask] = useState<boolean>(false);
  const [selectedTaskList, setSelectedTaskList] = useState<TodoTaskList | null>(null);
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);

  // componentDidMount()
  useEffect(() => {
    dispatch(fetchTaskListsData());
  }, []);

  const handleTaskListClick = (taskList: TodoTaskList) => () => {
    setSelectedTaskList(taskList);
    setSelectedTask(null);
    dispatch(fetchTasksData(taskList));
  }

  const handleTaskClick = (task: TodoTask) => () => {
    setSelectedTask(task);
  }

  const handleAddingTask = (val: boolean) => () => setAddingTask(val || false);
  const handleAddingTaskList = (val: boolean) => () => setAddingTaskList(val || false);

  const handleTaskDelete = (taskId: string) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(deleteTaskData(
      taskId,
      (selectedTaskList as TodoTaskList)?.id || '',
    ));
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
    dispatch(patchTaskData(
      mergedTask,
      selectedTaskList?.id || '',
    ));
  }

  const handleDeleteTaskList = (taskList: TodoTaskList) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(deleteTaskListData(taskList.id!));
  }

  const handleTaskCompleted = (task: TodoTask) => (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    dispatch(patchTaskData({
      id: task.id || "",
      status: task.status === "completed" ? "notStarted" : "completed"
    },
    selectedTaskList?.id || ''));
  }

  return (
    <AuthenticatedView
      header={t("Tasks")}
      actions={<Button
        key={0}
        onClick={handleAddingTask(true)}
        variant='contained'
        color="primary"
        disabled={!selectedTaskList}
      >
        {t("New task")}
      </Button>}
    >
      <div className={classes.content}>
        <FolderList>
          {taskLists.map((taskList: TodoTaskList, idx: number) => 
            <ListItem disablePadding key={idx}>
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
            {tasks.map((task: TodoTask) => <Slide key={task.id} in direction='left'>
              <ListItemButton
                key={task.id}
                onClick={handleTaskClick(task)}
                divider
              >
                <ListItemIcon>
                  <Checkbox
                    checked={task.status == "completed"}
                    onClick={handleTaskCompleted(task)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={task.title}
                />
                <IconButton onClick={handleTaskDelete(task.id || '')}>
                  <Delete color="error"/>
                </IconButton>
              </ListItemButton>
            </Slide>
              
            )}
          </List>
        </Paper>
        <Paper elevation={4} className={classes.tinyMceContainer}>
          {selectedTask?.body?.content && <Editor
            tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={selectedTask?.body?.content}
            init={{
              height: 400,
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
          />}
          {selectedTask &&
          <div className={classes.buttonRow}>
            <Button
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
