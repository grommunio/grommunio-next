// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Divider, IconButton, InputBase, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { Add, ContactPageOutlined, CreateNewFolderOutlined, DeleteOutline, DriveFileRenameOutline, Edit, EventOutlined, FileDownloadOutlined, FileUploadOutlined, FolderOutlined, KeyboardArrowDown, MailOutline, MenuOpen, MoreHoriz, PeopleAltOutlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { ChangeEvent, KeyboardEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import type { Contact, ContactFolder } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { useGlobalSearch } from "../../../components/layout/SearchContext";
import useKeyboardShortcuts from "../../../hooks/useKeyboardShortcuts";
import EmptyState from "../../../components/common/EmptyState";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ContactList from "./ContactList";
import ContactCard from "./ContactCard";
import ContactEditor from "./ContactEditor";
import {
  ALL_CONTACTS, clearContactSearches, contactListKey, createContact, createContactFolder, deleteContactFolder, deleteContacts, loadContactFolders,
  loadContacts, loadMoreContacts, makeSelectContactList, renameContactFolder, setContactSelection, toggleContactSelection,
} from "../contactsSlice";
import { loadCategories } from "../../mail/mailSlice";
import { contactsToCsv, contactsToVCard, csvToContacts, downloadText } from "../vcard";
import { pushAlertStack } from "../../../features/alerts/alertsSlice";
import { getContacts, getContactsOfFolders } from "../../../api/contacts";
import { folderWithDescendants, orderFolders, runLimited } from "../contactUtils";

const PeopleView = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useTypeDispatch();
  const navigate = useNavigate();
  const params = useParams<{ folder?: string; contactId?: string }>();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { folders, foldersLoaded, selection, lists, contacts: contactsById } = useTypeSelector(state => state.contacts);
  const folderTree = useMemo(() => orderFolders(folders), [folders]);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<ContactFolder | null>(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ contact?: Contact } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const [newMenu, setNewMenu] = useState<HTMLElement | null>(null);
  const [toolsMenu, setToolsMenu] = useState<HTMLElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{ position: { top: number; left: number }; ids: string[] } | null>(null);
  const [folderMenu, setFolderMenu] = useState<{ anchor: { top: number; left: number }; folder: ContactFolder } | null>(null);
  const [editingFolder, setEditingFolder] = useState<{ id?: string; value: string } | null>(null);
  const [foldersVisible, setFoldersVisible] = useState(true);
  const [importing, setImporting] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

  const folderId = params.folder || ALL_CONTACTS;
  const contactId = params.contactId ? decodeURIComponent(params.contactId) : undefined;
  const key = contactListKey(folderId, search || undefined);
  const list = lists[key];
  const selectList = useMemo(() => makeSelectContactList(key), [key]);
  const contacts = useTypeSelector(selectList);
  const selected = useTypeSelector(state => contactId ? state.contacts.contacts[contactId] : undefined);
  const folder = folders.find(f => f.id === folderId);

  useEffect(() => {
    dispatch(loadContactFolders());
    dispatch(loadCategories());
  }, []);

  useEffect(() => {
    if (!params.folder) navigate("/contacts/all", { replace: true });
  }, [params.folder]);

  useEffect(() => {
    dispatch(loadContacts({ folderId, search: search || undefined }));
  }, [folderId, search]);

  useGlobalSearch(t("Search people"), q => { dispatch(clearContactSearches()); setSearch(q); }, () => setSearch(""));

  const open = (contact: Contact) => navigate(`/contacts/${folderId}/${encodeURIComponent(contact.id!)}`);

  const handleSelect = (contact: Contact, e: MouseEvent | KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) { dispatch(toggleContactSelection(contact.id!)); return; }
    if (selection.length) dispatch(setContactSelection([]));
    open(contact);
  };

  const handleEmail = (address: string) => navigate("/mail/inbox", { state: { compose: { to: address } } });
  const handleMeeting = (contact: Contact) => navigate("/calendar", { state: { newEvent: { attendees: (contact.emailAddresses || []).slice(0, 1).map(e => ({ emailAddress: { address: e.address, name: contact.displayName } })) } } });

  const targetIds = selection.length ? selection : contactId ? [contactId] : [];

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const result = await dispatch(deleteContacts(confirmDelete));
    if (deleteContacts.fulfilled.match(result) && confirmDelete.includes(contactId || "")) navigate(`/contacts/${folderId}`);
  };

  const exportContacts = async (format: "csv" | "vcf", scope: "selection" | "all", ids: string[] = targetIds) => {
    setToolsMenu(null);
    try {
      let items: Contact[];
      if (scope === "selection") items = ids.map(id => contactsById[id]).filter(Boolean);
      else items = folderId === ALL_CONTACTS ? await getContactsOfFolders(folders.map(f => f.id!)) : await getContacts(folderId);
      if (items.length === 0) return;
      const date = new Date().toISOString().slice(0, 10);
      if (format === "csv") downloadText(`contacts-${date}.csv`, contactsToCsv(items), "text/csv;charset=utf-8");
      else downloadText(`contacts-${date}.vcf`, contactsToVCard(items), "text/vcard;charset=utf-8");
    } catch (err: any) {
      dispatch(pushAlertStack({ message: err?.message || String(err), severity: "error" }));
    }
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = csvToContacts(text);
      if (parsed.length === 0) {
        dispatch(pushAlertStack({ message: "No contacts found in the file", severity: "warning" }));
        return;
      }
      const results = await runLimited(parsed, 4, contact => dispatch(createContact({ contact, folderId, silent: true })));
      const ok = results.filter(r => createContact.fulfilled.match(r)).length;
      const failed = parsed.length - ok;
      // t("{{count}} contacts imported") t("{{count}} contacts imported, {{failed}} failed")
      dispatch(pushAlertStack(failed
        ? { message: "{{count}} contacts imported, {{failed}} failed", params: { count: ok, failed }, severity: "warning" }
        : { message: "{{count}} contacts imported", params: { count: ok }, severity: "success" }));
      dispatch(loadContacts({ folderId, force: true }));
    } catch (err: any) {
      dispatch(pushAlertStack({ message: err?.message || String(err), severity: "error" }));
    } finally {
      setImporting(false);
    }
  };

  const commitFolder = () => {
    if (!editingFolder) return;
    const value = editingFolder.value.trim();
    if (value) {
      if (editingFolder.id) dispatch(renameContactFolder({ id: editingFolder.id, displayName: value }));
      else dispatch(createContactFolder(value));
    }
    setEditingFolder(null);
  };

  const onFolderKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitFolder();
    if (e.key === "Escape") setEditingFolder(null);
  };

  const handleLoadMore = useCallback(() => dispatch(loadMoreContacts(key)), [key]);

  useKeyboardShortcuts([
    { key: "n", handler: () => setEditor({}) },
    { key: "Delete", handler: () => targetIds.length && setConfirmDelete(targetIds) },
    { key: "Escape", handler: () => { dispatch(setContactSelection([])); if (search) setSearch(""); } },
  ], !editor);

  const folderItem = (id: string, label: string, icon: JSX.Element, f?: ContactFolder, depth = 0) => {
    const active = folderId === id;
    const isEditing = f && editingFolder?.id === f.id;
    const go = () => { dispatch(setContactSelection([])); navigate(`/contacts/${id}`); };
    return (
      <Box
        key={id}
        role="button"
        tabIndex={isEditing ? -1 : 0}
        aria-current={active ? "page" : undefined}
        onClick={go}
        onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(); } }}
        onContextMenu={f ? e => { e.preventDefault(); setFolderMenu({ anchor: { top: e.clientY, left: e.clientX }, folder: f }); } : undefined}
        sx={{ display: "flex", alignItems: "center", gap: 1, height: 34, mx: 1, px: 1.5, pl: 1.5 + depth * 2, borderRadius: 1.5, cursor: "pointer", color: active ? "primary.main" : "text.primary", bgcolor: active ? (theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "primary.main" + "1a") : "transparent", "&:hover": { bgcolor: active ? undefined : "action.hover" } }}
      >
        <Box sx={{ color: active ? "primary.main" : "text.secondary", display: "flex" }}>{icon}</Box>
        {isEditing ? (
          <InputBase autoFocus value={editingFolder!.value} onChange={e => setEditingFolder({ ...editingFolder!, value: e.target.value })} onKeyDown={onFolderKey} onBlur={commitFolder} onClick={e => e.stopPropagation()} sx={{ flex: 1, fontSize: 14, px: 0.5, border: 1, borderColor: "primary.main", borderRadius: 1 }} />
        ) : <Typography variant="body2" noWrap sx={{ flex: 1 }}>{label}</Typography>}
      </Box>
    );
  };

  const showList = !isMobile || !contactId;
  const showCard = !isMobile || Boolean(contactId);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box role="toolbar" aria-label={t("Contact actions")} sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, minHeight: 48, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        {!isMobile && <Tooltip title={t("Toggle folder pane")}><IconButton size="small" onClick={() => setFoldersVisible(!foldersVisible)} aria-label={t("Toggle folder pane")}><MenuOpen /></IconButton></Tooltip>}
        <Button variant="contained" startIcon={<Add />} endIcon={<KeyboardArrowDown />} onClick={e => setNewMenu(e.currentTarget)} sx={{ mx: 1 }}>{t("New contact")}</Button>
        <Menu anchorEl={newMenu} open={Boolean(newMenu)} onClose={() => setNewMenu(null)}>
          <MenuItem onClick={() => { setNewMenu(null); setEditor({}); }}><ListItemIcon><ContactPageOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Contact")}</ListItemText></MenuItem>
          <MenuItem onClick={() => { setNewMenu(null); setEditingFolder({ value: "" }); }}><ListItemIcon><CreateNewFolderOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Contact folder")}</ListItemText></MenuItem>
        </Menu>
        <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
        <Tooltip title={t("Edit")}><span><IconButton size="small" disabled={!selected || targetIds.length !== 1} onClick={() => selected && setEditor({ contact: selected })} aria-label={t("Edit")}><Edit /></IconButton></span></Tooltip>
        <Tooltip title={t("Delete")}><span><IconButton size="small" disabled={targetIds.length === 0} onClick={() => setConfirmDelete(targetIds)} aria-label={t("Delete")}><DeleteOutline /></IconButton></span></Tooltip>
        <Tooltip title={t("Send email")}><span><IconButton size="small" disabled={!selected?.emailAddresses?.[0]?.address || targetIds.length !== 1} onClick={() => selected && handleEmail(selected.emailAddresses![0].address!)} aria-label={t("Send email")}><MailOutline /></IconButton></span></Tooltip>
        <Tooltip title={t("Schedule meeting")}><span><IconButton size="small" disabled={!selected?.emailAddresses?.[0]?.address || targetIds.length !== 1} onClick={() => selected && handleMeeting(selected)} aria-label={t("Schedule meeting")}><EventOutlined /></IconButton></span></Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button size="small" color="inherit" endIcon={<KeyboardArrowDown />} onClick={e => setToolsMenu(e.currentTarget)} disabled={importing}>{t("Manage")}</Button>
        <Menu anchorEl={toolsMenu} open={Boolean(toolsMenu)} onClose={() => setToolsMenu(null)}>
          <MenuItem onClick={() => { setToolsMenu(null); importInput.current?.click(); }}><ListItemIcon><FileUploadOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Import contacts (CSV)")}</ListItemText></MenuItem>
          <Divider />
          <MenuItem onClick={() => exportContacts("csv", "all")}><ListItemIcon><FileDownloadOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Export all as CSV")}</ListItemText></MenuItem>
          <MenuItem onClick={() => exportContacts("vcf", "all")}><ListItemIcon><FileDownloadOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Export all as vCard")}</ListItemText></MenuItem>
          <MenuItem disabled={targetIds.length === 0} onClick={() => exportContacts("vcf", "selection")}><ListItemIcon><FileDownloadOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Export selection as vCard")}</ListItemText></MenuItem>
        </Menu>
        <input ref={importInput} type="file" accept=".csv,text/csv" hidden onChange={handleImport} />
      </Box>
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {foldersVisible && !isMobile && (
          <Box sx={{ width: 232, flexShrink: 0, borderRight: 1, borderColor: "divider", bgcolor: "background.paper", py: 1, display: "flex", flexDirection: "column" }}>
            {folderItem(ALL_CONTACTS, t("All contacts"), <PeopleAltOutlined fontSize="small" />)}
            {folderTree.map(({ folder: f, depth }) => folderItem(f.id!, f.displayName || "", <FolderOutlined fontSize="small" />, f, depth))}
            {editingFolder && !editingFolder.id && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: 34, mx: 1, px: 1.5 }}>
                <FolderOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                <InputBase autoFocus placeholder={t("New folder")} value={editingFolder.value} onChange={e => setEditingFolder({ value: e.target.value })} onKeyDown={onFolderKey} onBlur={commitFolder} sx={{ flex: 1, fontSize: 14, px: 0.5, border: 1, borderColor: "primary.main", borderRadius: 1 }} />
              </Box>
            )}
            {foldersLoaded && folders.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ px: 2.5, py: 1 }}>{t("No additional folders")}</Typography>}
            <Box sx={{ flex: 1 }} />
            <Divider />
            <Button startIcon={<Add />} onClick={() => setEditingFolder({ value: "" })} sx={{ m: 1, justifyContent: "flex-start", color: "text.secondary" }}>{t("New folder")}</Button>
          </Box>
        )}
        {showList && (
          <Box sx={{ width: isMobile ? "100%" : 340, flexShrink: 0, borderRight: isMobile ? 0 : 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <ContactList
              list={list}
              contacts={contacts}
              selectedId={contactId}
              selection={selection}
              isSearch={Boolean(search)}
              onSelect={handleSelect}
              onCheck={c => dispatch(toggleContactSelection(c.id!))}
              onCheckAll={checked => dispatch(setContactSelection(checked ? contacts.map(c => c.id!) : []))}
              onContextMenu={(c, e) => { e.preventDefault(); setContextMenu({ position: { top: e.clientY, left: e.clientX }, ids: selection.includes(c.id!) ? selection : [c.id!] }); }}
              onLoadMore={handleLoadMore}
              onRetry={() => dispatch(loadContacts({ folderId, search: search || undefined, force: true }))}
            />
          </Box>
        )}
        {showCard && (
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
            {selected ? (
              <ContactCard
                contact={selected}
                onEdit={() => setEditor({ contact: selected })}
                onDelete={() => setConfirmDelete([selected.id!])}
                onEmail={handleEmail}
                onMeeting={() => handleMeeting(selected)}
                onBack={isMobile ? () => navigate(`/contacts/${folderId}`) : undefined}
              />
            ) : (
              <EmptyState icon={<PeopleAltOutlined />} title={t("Select a contact")} description={t("Choose a contact from the list or create a new one.")} action={<Button variant="outlined" startIcon={<Add />} onClick={() => setEditor({})}>{t("New contact")}</Button>} />
            )}
          </Box>
        )}
      </Box>

      <Menu open={Boolean(contextMenu)} onClose={() => setContextMenu(null)} anchorReference="anchorPosition" anchorPosition={contextMenu?.position} MenuListProps={{ dense: true }}>
        {contextMenu?.ids.length === 1 && <MenuItem onClick={() => { const c = contactsById[contextMenu.ids[0]]; setContextMenu(null); if (c) setEditor({ contact: c }); }}><ListItemIcon><Edit fontSize="small" /></ListItemIcon><ListItemText>{t("Edit")}</ListItemText></MenuItem>}
        {contextMenu?.ids.length === 1 && <MenuItem onClick={() => { const c = contactsById[contextMenu.ids[0]]; setContextMenu(null); if (c?.emailAddresses?.[0]?.address) handleEmail(c.emailAddresses[0].address); }}><ListItemIcon><MailOutline fontSize="small" /></ListItemIcon><ListItemText>{t("Send email")}</ListItemText></MenuItem>}
        <MenuItem onClick={() => { const ids = contextMenu?.ids || []; setContextMenu(null); exportContacts("vcf", "selection", ids); }}><ListItemIcon><FileDownloadOutlined fontSize="small" /></ListItemIcon><ListItemText>{t("Export as vCard")}</ListItemText></MenuItem>
        <Divider />
        <MenuItem onClick={() => { setConfirmDelete(contextMenu?.ids || []); setContextMenu(null); }}><ListItemIcon><DeleteOutline fontSize="small" /></ListItemIcon><ListItemText>{t("Delete")}</ListItemText></MenuItem>
      </Menu>
      <Menu open={Boolean(folderMenu)} onClose={() => setFolderMenu(null)} anchorReference="anchorPosition" anchorPosition={folderMenu?.anchor} MenuListProps={{ dense: true }}>
        <MenuItem onClick={() => { setEditingFolder({ id: folderMenu!.folder.id!, value: folderMenu!.folder.displayName || "" }); setFolderMenu(null); }}><ListItemIcon><DriveFileRenameOutline fontSize="small" /></ListItemIcon><ListItemText>{t("Rename")}</ListItemText></MenuItem>
        <MenuItem onClick={() => { setConfirmDeleteFolder(folderMenu!.folder); setFolderMenu(null); }}><ListItemIcon><DeleteOutline fontSize="small" /></ListItemIcon><ListItemText>{t("Delete folder")}</ListItemText></MenuItem>
      </Menu>
      <Box sx={{ display: "none" }}><MoreHoriz /></Box>

      {editor && <ContactEditor contact={editor.contact} folderId={folderId} onClose={() => setEditor(null)} onSaved={c => !editor.contact && c.id && navigate(`/contacts/${folderId}/${encodeURIComponent(c.id)}`)} />}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={confirmDelete && confirmDelete.length > 1 ? t("Delete {{count}} contacts?", { count: confirmDelete.length }) : t("Delete contact?")}
        description={t("This cannot be undone.")}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={Boolean(confirmDeleteFolder)}
        title={t("Delete folder \"{{name}}\"?", { name: confirmDeleteFolder?.displayName || "" })}
        description={t("The folder, its subfolders and all contacts in them will be deleted. This cannot be undone.")}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={() => {
          const f = confirmDeleteFolder;
          if (!f?.id) return;
          dispatch(deleteContactFolder(f.id));
          if (folderWithDescendants(folders, f.id).has(folderId)) navigate("/contacts/all");
        }}
        onClose={() => setConfirmDeleteFolder(null)}
      />
      {folder && <Box sx={{ display: "none" }}>{folder.displayName}</Box>}
    </Box>
  );
};

export default PeopleView;
