import { Paper } from "@mui/material";
import  { Typography } from "@mui/material";
import Stack from "@mui/material/Stack";
import { Box } from "@mui/material";
import urls from './urls.json';
import { useObsLogApi } from "./api";
import { CircularProgress, Link } from "@mui/material";
import { useState} from "react";
import { useEffect } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { getCurrentSemester, getNewestSemester } from "./api";
import type { userInfoApiResponse } from './api';
import { getLastSemesters } from "./api";
import { Main } from './theme';
import Grid from '@mui/material/Grid';

interface MyLogsProps  {
  open: boolean;
  user: userInfoApiResponse;
};

/**
 * MyObsLogs displays the user's observing logs for a selected semester.
 * Allows switching semesters via dropdown and shows loading/error states.
 */
export function MyObsLogs({ open, user }: MyLogsProps) {
  const obsid = user?.Id
  //const obsid = 1521
  const currentSemester = getCurrentSemester();
  const [newestSemester, setNewestSemester] = useState<string>("");

  useEffect(() => {
    async function fetchNewest() {
      const sem = await getNewestSemester();
      setNewestSemester(sem);
    }
    fetchNewest();
  }, []);

  const baseSemesters = currentSemester ? [currentSemester, ...getLastSemesters(currentSemester, 15)] : [];
  const availableSemesters = [
    "All Logs",
    ...(newestSemester && !baseSemesters.includes(newestSemester) ? [newestSemester] : []),
    ...baseSemesters,
  ];

  const [semester, setSemester] = useState("All Logs");

  // Pass currentSemester to the hook
  const { data, loading } = useObsLogApi(obsid, semester, currentSemester); 
  const logs = data?.logs ?? [];
  const hasLogs = logs.length > 0;

  // Helper to split logs into columns
  function splitIntoColumns<T>(arr: T[], numCols: number): T[][] {
    const cols: T[][] = Array.from({ length: numCols }, () => []);
    arr.forEach((item, idx) => {
      cols[idx % numCols].push(item);
    });
    return cols;
  }

  // Number of columns 
  const numColumns = 3;
  const logColumns = splitIntoColumns(logs, numColumns);

  return (
    <Main open={open}>
      <Paper elevation={3} sx={{ width: "100%", p: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
            <Typography variant="h6">Keck Observing Logs:</Typography>
          </Box>
          
          {/* Semester selection dropdown */}
          <FormControl sx={{ minWidth: 120, m: 2 }}>
            <InputLabel>Semester</InputLabel>
            <Select
              value={semester}
              label="Semester"
              onChange={(e) => setSemester(e.target.value)}
            >
              {availableSemesters.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Loading spinner */}
          {loading ? ( 
            <Stack alignItems="center" sx={{ p: 3 }}>
              <CircularProgress size={32} />
              <Typography sx={{ mt: 1 }}>Loading logs...</Typography>
            </Stack>
          ) : hasLogs ? (
            <Grid container spacing={2} sx={{ p: 2 }}>
              {logColumns.map((col) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack spacing={1}>
                    {col.map((log) => {
                      const viewUrl = `${urls.PROPOSALS_API}/viewObsLog?filename=${log.filename}&obsid=${obsid}`;
                      return (
                        <Link
                          key={viewUrl}
                          href={viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{
                            fontSize: "1rem",
                            color: "primary.main",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {log.title}
                        </Link>
                      );
                    })}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography sx={{ p: 2, color: "text.secondary" }}>
              No observing logs found for this semester.
            </Typography>
          )}
        </Stack>
      </Paper>
    </Main>
  );
}