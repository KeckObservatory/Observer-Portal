import { Link, Paper, Typography, Stack, Box, Table, TableBody, TableCell, TableContainer, TableRow, TableHead, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Main } from './theme';
import { getMyRequests } from './api';
import type { myRequestsApiResponse } from './api';
import { useEffect, useState } from 'react';
import type { userInfoApiResponse } from './api';
import urls from './urls.json';
import { getCurrentSemester, getLastSemesters, getNewestSemester } from "./api";




// Add setSelectedPage and setSelectedUrl to your props
interface MyRequestsProps  {
  open: boolean;
  setSelectedPage?: (page: string) => void;
  setSelectedUrl?: (url: string) => void;
  user: userInfoApiResponse;
}

/**
 * MyRequests displays a table of the user's observing requests.
 * Replace sampleRows with real data when backend is ready.
 */
export function MyRequests({ open, user }: MyRequestsProps) {
  const obsid = user?.Id
  //const obsid = 1521; // for testing
  const [requests, setRequests] = useState<myRequestsApiResponse[]>([]);
  const [loading, setLoading] = useState(true);

    // Semester dropdown state
    const currentSemester = getCurrentSemester();
    const [selectedSemester, setSelectedSemester] = useState<string>("");
    const [semesterOptions, setSemesterOptions] = useState<string[]>([]);

    // Add state for newest semester
    const [newestSemester, setNewestSemester] = useState<string>("");

      // Fetch newest semester on mount
    useEffect(() => {
    async function fetchNewest() {
      const sem = await getNewestSemester();
      setNewestSemester(sem);
    }
    fetchNewest();
  }, []);

    // Update semester options when currentSemester or newestSemester changes
  useEffect(() => {
    if (currentSemester) {
      let semesters = [currentSemester, ...getLastSemesters(currentSemester, 15)];
      if (newestSemester && !semesters.includes(newestSemester)) {
        semesters = [newestSemester, ...semesters];
      }
      setSemesterOptions(["all", ...semesters]);
      setSelectedSemester("all");
    }
  }, [currentSemester, newestSemester]);

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      if (user?.Id) {
        const data = await getMyRequests(obsid);
        setRequests(data);
      }
      setLoading(false);
    }
    fetchRequests();
  }, [user?.Id]);

  const filteredRequests = selectedSemester === "all"
    ? requests
    : requests.filter(r => r.semester === selectedSemester);

  return (
    <Main open={open}>
      <Paper elevation={3} sx={{ width: "100%", p: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
            <Typography variant="h6">My Observing Requests</Typography>
          </Box>
          <Box sx={{ p: 2, pt: 0 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="semester-select-label">Semester</InputLabel>
              <Select
                labelId="semester-select-label"
                value={selectedSemester}
                label="Semester"
                onChange={e => setSelectedSemester(e.target.value)}
              >
                {semesterOptions.map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    {sem === "all" ? "All Semesters" : sem}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2 }}>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 120 }}><b>Date</b></TableCell>
                    <TableCell sx={{ width: 90 }}><b># Nights</b></TableCell>
                    <TableCell sx={{ width: 60 }}><b>TelNr</b></TableCell>
                    <TableCell sx={{ width: 100 }}><b>Instrument</b></TableCell>
                    <TableCell sx={{ width: 120 }}><b>Principle</b></TableCell>
                    <TableCell sx={{ width: 250 }}><b>Observers</b></TableCell>
                    <TableCell sx={{ width: 70 }}><b>Project Code</b></TableCell>
                    <TableCell sx={{ width: 70 }}><b>ReqNo</b></TableCell>
                    <TableCell sx={{ width: 100 }}><b>Status</b></TableCell>
                    <TableCell sx={{ width: 100 }}><b>Edit</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9}>Loading...</TableCell>
                    </TableRow>
                  ) : filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>No requests found.</TableCell>
                    </TableRow>
                  ) : (
                    [...filteredRequests].reverse().map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.FromDate}</TableCell>
                        <TableCell>{row.NumNights}</TableCell>
                        <TableCell>{row.Telescope}</TableCell>
                        <TableCell>{row.Instrument}</TableCell>
                        <TableCell>{row.Principal}</TableCell>
                        <TableCell>{row.observer_names}</TableCell>
                        <TableCell>{row.ProjCode}</TableCell>
                        <TableCell>{row.ReqNo}</TableCell>
                        <TableCell>{row.Status}</TableCell>
                          <TableCell>
                            { (
                              <Link
                                href={`${urls.REQUEST_EDIT}ReqNo=${row.ReqNo}`}
                                target="_blank"
                                rel="noopener"
                                underline="hover"
                                sx={{ fontWeight: 600, cursor: "pointer" }}
                              >
                                Edit Link
                              </Link>
                            )}
                          </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </Paper>
    </Main>
  );
}
