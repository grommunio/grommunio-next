// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 grommunio GmbH

import { Box, Button, Chip, Divider, IconButton, Link, Tooltip, Typography } from "@mui/material";
import { ArrowBack, CakeOutlined, DeleteOutline, Edit, EventOutlined, HomeOutlined, LanguageOutlined, MailOutline, NotesOutlined, PhoneOutlined, PlaceOutlined, SmartphoneOutlined, WorkOutline } from "@mui/icons-material";
import { ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Contact, PhysicalAddress } from "microsoft-graph";
import { useTypeDispatch, useTypeSelector } from "../../../store";
import { loadContactPhoto } from "../contactsSlice";
import PersonAvatar from "../../../components/common/PersonAvatar";
import { presetColor } from "../../mail/categories";

type ContactCardProps = {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  onEmail: (address: string) => void;
  onMeeting: () => void;
  onBack?: () => void;
};

const formatAddress = (a?: PhysicalAddress | null) =>
  a ? [a.street, [a.postalCode, a.city].filter(Boolean).join(" "), a.state, a.countryOrRegion].filter(Boolean).join(", ") : "";

const Row = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
  <Box sx={{ display: "flex", gap: 1.5, py: 0.75 }}>
    <Box sx={{ color: "text.secondary", mt: 0.25 }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>
      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>{children}</Typography>
    </Box>
  </Box>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{title}</Typography>
    <Divider sx={{ mb: 0.5 }} />
    {children}
  </Box>
);

const ContactCard = ({ contact, onEdit, onDelete, onEmail, onMeeting, onBack }: ContactCardProps) => {
  const { t } = useTranslation();
  const dispatch = useTypeDispatch();
  const photo = useTypeSelector(state => state.contacts.photos[contact.id!]);
  const categories = useTypeSelector(state => state.mail.categories);

  useEffect(() => { if (contact.id) dispatch(loadContactPhoto(contact.id)); }, [contact.id]);

  const emails = (contact.emailAddresses || []).filter(e => e.address);
  const phones = [
    ...(contact.mobilePhone ? [{ label: t("Mobile"), value: contact.mobilePhone, icon: <SmartphoneOutlined fontSize="small" /> }] : []),
    ...(contact.businessPhones || []).map(p => ({ label: t("Business"), value: p, icon: <PhoneOutlined fontSize="small" /> })),
    ...(contact.homePhones || []).map(p => ({ label: t("Home"), value: p, icon: <PhoneOutlined fontSize="small" /> })),
  ];
  const addresses = [
    { label: t("Business address"), value: formatAddress(contact.businessAddress), icon: <WorkOutline fontSize="small" /> },
    { label: t("Home address"), value: formatAddress(contact.homeAddress), icon: <HomeOutlined fontSize="small" /> },
    { label: t("Other address"), value: formatAddress(contact.otherAddress), icon: <PlaceOutlined fontSize="small" /> },
  ].filter(a => a.value);
  const work = [contact.jobTitle, contact.companyName].filter(Boolean).join(" · ");
  const birthday = contact.birthday ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(contact.birthday)) : "";

  return (
    <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }} aria-label={t("Contact details")}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
        {onBack && <IconButton onClick={onBack} aria-label={t("Back")} sx={{ ml: -1 }}><ArrowBack /></IconButton>}
        <PersonAvatar name={contact.displayName} email={emails[0]?.address} src={photo} size={88} sx={{ fontSize: 32 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, wordBreak: "break-word" }}>{contact.displayName || t("(No name)")}</Typography>
          {work && <Typography variant="body2" color="text.secondary">{work}</Typography>}
          {contact.department && <Typography variant="body2" color="text.secondary">{contact.department}</Typography>}
          <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
            <Button size="small" variant="contained" startIcon={<MailOutline />} onClick={() => emails[0] && onEmail(emails[0].address!)} disabled={emails.length === 0}>{t("Send email")}</Button>
            <Button size="small" variant="outlined" startIcon={<EventOutlined />} onClick={onMeeting} disabled={emails.length === 0}>{t("Schedule meeting")}</Button>
            <Tooltip title={t("Edit")}><IconButton size="small" onClick={onEdit} aria-label={t("Edit")}><Edit fontSize="small" /></IconButton></Tooltip>
            <Tooltip title={t("Delete")}><IconButton size="small" onClick={onDelete} aria-label={t("Delete")}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
          </Box>
        </Box>
      </Box>
      {Boolean(contact.categories?.length) && (
        <Box sx={{ display: "flex", gap: 0.5, mb: 2, flexWrap: "wrap" }}>
          {contact.categories!.map(c => <Chip key={c} size="small" label={c} icon={<Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: presetColor(categories.find(x => x.displayName === c)?.color), ml: 1 }} />} />)}
        </Box>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, columnGap: 4 }}>
        <Box>
          {(emails.length > 0 || phones.length > 0) && (
            <Section title={t("Contact")}>
              {emails.map((e, i) => (
                <Row key={i} icon={<MailOutline fontSize="small" />} label={e.name && e.name !== contact.displayName && e.name !== e.address ? e.name : t("Email")}>
                  <Link component="button" variant="body2" onClick={() => onEmail(e.address!)} sx={{ textAlign: "left" }}>{e.address}</Link>
                </Row>
              ))}
              {phones.map((p, i) => (
                <Row key={i} icon={p.icon} label={p.label}><Link href={`tel:${p.value.replace(/\s/g, "")}`} variant="body2">{p.value}</Link></Row>
              ))}
              {contact.imAddresses?.map((im, i) => <Row key={i} icon={<LanguageOutlined fontSize="small" />} label={t("IM")}>{im}</Row>)}
            </Section>
          )}
          {addresses.length > 0 && (
            <Section title={t("Addresses")}>
              {addresses.map((a, i) => <Row key={i} icon={a.icon} label={a.label}>{a.value}</Row>)}
            </Section>
          )}
        </Box>
        <Box>
          {(contact.companyName || contact.jobTitle || contact.department || contact.officeLocation || contact.manager || contact.assistantName || contact.businessHomePage || contact.profession) && (
            <Section title={t("Work")}>
              {contact.companyName && <Row icon={<WorkOutline fontSize="small" />} label={t("Company")}>{contact.companyName}</Row>}
              {contact.jobTitle && <Row icon={<WorkOutline fontSize="small" />} label={t("Job title")}>{contact.jobTitle}</Row>}
              {contact.department && <Row icon={<WorkOutline fontSize="small" />} label={t("Department")}>{contact.department}</Row>}
              {contact.officeLocation && <Row icon={<PlaceOutlined fontSize="small" />} label={t("Office")}>{contact.officeLocation}</Row>}
              {contact.manager && <Row icon={<WorkOutline fontSize="small" />} label={t("Manager")}>{contact.manager}</Row>}
              {contact.assistantName && <Row icon={<WorkOutline fontSize="small" />} label={t("Assistant")}>{contact.assistantName}</Row>}
              {contact.profession && <Row icon={<WorkOutline fontSize="small" />} label={t("Profession")}>{contact.profession}</Row>}
              {contact.businessHomePage && <Row icon={<LanguageOutlined fontSize="small" />} label={t("Website")}><Link href={contact.businessHomePage.startsWith("http") ? contact.businessHomePage : `https://${contact.businessHomePage}`} target="_blank" rel="noopener" variant="body2">{contact.businessHomePage}</Link></Row>}
            </Section>
          )}
          {(birthday || contact.nickName || contact.spouseName || contact.children?.length) && (
            <Section title={t("Personal")}>
              {birthday && <Row icon={<CakeOutlined fontSize="small" />} label={t("Birthday")}>{birthday}</Row>}
              {contact.nickName && <Row icon={<NotesOutlined fontSize="small" />} label={t("Nickname")}>{contact.nickName}</Row>}
              {contact.spouseName && <Row icon={<NotesOutlined fontSize="small" />} label={t("Spouse/Partner")}>{contact.spouseName}</Row>}
              {Boolean(contact.children?.length) && <Row icon={<NotesOutlined fontSize="small" />} label={t("Children")}>{contact.children!.join(", ")}</Row>}
            </Section>
          )}
          {contact.personalNotes && (
            <Section title={t("Notes")}>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", py: 0.75 }}>{contact.personalNotes}</Typography>
            </Section>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ContactCard;
