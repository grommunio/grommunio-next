// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Chip, CircularProgress, Collapse, IconButton, Link, Tooltip, Typography } from "@mui/material";
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
import { formatFullDate, formatRecipient, isMeetingMessage, recipientName, senderAddress, senderName } from "../utils";
import { categoryColor } from "../categories";

type MessageViewProps = {
  message: Message;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onMore: (anchor: HTMLElement) => void;
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

const MessageView = ({ message, onReply, onReplyAll, onForward, onMore, onBack, onBodyHtml }: MessageViewProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const loaded = useTypeSelector(state => state.mail.loadedDetails[message.id!]);
  const loading = useTypeSelector(state => state.mail.loadingDetails[message.id!]);
  const categories = useTypeSelector(state => state.mail.categories);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaded) dispatch(loadMessageDetails(message.id!));
    setShowDetails(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [message.id, loaded]);

  // Attachments: inline ones are needed with content to resolve cid: images
  useEffect(() => {
    let cancelled = false;
    setAttachments([]);
    if (!message.hasAttachments && !/cid:/i.test(message.body?.content || "")) return;
    if (!loaded) return;
    const needsInline = /cid:/i.test(message.body?.content || "");
    getAttachments(message.id!, needsInline)
      .then(list => { if (!cancelled) setAttachments(list); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [message.id, loaded]);

  const inlineAttachments = useMemo(() => attachments.filter(a => a.isInline || (a as FileAttachment).contentId), [attachments]);

  const fetchContent = async (attachment: Attachment) => {
    const file = attachment as FileAttachment;
    if (file.contentBytes) return file;
    return getAttachment(message.id!, attachment.id!);
  };

  const name = senderName(message);
  const address = senderAddress(message);
  const date = formatFullDate(message.receivedDateTime || message.sentDateTime);
  const flagged = message.flag?.flagStatus === "flagged";

  return (
    <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }} aria-label={t("Reading pane")}>
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
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
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mt: 2, pb: 2, borderBottom: 1, borderColor: "divider" }}>
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
              <IconButton size="small" onClick={() => setShowDetails(!showDetails)} aria-label={t("Show details")} aria-expanded={showDetails}>
                {showDetails ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            </Box>
            <Collapse in={showDetails}>
              <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
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
              <Tooltip title={t("Reply")}><IconButton size="small" onClick={onReply} aria-label={t("Reply")}><Reply fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t("Reply all")}><IconButton size="small" onClick={onReplyAll} aria-label={t("Reply all")}><ReplyAll fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t("Forward")}><IconButton size="small" onClick={onForward} aria-label={t("Forward")}><Forward fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t("More actions")}><IconButton size="small" onClick={(e: MouseEvent<HTMLElement>) => onMore(e.currentTarget)} aria-label={t("More actions")}><MoreHoriz fontSize="small" /></IconButton></Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 2, flex: 1 }}>
        {isMeetingMessage(message) && <MeetingCard message={message as EventMessage} />}
        {attachments.length > 0 && <Box sx={{ mb: 2 }}><AttachmentList attachments={attachments} fetchContent={fetchContent} /></Box>}
        {!loaded && loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={28} /></Box>
        ) : (
          <MessageBody message={message} inlineAttachments={inlineAttachments} onHtml={onBodyHtml} />
        )}
      </Box>
    </Box>
  );
};

export default MessageView;
