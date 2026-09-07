// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Link, Typography } from "@mui/material";
import { ImageNotSupportedOutlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Attachment, Message } from "microsoft-graph";
import { prepareMailHtml } from "../utils";
import { useTypeSelector } from "../../../store";

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
  // Overrides are tied to a message id, so the next one starts out blocked
  const [originalFor, setOriginalFor] = useState<string>();
  const [imagesFor, setImagesFor] = useState<string>();
  const showOriginal = originalFor === message.id;
  const showImages = imagesFor === message.id;
  const blockImages = useTypeSelector(state => state.mail.prefs.blockRemoteImages) && !showImages;
  const dark = theme.palette.mode === "dark";

  const prepared = useMemo(() => prepareMailHtml(message.body?.content || "", {
    contentType: message.body?.contentType,
    dark,
    keepColors: showOriginal,
    inlineAttachments,
    blockRemote: blockImages,
  }), [message.id, message.body?.content, dark, showOriginal, inlineAttachments, blockImages]);

  // Printing always uses the light version, dark text would vanish on paper
  const printable = useMemo(() => dark ? prepareMailHtml(message.body?.content || "", {
    contentType: message.body?.contentType,
    inlineAttachments,
    blockRemote: blockImages,
  }).html : prepared.html, [dark, prepared.html, blockImages]);

  useEffect(() => {
    onHtml?.(printable);
  }, [printable]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // The root element is at least as high as the frame, so measure the body
    const measure = () => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      const style = frame.contentWindow?.getComputedStyle(doc.body);
      const margins = style ? (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0) : 0;
      const h = Math.ceil(Math.max(doc.body.scrollHeight, doc.body.getBoundingClientRect().height) + margins);
      if (h > 0) setHeight(h + 8);
    };
    const onLoad = () => {
      const doc = frame.contentDocument;
      if (!doc?.documentElement) return;
      // A new document: collapse the frame first so the height can also shrink
      const previous = frame.style.height;
      frame.style.height = "0px";
      const h = doc.documentElement.scrollHeight;
      frame.style.height = previous;
      if (h > 0) setHeight(h + 8);
      if (doc.body && "ResizeObserver" in window) {
        observer = new ResizeObserver(measure);
        observer.observe(doc.body);
      }
      // Images load later, keep re-measuring for a bit
      [100, 400, 1000, 2500].forEach(ms => timers.push(setTimeout(measure, ms)));
    };
    frame.addEventListener("load", onLoad);
    return () => {
      frame.removeEventListener("load", onLoad);
      observer?.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [prepared.html]);

  return (
    <Box>
      {dark && !showOriginal && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {t("Colors were adjusted for dark mode.")}{" "}
          <Link component="button" variant="caption" onClick={() => setOriginalFor(message.id!)}>{t("Show original")}</Link>
        </Typography>
      )}
      {prepared.blockedRemote > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: "action.hover" }}>
          <ImageNotSupportedOutlined fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {t("Images from the internet were blocked to protect your privacy.")}
          </Typography>
          <Button size="small" onClick={() => setImagesFor(message.id!)}>{t("Show images")}</Button>
        </Box>
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
