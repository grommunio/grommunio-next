// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2022 grommunio GmbH

import { ChangeEvent, useState } from 'react';
import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent, TextField,
  Button, DialogActions, Grid,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { TodoTaskList } from 'microsoft-graph';
import { useAppContext } from '../../azure/AppContext';
import { postTaskListData } from '../../actions/tasks';
import { useTypeDispatch } from '../../store';

const styles = (theme: any) => ({
  gridItem: {
    display: 'flex',
  },
  propertyInput: {
    margin: theme.spacing(1, 1, 1, 1),
    flex: 1,
  },
});

function AddTaskList(props: any) {
  const app = useAppContext();
  const { classes, t, open, onClose } = props;
  const [ taskList, setTaskList ] = useState<TodoTaskList>({});
  const { displayName } = taskList;
  const dispatch = useTypeDispatch();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const inputName = e.target.name;
    setTaskList((prevState: any)=> {
      return({
        ...prevState,
        [inputName]: newValue,
      });
    });
  }

  const handleAdd = () => {
    dispatch(postTaskListData({app, taskList}))
      .then(resp => {
        if(resp) {
          setTaskList({});
          onClose();
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
      <DialogTitle>{t('addHeadline', { item: 'Task list' })}</DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid item xs={12} className={classes.gridItem}>
            <TextField
              name="displayName"
              autoFocus
              className={classes.propertyInput}
              fullWidth
              label={t("Display name")}
              value={displayName || ''}
              onChange={handleChange}
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


export default withTranslation()(withStyles(styles)(AddTaskList));
