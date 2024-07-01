import { Autocomplete, Chip, TextField } from "@mui/material";
import GABOption from "./GABOption";
import { Contact } from "microsoft-graph";
import { ContactMail } from "@mui/icons-material";
import { withStyles } from "@mui/styles";
import { useState } from "react";

const ContactChip = (props: any) => (
  <Chip
    sx={{ mr: 0.5 }}
    icon={props.id ? <ContactMail fontSize='small'/> : null}
    {...props}
  />
);

const styles: any = () => ({
  input: {
    margin: "4px 0px",
  },
});

const AttendeeAutocomplete = ({ classes, options, value, onChange,
  handleContactRemove, renderInput, textfieldProps={} }: any) => {
  
  const [inputValue, setInputValue] = useState<string>("");

  const onInputChange = (_e: any, input: string) => {
    if(input.endsWith(",")) {
      const mail = input.slice(0, input.length - 1);
      onChange(null, [...value, { displayName: mail, emailAddresses: [{ address: mail }]}]);
      setInputValue("");
    } else {
      setInputValue(input);
    }
  }

  const handleBlur = () => {
    if(inputValue) {
      onChange(null, [...value, { displayName: inputValue, emailAddresses: [{ address: inputValue }]}]);
      setInputValue("");
    }
  }

  return <Autocomplete
    value={value || []}
    inputValue={inputValue}
    onChange={onChange}
    onInputChange={onInputChange}
    multiple
    getOptionLabel={(option: string | Contact) => (option as Contact).displayName || ""}
    renderOption={(props: any, option: Contact) => (
      <GABOption {...props} key={option.id} contact={option}/>
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
          id={id}
          label={displayName}
          onDelete={handleContactRemove(index)}
        />
      })
    }
    options={options}
    disableClearable
    onBlur={handleBlur}
    renderInput={renderInput ? renderInput : (params) => (
      <TextField
        {...params}
        className={classes.input}
        {...textfieldProps}
      />
    )}
  />;
}

export default withStyles(styles)(AttendeeAutocomplete);
