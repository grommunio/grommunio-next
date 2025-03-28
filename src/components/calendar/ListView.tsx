import { Event } from "microsoft-graph";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { DateTimeTimeZone, Location } from 'microsoft-graph';
import { useTranslation } from "react-i18next";
import { getReadableDuration, toReadableTimeInTimezone } from "../../utils";
import { EventOutlined, EventRepeatOutlined } from "@mui/icons-material";

type ListViewType = {
  events: Array<Event>;
}

const ListView = ({ events }: ListViewType) => {
  const { t } = useTranslation();

  const getIconFromEventType = (type: string) => {
    switch(type) {
    // TODO: Add more types
    case "occurrence": return <EventRepeatOutlined />;
    default: return <EventOutlined />;
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'icon',
      headerName: "",
      width: 32,
      renderCell: (params) => getIconFromEventType(params.row.type),
    },
    {
      field: 'subject',
      headerName: t("Subject") || "",
      width: 200,
      editable: true,
    },
    {
      field: 'start',
      headerName: t("Start") || "",
      width: 200,
      valueFormatter: (value: DateTimeTimeZone) =>
        `${toReadableTimeInTimezone(value, "lll") || ''}`,
    },
    {
      field: 'end',
      headerName: t("End") || "",
      width: 200,
      valueFormatter: (value: DateTimeTimeZone) =>
        `${toReadableTimeInTimezone(value, "lll") || ''}`,
    },
    {
      field: 'duration',
      headerName: t("Duration") || "",
      width: 120,
      valueGetter: (_value: unknown, row: Event) =>
        `${getReadableDuration(row.start?.dateTime || "", row.end?.dateTime || "")}`,
    },
    {
      field: 'location',
      headerName: t("Location") || "",
      width: 120,
      valueFormatter: (value: Location | null) =>
        `${value?.displayName || ''}`,
    },
  ];

  return <div>
    <DataGrid
      density="compact"
      rows={events}
      columns={columns}
      checkboxSelection
      disableRowSelectionOnClick
    />
  </div>;
}

export default ListView;