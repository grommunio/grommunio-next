// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Checkbox, CircularProgress, Skeleton, Typography } from "@mui/material";
import { PeopleAltOutlined, SearchOff } from "@mui/icons-material";
import { Fragment, MouseEvent, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Contact } from "microsoft-graph";
import type { ContactList as ContactListState } from "../contactsSlice";
import PersonAvatar from "../../../components/common/PersonAvatar";
import EmptyState from "../../../components/common/EmptyState";
import { useTypeSelector } from "../../../store";

type ContactListProps = {
  list?: ContactListState;
  contacts: Contact[];
  selectedId?: string;
  selection: string[];
  isSearch: boolean;
  onSelect: (contact: Contact, e: MouseEvent) => void;
  onCheck: (contact: Contact) => void;
  onCheckAll: (checked: boolean) => void;
  onContextMenu: (contact: Contact, e: MouseEvent) => void;
  onLoadMore: () => void;
};

const letterOf = (contact: Contact) => {
  const ch = (contact.displayName || contact.emailAddresses?.[0]?.address || "#").trim().charAt(0).toUpperCase();
  return /[A-ZÄÖÜ]/.test(ch) ? ch : /\d/.test(ch) ? "#" : ch || "#";
};

const ContactList = ({ list, contacts, selectedId, selection, isSearch, onSelect, onCheck, onCheckAll, onContextMenu, onLoadMore }: ContactListProps) => {
  const { t } = useTranslation();
  const photos = useTypeSelector(state => state.contacts.photos);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) onLoadMore(); }, { root: scrollRef.current, rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, list?.key]);

  const selectionMode = selection.length > 0;
  const allChecked = contacts.length > 0 && selection.length === contacts.length;
  const loading = list?.loading && contacts.length === 0;
  let lastLetter = "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }} aria-label={t("Contact list")}>
      <Box sx={{ display: "flex", alignItems: "center", px: 1, minHeight: 44, borderBottom: 1, borderColor: "divider", gap: 1 }}>
        <Checkbox size="small" checked={allChecked} indeterminate={selectionMode && !allChecked} onChange={e => onCheckAll(e.target.checked)} sx={{ p: 0.5 }} inputProps={{ "aria-label": t("Select all") }} />
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          {selectionMode ? t("{{count}} selected", { count: selection.length }) : isSearch ? t("Search results") : t("Contacts")}
          {!selectionMode && list?.total !== undefined && !isSearch && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>{list.total}</Typography>}
        </Typography>
      </Box>
      <Box ref={scrollRef} role="listbox" aria-multiselectable sx={{ flex: 1, overflowY: "auto" }}>
        {loading && Array.from({ length: 10 }).map((_, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1.5, alignItems: "center", px: 1.5, py: 1 }}>
            <Skeleton variant="circular" width={36} height={36} /><Box sx={{ flex: 1 }}><Skeleton width="50%" /><Skeleton width="70%" /></Box>
          </Box>
        ))}
        {!loading && list?.loaded && contacts.length === 0 && (
          isSearch ? <EmptyState icon={<SearchOff />} title={t("No results")} /> : <EmptyState icon={<PeopleAltOutlined />} title={t("No contacts")} description={t("Contacts you add will show up here.")} />
        )}
        {!loading && contacts.map(contact => {
          const letter = letterOf(contact);
          const header = !isSearch && letter !== lastLetter ? letter : null;
          lastLetter = letter;
          const email = contact.emailAddresses?.[0]?.address;
          const secondary = email || [contact.jobTitle, contact.companyName].filter(Boolean).join(" · ") || contact.mobilePhone || contact.businessPhones?.[0] || "";
          const selected = contact.id === selectedId;
          const checked = selection.includes(contact.id!);
          return (
            <Fragment key={contact.id}>
              {header && <Typography variant="caption" sx={{ display: "block", px: 1.5, py: 0.25, fontWeight: 700, color: "primary.main", bgcolor: "background.default", position: "sticky", top: 0, zIndex: 1 }}>{header}</Typography>}
              <Box
                role="option"
                aria-selected={selected}
                onClick={e => onSelect(contact, e)}
                onContextMenu={e => onContextMenu(contact, e)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 0.75, cursor: "pointer", borderBottom: 1, borderColor: "divider",
                  bgcolor: selected ? (theme => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "primary.main" + "14") : checked ? "action.selected" : "transparent",
                  "&:hover": { bgcolor: selected ? undefined : "action.hover" },
                  "&:hover .contact-check": { opacity: 1 }, "&:hover .contact-avatar": { opacity: 0 },
                }}
              >
                <Box sx={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
                  <Box className="contact-avatar" sx={{ opacity: selectionMode ? 0 : 1, transition: "opacity .1s" }}>
                    <PersonAvatar name={contact.displayName} email={email} src={photos[contact.id!]} size={36} />
                  </Box>
                  <Checkbox className="contact-check" size="small" checked={checked} onClick={e => e.stopPropagation()} onChange={() => onCheck(contact)} sx={{ position: "absolute", inset: 0, p: 0.75, opacity: selectionMode ? 1 : 0, transition: "opacity .1s" }} inputProps={{ "aria-label": t("Select contact") }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{contact.displayName || email || t("(No name)")}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{secondary}</Typography>
                </Box>
              </Box>
            </Fragment>
          );
        })}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {list?.loadingMore && <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}><CircularProgress size={20} /></Box>}
      </Box>
    </Box>
  );
};

export default ContactList;
