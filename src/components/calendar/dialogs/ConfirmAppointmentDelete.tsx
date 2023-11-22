import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

type ConfirmAppointmentDeleteProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmAppointmentDelete = ({ open, onClose, onConfirm }: ConfirmAppointmentDeleteProps) => {
  return <Dialog open={open} onClose={onClose}>
    <DialogTitle>Delete Appointment</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete this appointment?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button
        onClick={onClose}
        color="secondary"
        variant="outlined"
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        color="error"
        variant="outlined"
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
}

export default ConfirmAppointmentDelete;