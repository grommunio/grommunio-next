// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { IconButton, InputAdornment, TextField } from "@mui/material";
import { Close, Search } from "@mui/icons-material";
import { KeyboardEvent, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchContext } from "./SearchContext";

const GlobalSearch = () => {
  const { t } = useTranslation();
  const { handler, query, setQuery } = useSearchContext();
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search box, like in Outlook
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA"].includes(target?.tagName) || target?.isContentEditable;
      if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!handler) return <div style={{ flex: 1 }} />;

  const submit = () => handler.onSearch(query.trim());

  const clear = () => {
    setQuery("");
    handler.onClear?.();
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") clear();
  };

  return (
    <TextField
      inputRef={inputRef}
      value={query}
      onChange={e => setQuery(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={handler.placeholder}
      size="small"
      sx={{
        flex: 1,
        maxWidth: 640,
        mx: 2,
        "& .MuiOutlinedInput-root": {
          backgroundColor: theme => theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : theme.palette.background.default,
          borderRadius: 2,
        },
      }}
      inputProps={{ "aria-label": handler.placeholder }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: query ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={clear} aria-label={t("Clear search")}>
              <Close fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
};

export default GlobalSearch;
