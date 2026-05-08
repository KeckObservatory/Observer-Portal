import {  Paper } from "@mui/material";
import  { Typography } from "@mui/material";
import Stack from "@mui/material/Stack";
import { Box } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableRow, TableHead } from '@mui/material';
import  {List} from "@mui/material";
import ListItem from "@mui/material/ListItem";
import {Link} from "@mui/material";
import urls from './urls.json';
import type { userInfoApiResponse } from './api';
import { CircularProgress } from "@mui/material";
import { useCombinedSchedule } from "./api";
import { Main } from './theme';
import { handleUrlClick } from './urlLogic';

interface MyScheduleProps  {
  open: boolean;
  user: userInfoApiResponse;
  setSelectedPage: (page: string) => void;
  setSelectedUrl: (url: string | null) => void;
};

/**
 * MyObsSchedule displays the user's upcoming observing nights in a table,
 * along with helpful instrument and observing links.
 */
export function MyObsSchedule({ open, user, setSelectedPage, setSelectedUrl }: MyScheduleProps) {
  const obsid = user?.Id;
  //const obsid = 1521 //for testing
  //const obsid = 4718
  const { data: schedule, loading, error } = useCombinedSchedule(obsid); 

  const isObserving = !!schedule && schedule.length > 0;

  // Get unique instruments from the schedule
  const instrumentLinks =
    schedule && Array.isArray(schedule)
      ? Array.from(
          new Set(
            schedule
              .map((night) => night.Instrument)
              .filter((inst) => !!inst)
          )
        )
      : [];

  return (
    <Main open={open}>
      <Paper elevation={3} sx={{ width: "100%", p: 2 }}>
        <Stack spacing={2}>
          {/* Top Section */}
          <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
            <Typography variant="h6">Your Upcoming Keck Observing Nights:</Typography>
          </Box>
          <Box sx={{ p: 3, borderBottom: 2, borderColor: "divider" }}>
          {/* Loading spinner */}
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Error message */}
            {error && (
              <Typography color="error" sx={{ p: 2 }}>
                Error loading schedule: {error}
              </Typography>
            )}

            {/* No observing nights */}
            {!loading && !isObserving && (
              <Typography sx={{ p: 2 }}>No upcoming observing nights found.</Typography>
            )}

            {/* Observing nights table */}
            {!loading && isObserving && schedule && (
              <Box sx={{ mt: -2 }}>
                <TableContainer
                  component={Paper}
                  sx={{
                    maxHeight: 331,
                  }}
                >
                <Table
                  size="small"
                  stickyHeader
                  sx={{
                    tableLayout: "fixed",      
                    width: "100%",             
                  }}
                >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 115}}><b>Date</b></TableCell>
                        <TableCell sx={{ width: 75 }}><b>Start Time</b></TableCell>
                        <TableCell sx={{ width: 75 }}><b>End Time</b></TableCell>
                        <TableCell sx={{ width: 55 }}><b>TelNr</b></TableCell>
                        <TableCell sx={{ width: 100 }}><b>Principal</b></TableCell>
                        <TableCell
                          sx={{
                            width: 300,
                            whiteSpace: "normal",       // allows multiple lines
                            wordBreak: "break-word",    // breaks long words
                          }}
                        >
                          <b>Observers</b>
                        </TableCell>
                        <TableCell sx={{ width: 100 }}><b>Instrument</b></TableCell>
                        <TableCell sx={{ width: 75 }}><b>Project Code</b></TableCell>
                        <TableCell sx={{ width: 125 }}><b>Support Astronomer</b></TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {schedule.map((night, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ width: 150 }}>{night.Date}</TableCell>
                          <TableCell sx={{ width: 100 }}>{night.StartTime}</TableCell>
                          <TableCell sx={{ width: 100 }}>{night.EndTime}</TableCell>
                          <TableCell>{night.TelNr}</TableCell>
                          <TableCell>{night.Principal}</TableCell>
                          <TableCell
                            sx={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              py: 1, // spacing between rows
                            }}
                          >
                            {/* If no observers, link to observing request page */}
                            {(!night.Observers || night.Observers.length === 0) ? (
                              <Link
                                component="button"
                                variant="body2"
                                onClick={() =>
                                  handleUrlClick(
                                    { text: "Observing Information", url: urls.OBSERVING_REQUEST },
                                    setSelectedPage,
                                    setSelectedUrl
                                  )
                                }
                              >
                                See Observing Request
                              </Link>
                            ) : (
                              night.Observers
                            )}
                          </TableCell>
                          <TableCell>{night.Instrument}</TableCell>
                          <TableCell>{night.ProjCode}</TableCell>
                          <TableCell sx={{ whiteSpace: "normal", wordWrap: "break-word", py: 1 }}>
                            {/* Show OA/SA staff for the night */}
                            {night.staff && night.staff.length > 0 ? (
                              night.staff
                                .filter(
                                  (s) =>
                                    [ "sa" ,"saoc"].includes(s.Type) &&
                                    String(s.TelNr) === String(night.TelNr)
                                )
                                .map((s, i) => (
                                  <div key={i}>
                                    {s.FirstName} 
                                    {s.Email && (
                                      <>
                                        {" "}
                                        <a
                                        // add email attached to name
                                          href={`mailto:${s.Email}`}
                                          style={{ color: "#1976d2", textDecoration: "underline", fontSize: "0.95em" }}
                                        >
                                          {s.Email}
                                        </a>
                                      </>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <em>–</em>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>

          {/* Helpful Links Section */}
          <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
            <Typography variant="h6">Helpful Links:</Typography>
            <List dense>
              {/* Instrument-specific links */}
              {instrumentLinks.map((inst) => (
                <ListItem key={inst}>
                  <Link
                    component="button"
                    variant="subtitle1"
                    underline="hover"
                    onClick={() =>
                      handleUrlClick(
                        { text: `Instrument: ${inst}`, url: `${urls.INSTRUMENTS_HOME}/${inst.toLowerCase()}`, newtab: true },
                        setSelectedPage,
                        setSelectedUrl
                      )
                    }
                    sx={{ cursor: "pointer" }}
                  >
                    {`Learn more about ${inst}`}
                  </Link>
                </ListItem>
              ))}
              {/* Static links */}
              <ListItem>
                <Link
                  component="button"
                  variant="subtitle1"
                  underline="hover"
                  onClick={() =>
                    handleUrlClick(
                      { text: "Observing Information", url: urls.OBSERVING_REQUEST, newtab: true },
                      setSelectedPage,
                      setSelectedUrl
                    )
                  }
                  sx={{ cursor: "pointer" }}
                >
                  Create an observing request
                </Link>
              </ListItem>
            </List>
            <Typography>
              Explore "Pre-Observing Support" for more information and links
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Main>
  );
}