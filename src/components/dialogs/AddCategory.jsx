// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { useState } from 'react';
import { withStyles } from '@mui/styles';
import { Dialog, DialogTitle, DialogContent, TextField,
  Button, DialogActions, Grid, Typography,
} from '@mui/material';
import { withTranslation } from 'react-i18next';
import { useAppContext } from '../../azure/AppContext';
import { postMessageCategory } from '../../actions/messages';
import { useDispatch } from 'react-redux';
import CategoryColorPicker from '../CategoryColorPicker';
import { hexColorToPresetName } from '../../utils';

const styles = theme => ({
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
  pickerContainer: {
    display: 'flex',
    margin: theme.spacing(1),
    justifyContent: "center",
  }
});

function AddCategory(props) {
  const app = useAppContext();
  const dispatch = useDispatch();
  const { classes, t, open, onClose } = props;
  const [ category, setCategory ] = useState({ displayName: "", color: "#ff0000" });
  const { displayName, color } = category;

  const handleChange = (e) => {
    const newValue = e.target.value;
    const inputName = e.target.name;
    setCategory(prevState=> {
      return({
        ...prevState,
        [inputName]: newValue,
      });
    });
  }

  const handleAdd = () => {
    const cat = {
      displayName,
      color: hexColorToPresetName(color),
    };
    dispatch(postMessageCategory({app, category: cat}))
      .then(resp => resp?.payload?.id ? onClose() : null);
  }

  const handleColorChange = (color) => {
    setCategory({ ...category, color });
  }
  
  return (
    <Dialog
      onClose={onClose}
      open={open}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{t('addHeadline', { item: 'Category' })}</DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid item xs={12} className={classes.gridItem}>
            <TextField
              name="displayName"
              className={classes.propertyInput}
              fullWidth
              label={t("Name")}
              value={displayName || ''}
              onChange={handleChange}
              autoFocus
            />
          </Grid>
          <Typography variant='h6' sx={{ mt: 1 }}>Color</Typography>
          <Grid item xs={12} className={classes.pickerContainer}>
            <CategoryColorPicker color={color} onChangeComplete={handleColorChange}/>
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


export default withTranslation()(withStyles(styles)(AddCategory));
