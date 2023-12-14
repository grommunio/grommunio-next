import { Autocomplete, Chip, TextField } from "@mui/material";
import GABOption from "./GABOption";
import { Contact } from "microsoft-graph";
import { ContactMail } from "@mui/icons-material";
import { withStyles } from "@mui/styles";

const ContactChip = (props: any) => (
  <Chip
    sx={{ mr: 0.5 }}
    icon={<ContactMail fontSize='small'/>}
    {...props}
  />
);

const styles: any = () => ({
  input: {
    margin: "4px 0px",
  },
});

const GABAutocompleteTextfield = ({ classes, options, value, inputValue, onChange,
  onInputChange, handleContactRemove, renderInput, textfieldProps={} }: any) => {

  return <Autocomplete
    value={value || []}
    inputValue={inputValue}
    onChange={onChange}
    onInputChange={onInputChange}
    multiple
    getOptionLabel={(option: string | Contact) => (option as Contact).displayName || ""}
    renderOption={(props: any, option: Contact) => (
      <GABOption {...props} key={option.id} contact={option as Contact}/>
    )}
    filterOptions={(options, state) => {
      return options.filter(o =>
        (o as Contact)
          .displayName?.toLowerCase()
          .includes(state.inputValue.toLowerCase())
      )
    }}
    freeSolo
    fullWidth
    renderTags={(tag: readonly (string | Contact)[], getTagProps) => 
      tag.map((option: (string | Contact), index: number) => {
        const { id, displayName } = ((option || {}) as Contact);
        return <ContactChip
          {...getTagProps({ index })}
          label={displayName}
          onDelete={handleContactRemove(id || "", "ccRecipients")}
        />
      })
    }
    options={options}
    disableClearable
    renderInput={renderInput ? renderInput : (params) => (
      <TextField
        {...params}
        className={classes.input}
        {...textfieldProps}
      />
    )}
  />;
}

export default withStyles(styles)(GABAutocompleteTextfield);
