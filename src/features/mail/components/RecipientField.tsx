// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Autocomplete, Box, Chip, CircularProgress, TextField, Tooltip, Typography } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";
import { HTMLAttributes, ReactNode, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Contact, Person, Recipient } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { loadAllContacts, selectAllContacts } from "../../contacts/contactsSlice";
import { searchPeople } from "../../../api/contacts";
import { formatRecipient, isValidEmail, splitAddresses, toRecipient } from "../utils";
import PersonAvatar from "../../../components/common/PersonAvatar";

type RecipientFieldProps = {
  label: string;
  value: Recipient[];
  onChange: (value: Recipient[]) => void;
  autoFocus?: boolean;
  endAdornment?: ReactNode;
  onBlur?: () => void;
};

type Option = Recipient & { key: string; secondary?: string };

const toOption = (recipient: Recipient, secondary?: string): Option => ({
  ...recipient,
  key: (recipient.emailAddress?.address || "").toLowerCase(),
  secondary,
});

function contactOptions(contacts: Contact[]): Option[] {
  const result: Option[] = [];
  contacts.forEach(contact => {
    (contact.emailAddresses || []).forEach(address => {
      if (!address.address) return;
      result.push(toOption({ emailAddress: { name: contact.displayName || address.name || "", address: address.address } }, contact.companyName || undefined));
    });
  });
  return result;
}

function personOptions(people: Person[]): Option[] {
  const result: Option[] = [];
  people.forEach(person => {
    (person.scoredEmailAddresses || []).forEach(scored => {
      if (!scored.address) return;
      result.push(toOption({ emailAddress: { name: person.displayName || "", address: scored.address } }, person.jobTitle || person.companyName || undefined));
    });
  });
  return result;
}

const RecipientField = ({ label, value, onChange, autoFocus, endAdornment, onBlur }: RecipientFieldProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const contacts = useTypeSelector(selectAllContacts);

  useEffect(() => { dispatch(loadAllContacts()); }, []);
  const [input, setInput] = useState("");
  const [people, setPeople] = useState<Option[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const local = useMemo(() => contactOptions(contacts), [contacts]);

  // Debounced, only the latest request may update the list
  const requestSeq = useRef(0);
  useEffect(() => {
    clearTimeout(timer.current);
    const seq = ++requestSeq.current;
    const term = input.trim();
    if (term.length < 2) {
      setPeople([]);
      setSearching(false);
      return;
    }
    timer.current = setTimeout(() => {
      setSearching(true);
      searchPeople(term)
        .then(result => { if (seq === requestSeq.current) setPeople(personOptions(result)); })
        .catch(() => { if (seq === requestSeq.current) setPeople([]); })
        .finally(() => { if (seq === requestSeq.current) setSearching(false); });
    }, 300);
    return () => clearTimeout(timer.current);
  }, [input]);

  const options = useMemo(() => {
    const term = input.trim().toLowerCase();
    const seen = new Set(value.map(v => (v.emailAddress?.address || "").toLowerCase()));
    const result: Option[] = [];
    const add = (o: Option) => {
      if (seen.has(o.key)) return;
      seen.add(o.key);
      result.push(o);
    };
    if (term) {
      local.filter(o => o.key.includes(term) || (o.emailAddress?.name || "").toLowerCase().includes(term)).slice(0, 8).forEach(add);
      people.forEach(add);
    }
    return result;
  }, [local, people, input, value]);

  const commitInput = (text: string) => {
    const parts = splitAddresses(text);
    if (parts.length === 0) return;
    onChange([...value, ...parts.map(toRecipient)]);
    setInput("");
  };

  // Enter on pasted "a@x.org, b@y.org" yields one string: split it into several recipients
  const handleChange = (_e: SyntheticEvent, newValue: Array<string | Option>) => {
    onChange(newValue.flatMap(v => typeof v === "string" ? splitAddresses(v).map(toRecipient) : [{ emailAddress: v.emailAddress }]));
    setInput("");
  };

  const handleInput = (_e: SyntheticEvent, text: string) => {
    if (/[,;]$/.test(text)) {
      commitInput(text.slice(0, -1));
    } else {
      setInput(text);
    }
  };

  const handleBlur = () => {
    if (input.trim()) commitInput(input);
    onBlur?.();
  };

  const renderOption = (props: HTMLAttributes<HTMLLIElement>, option: Option) => (
    <li {...props} key={option.key}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.25 }}>
        <PersonAvatar name={option.emailAddress?.name} email={option.emailAddress?.address} size={28} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>{option.emailAddress?.name || option.emailAddress?.address}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {option.emailAddress?.address}{option.secondary ? ` · ${option.secondary}` : ""}
          </Typography>
        </Box>
      </Box>
    </li>
  );

  return (
    <Autocomplete<Option, true, true, true>
      multiple
      freeSolo
      disableClearable
      autoHighlight
      value={value.map(v => toOption(v))}
      inputValue={input}
      options={options}
      loading={searching}
      filterOptions={x => x}
      isOptionEqualToValue={(a, b) => a.key === b.key}
      getOptionLabel={option => typeof option === "string" ? option : (option.emailAddress?.address || "")}
      onChange={handleChange}
      onInputChange={handleInput}
      onBlur={handleBlur}
      renderOption={renderOption}
      renderTags={(tags, getTagProps) => tags.map((tag, index) => {
        const address = tag.emailAddress?.address || "";
        const valid = isValidEmail(address);
        const { key, ...chipProps } = getTagProps({ index });
        return (
          <Tooltip key={key} title={valid ? formatRecipient(tag) : t("Invalid address")}>
            <Chip
              {...chipProps}
              size="small"
              color={valid ? "default" : "error"}
              variant={valid ? "filled" : "outlined"}
              icon={valid ? undefined : <ErrorOutline />}
              label={tag.emailAddress?.name || address}
              sx={{ maxWidth: 260 }}
            />
          </Tooltip>
        );
      })}
      renderInput={params => (
        <TextField
          {...params}
          variant="standard"
          autoFocus={autoFocus}
          placeholder={value.length === 0 ? t("Enter names or email addresses") : ""}
          InputProps={{
            ...params.InputProps,
            disableUnderline: true,
            startAdornment: <>
              <Typography variant="body2" sx={{ color: "text.secondary", minWidth: 36, mr: 0.5, alignSelf: "center" }}>{label}</Typography>
              {params.InputProps.startAdornment}
            </>,
            endAdornment: <>
              {searching && <CircularProgress size={14} sx={{ mr: 1 }} />}
              {endAdornment}
            </>,
          }}
          inputProps={{ ...params.inputProps, "aria-label": label }}
        />
      )}
      sx={{ flex: 1, "& .MuiAutocomplete-inputRoot": { py: 0.5, alignItems: "center" } }}
    />
  );
};

export default RecipientField;
