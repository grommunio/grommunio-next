// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Alert, Box, Button, Chip, CircularProgress, Collapse, IconButton, Link, Tooltip, Typography } from "@mui/material";
import { ArrowBack, ExpandLess, ExpandMore, Flag, Forward, MoreHoriz, PriorityHigh, Reply, ReplyAll } from "@mui/icons-material";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Attachment, EventMessage, FileAttachment, Message, Recipient } from "microsoft-graph";
import PersonAvatar from "../../../components/common/PersonAvatar";
import MessageBody from "./MessageBody";
import AttachmentList from "./AttachmentList";
import MeetingCard from "./MeetingCard";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { loadMessageDetails } from "../mailSlice";
import { getAttachment, getAttachments } from "../../../api/messages";
import { getAttachmentRaw } from "../attachments";
import { formatFullDate, formatRecipient, inlineCandidates, isMeetingMessage, recipientName, senderAddress, senderName } from "../utils";
import { categoryColor } from "../categories";

type MessageActionsProps = {
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onMore: (anchor: HTMLElement) => void;
};

type MessageViewProps = MessageActionsProps & {
  message: Message;
  onBack?: () => void;
  onBodyHtml: (html: string) => void;
};

const RecipientLine = ({ label, recipients }: { label: string; recipients?: Recipient[] | null }) => {
  if (!recipients?.length) return null;
  return (
    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
      <Box component="span" sx={{ display: "inline-block", minWidth: 36 }}>{label}</Box>
      {recipients.map((r, i) => (
        <Tooltip key={i} title={r.emailAddress?.address || ""}>
          <Box component="span" sx={{ color: "text.primary" }}>{recipientName(r)}{i < recipients.length - 1 ? ", " : ""}</Box>
        </Tooltip>
      ))}
    </Typography>
  );
};

export const MessageSubject = ({ message, onBack }: { message: Message; onBack?: () => void }) => {
  const { t } = useTranslation();
  const categories = useTypeSelector(state => state.mail.categories);
  const flagged = message.flag?.flagStatus === "flagged";
  return <>
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
      {onBack && <IconButton onClick={onBack} aria-label={t("Back")} sx={{ ml: -1 }}><ArrowBack /></IconButton>}
      <Typography variant="h5" sx={{ flex: 1, fontWeight: 600, wordBreak: "break-word", fontSize: { xs: "1.15rem", md: "1.4rem" } }}>
        {message.importance === "high" && <Tooltip title={t("High importance")}><PriorityHigh color="error" sx={{ verticalAlign: "middle", mr: 0.5 }} /></Tooltip>}
        {message.subject || t("(No subject)")}
      </Typography>
      {flagged && <Flag color="error" sx={{ mt: 0.5 }} />}
    </Box>
    {Boolean(message.categories?.length) && (
      <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
        {message.categories!.map(cat => (
          <Chip key={cat} size="small" label={cat} icon={<Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: categoryColor(cat, categories), ml: 1 }} />} />
        ))}
      </Box>
    )}
  </>;
};

export const MessageHeader = ({ message, onReply, onReplyAll, onForward, onMore, onHeaderClick }: MessageActionsProps & {
  message: Message;
  onHeaderClick?: () => void;
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => setShowDetails(false), [message.id]);

  const name = senderName(message);
  const address = senderAddress(message);
  const date = formatFullDate(message.receivedDateTime || message.sentDateTime);
  const stop = (fn: () => void) => (e: MouseEvent) => { e.stopPropagation(); fn(); };

  return (
    <Box onClick={onHeaderClick} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, cursor: onHeaderClick ? "pointer" : undefined }}>
      <PersonAvatar name={name} email={address} size={40} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="subtitle2" noWrap>{name}</Typography>
          {address && address !== name && <Typography variant="body2" color="text.secondary" noWrap>&lt;{address}&gt;</Typography>}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>
            {t("To")}: {(message.toRecipients || []).map(recipientName).join(", ") || t("(No recipients)")}
            {Boolean(message.ccRecipients?.length) && ` · ${t("Cc")}: ${message.ccRecipients!.map(recipientName).join(", ")}`}
          </Typography>
          <IconButton size="small" onClick={stop(() => setShowDetails(!showDetails))} aria-label={t("Show details")} aria-expanded={showDetails}>
            {showDetails ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        </Box>
        <Collapse in={showDetails}>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5, cursor: "auto" }} onClick={e => e.stopPropagation()}>
            <Typography variant="body2" color="text.secondary"><Box component="span" sx={{ display: "inline-block", minWidth: 36 }}>{t("From")}</Box><Box component="span" sx={{ color: "text.primary" }}>{formatRecipient(message.from || message.sender || {})}</Box></Typography>
            <RecipientLine label={t("To")} recipients={message.toRecipients} />
            <RecipientLine label={t("Cc")} recipients={message.ccRecipients} />
            <RecipientLine label={t("Bcc")} recipients={message.bccRecipients} />
            {Boolean(message.replyTo?.length) && <RecipientLine label={t("Reply to")} recipients={message.replyTo} />}
            <Typography variant="body2" color="text.secondary"><Box component="span" sx={{ display: "inline-block", minWidth: 36 }}>{t("Date")}</Box><Box component="span" sx={{ color: "text.primary" }}>{date}</Box></Typography>
            {message.webLink && <Link href={message.webLink} target="_blank" rel="noopener" variant="body2">{t("Open in Outlook on the web")}</Link>}
          </Box>
        </Collapse>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{date}</Typography>
        <Box sx={{ display: "flex" }}>
          <Tooltip title={t("Reply")}><IconButton size="small" onClick={stop(onReply)} aria-label={t("Reply")}><Reply fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t("Reply all")}><IconButton size="small" onClick={stop(onReplyAll)} aria-label={t("Reply all")}><ReplyAll fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t("Forward")}><IconButton size="small" onClick={stop(onForward)} aria-label={t("Forward")}><Forward fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={t("More actions")}><IconButton size="small" onClick={(e: MouseEvent<HTMLElement>) => { e.stopPropagation(); onMore(e.currentTarget); }} aria-label={t("More actions")}><MoreHoriz fontSize="small" /></IconButton></Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export const MessageContent = ({ message, onBodyHtml }: { message: Message; onBodyHtml?: (html: string) => void }) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const loaded = useTypeSelector(state => state.mail.loadedDetails[message.id!]);
  const loading = useTypeSelector(state => state.mail.loadingDetails[message.id!]);
  const error = useTypeSelector(state => state.mail.detailsError[message.id!]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsFailed, setAttachmentsFailed] = useState(false);
  const [attachmentsTry, setAttachmentsTry] = useState(0);

  useEffect(() => {
    if (!loaded && !error) dispatch(loadMessageDetails(message.id!));
  }, [message.id, loaded]);

  // Metadata first, content only for inline cid: attachments
  useEffect(() => {
    let cancelled = false;
    setAttachments([]);
    setAttachmentsFailed(false);
    const needsInline = /cid:/i.test(message.body?.content || "");
    if (!message.hasAttachments && !needsInline) return;
    if (!loaded) return;
    (async () => {
      const list = await getAttachments(message.id!);
      if (cancelled) return;
      setAttachments(list);
      if (!needsInline) return;
      const inline = inlineCandidates(list);
      const withContent = await Promise.all(inline.map(a => getAttachment(message.id!, a.id!).catch(() => a)));
      if (cancelled) return;
      const byId = new Map(withContent.map(a => [a.id, a]));
      setAttachments(list.map(a => byId.get(a.id) || a));
    })().catch(() => { if (!cancelled) setAttachmentsFailed(true); });
    return () => { cancelled = true; };
  }, [message.id, loaded, attachmentsTry]);

  const inlineAttachments = useMemo(() => attachments.filter(a => a.isInline || (a as FileAttachment).contentId), [attachments]);

  const fetchContent = async (attachment: Attachment) => {
    const file = attachment as FileAttachment;
    if (file.contentBytes) return file;
    return getAttachment(message.id!, attachment.id!);
  };

  const fetchRaw = (attachment: Attachment) => getAttachmentRaw(message.id!, attachment.id!);

  return <>
    {isMeetingMessage(message) && <MeetingCard key={message.id} message={message as EventMessage} />}
    {attachmentsFailed && (
      <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setAttachmentsTry(n => n + 1)}>{t("Try again")}</Button>}>
        {t("The attachments could not be loaded.")}
      </Alert>
    )}
    {attachments.length > 0 && <Box sx={{ mb: 2 }}><AttachmentList attachments={attachments} fetchContent={fetchContent} fetchRaw={fetchRaw} /></Box>}
    {!loaded && loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={28} /></Box>
    ) : !loaded && error ? (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => dispatch(loadMessageDetails(message.id!))}>{t("Try again")}</Button>}>
        {t("The message could not be loaded.")} {error}
      </Alert>
    ) : (
      <MessageBody message={message} inlineAttachments={inlineAttachments} onHtml={onBodyHtml} />
    )}
  </>;
};

const MessageView = ({ message, onReply, onReplyAll, onForward, onMore, onBack, onBodyHtml }: MessageViewProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [message.id]);

  return (
    <Box ref={scrollRef} component="section" role="region" sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }} aria-label={t("Reading pane")}>
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
        <MessageSubject message={message} onBack={onBack} />
        <Box sx={{ mt: 2, pb: 2, borderBottom: 1, borderColor: "divider" }}>
          <MessageHeader message={message} onReply={onReply} onReplyAll={onReplyAll} onForward={onForward} onMore={onMore} />
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 2, flex: 1 }}>
        <MessageContent message={message} onBodyHtml={onBodyHtml} />
      </Box>
    </Box>
  );
};

export default MessageView;
