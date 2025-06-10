// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Link, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Attachment, Message } from "microsoft-graph";
import { prepareMailHtml } from "../utils";

type MessageBodyProps = {
  message: Message;
  inlineAttachments: Attachment[];
  onHtml?: (html: string) => void;
};

// Sandboxed without allow-scripts, the iframe grows with its content
const MessageBody = ({ message, inlineAttachments, onHtml }: MessageBodyProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);
  const [showOriginal, setShowOriginal] = useState(false);
  const dark = theme.palette.mode === "dark";

  const prepared = useMemo(() => prepareMailHtml(message.body?.content || "", {
    contentType: message.body?.contentType,
    dark,
    keepColors: showOriginal,
    inlineAttachments,
  }), [message.id, message.body?.content, dark, showOriginal, inlineAttachments]);

  useEffect(() => {
    onHtml?.(prepared.html);
  }, [prepared.html]);

  useEffect(() => {
    setShowOriginal(false);
  }, [message.id]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    const measure = () => {
      const doc = frame.contentDocument;
      if (!doc?.documentElement) return;
      const h = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0);
      if (h > 0) setHeight(h + 8);
    };
    const onLoad = () => {
      measure();
      const doc = frame.contentDocument;
      if (doc?.body && "ResizeObserver" in window) {
        observer = new ResizeObserver(measure);
        observer.observe(doc.body);
      }
      // Images load later, keep re-measuring for a bit
      [100, 400, 1000, 2500].forEach(ms => setTimeout(measure, ms));
    };
    frame.addEventListener("load", onLoad);
    return () => {
      frame.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [prepared.html]);

  return (
    <Box>
      {dark && !showOriginal && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {t("Colors were adjusted for dark mode.")}{" "}
          <Link component="button" variant="caption" onClick={() => setShowOriginal(true)}>{t("Show original")}</Link>
        </Typography>
      )}
      {prepared.missingInline > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {t("Some embedded images could not be displayed.")}
        </Typography>
      )}
      <iframe
        ref={frameRef}
        title={message.subject || t("Message")}
        srcDoc={prepared.html}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        style={{ width: "100%", height, border: "none", display: "block", colorScheme: dark ? "dark" : "light", background: "transparent" }}
      />
    </Box>
  );
};

export default MessageBody;
