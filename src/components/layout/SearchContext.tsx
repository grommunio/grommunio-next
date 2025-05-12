// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// The top bar search box searches whatever module is shown. Modules register a
// handler with useGlobalSearch() and the box only renders while one exists.
export type SearchHandler = {
  placeholder: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
};

type SearchContextValue = {
  handler: SearchHandler | null;
  setHandler: (handler: SearchHandler | null) => void;
  query: string;
  setQuery: (query: string) => void;
};

const SearchContext = createContext<SearchContextValue>({
  handler: null,
  setHandler: () => undefined,
  query: "",
  setQuery: () => undefined,
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [handler, setHandler] = useState<SearchHandler | null>(null);
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ handler, setHandler, query, setQuery }), [handler, query]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export const useSearchContext = () => useContext(SearchContext);

export function useGlobalSearch(placeholder: string, onSearch: (query: string) => void, onClear?: () => void) {
  const { setHandler, setQuery } = useSearchContext();
  const onSearchRef = useRef(onSearch);
  const onClearRef = useRef(onClear);
  onSearchRef.current = onSearch;
  onClearRef.current = onClear;

  const stableSearch = useCallback((q: string) => onSearchRef.current(q), []);
  const stableClear = useCallback(() => onClearRef.current?.(), []);

  useEffect(() => {
    setHandler({ placeholder, onSearch: stableSearch, onClear: stableClear });
    return () => {
      setHandler(null);
      setQuery("");
    };
  }, [placeholder, stableSearch, stableClear]);
}
