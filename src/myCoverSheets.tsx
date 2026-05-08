import { Paper, Typography, Stack, Box, Table, TableBody, TableCell, TableContainer, TableRow, TableHead, List, ListItem, Link, FormControl, Select, MenuItem, InputLabel, CircularProgress } from "@mui/material";
import urls from './urls.json';
import type { userInfoApiResponse } from './api';
import { useEffect, useState } from "react";
import { getCurrentSemester, getLastSemesters, getNewestSemester, useCoverSheetsApi } from "./api";
import { Main } from './theme';
import { getEmployeeLinks } from "./api"; // Make sure this is imported
import { handleUrlClick } from './urlLogic';

interface MyCoverSheetsProps  {
  open: boolean;
  user: userInfoApiResponse;
  setSelectedPage?: (page: string) => void;
  setSelectedUrl?: (url: string | null) => void; 
}

/**
 * MyCoverSheets displays links to the user's coversheets ,
 * allows filtering by semester, and provides helpful links.
 */
export function MyCoverSheets({ open, user, setSelectedPage, setSelectedUrl }: MyCoverSheetsProps) {
  const obsid = user?.Id;
  const currentSemester = getCurrentSemester();
  const availableSemesters = ["All Coversheets", currentSemester, ...getLastSemesters(currentSemester, 15)];

  // Semester selection state
  const [selectedSemester, setSelectedSemester] = useState(currentSemester);
  
  // Add state for newest semester
  const [newestSemester, setNewestSemester] = useState<string>("");

  // Check if user is a Keck employee
  const [isKeckEmployee, setIsKeckEmployee] = useState(false);

  // Set initial semester when currentSemester loads
  useEffect(() => {
    if (currentSemester) {
      setSelectedSemester(currentSemester);
    }
  }, [currentSemester]);

  // Fetch newest semester on mount
  useEffect(() => {
    async function fetchNewest() {
      const sem = await getNewestSemester();
      setNewestSemester(sem);
    }
    fetchNewest();
  }, []);

  // Check employee status
  useEffect(() => {
    async function checkEmployee() {
      if (user?.Id) {
        const result = await getEmployeeLinks(user.Id);
        setIsKeckEmployee(Array.isArray(result?.links) && result.links.length > 0);
      }
    }
    checkEmployee();
  }, [user?.Id]);

  // Use the new API hook (similar to logs)
  const { data, loading } = useCoverSheetsApi(obsid, selectedSemester, currentSemester);
  const programs = data?.programs ?? [];

  return (
    <Main open={open}>
      <Paper elevation={3} sx={{ width: "100%", p: 2 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 2, borderColor: "divider" }}>
            <Typography variant="h6">My Cover Sheets</Typography>
          </Box>

          {/* Semester Dropdown - matches logs style */}
          <FormControl sx={{ minWidth: 120, m: 2 }}>
            <InputLabel>Semester</InputLabel>
            <Select
              value={selectedSemester}
              label="Semester"
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              {availableSemesters.map((sem) => (
                <MenuItem key={sem} value={sem}>
                  {sem}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Loading spinner - matches logs style */}
          {loading ? (
            <Stack alignItems="center" sx={{ p: 3 }}>
              <CircularProgress size={32} />
              <Typography sx={{ mt: 1 }}>Loading coversheets...</Typography>
            </Stack>
          ) : programs.length === 0 ? (
            <Typography sx={{ p: 2, color: "text.secondary" }}>
              No coversheets found for this semester.
            </Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TableContainer component={Paper} sx={{ maxHeight: 331 }}>
                <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 160 }}><b>KTN / SemID</b></TableCell>
                      <TableCell sx={{ width: 300 }}><b>Program Title</b></TableCell>
                      <TableCell sx={{ width: 140 }}><b>Type</b></TableCell>
                      <TableCell sx={{ width: 120 }}><b>View</b></TableCell>
                      <TableCell sx={{ width: 120 }}><b>Edit</b></TableCell>
                      <TableCell sx={{ width: 120 }}><b>Copy</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {programs.map((program, idx) => {
                      // Extract semester from semid for edit logic
                      const programSemester = program.semid?.split('_')[0] || '';
                      
                      // Edit logic
                      const isNewest = programSemester === newestSemester;
                      const isCurrentOrNewest = [currentSemester, newestSemester].includes(programSemester);
                      const hasE = program.semid?.startsWith(`${programSemester}_E`);

                      const showEdit = isNewest || (isCurrentOrNewest && hasE);

                      return (
                        <TableRow key={idx}>
                          <TableCell>{program.semid}</TableCell>
                          <TableCell>{program.title || "—"}</TableCell>
                          <TableCell>{program.type || "—"}</TableCell>
                          <TableCell>
                            <Link
                              href={`${urls.SERVE_COVER_SHEET}ktn=${program.semid}&access=PDF`}
                              target="_blank"
                              rel="noopener"
                              underline="hover"
                              sx={{ fontWeight: 600, cursor: "pointer" }}
                            >
                              View PDF
                            </Link>
                          </TableCell>
                          <TableCell>
                            {showEdit && (
                              <Link
                                href={`${urls.EDIT_COVER_SHEET}ktn=${program.semid}&access=edit`}
                                target="_blank"
                                rel="noopener"
                                underline="hover"
                                sx={{ fontWeight: 600, cursor: "pointer" }}
                              >
                                Edit
                              </Link>
                            )}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`${urls.COPY_COVER_SHEET}ktn=${program.semid}&access=copy`}
                              target="_blank"
                              rel="noopener"
                              underline="hover"
                              sx={{ fontWeight: 600, cursor: "pointer" }}
                            >
                              Copy to {newestSemester}
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Helpful Links Section - unchanged */}
          <Box sx={{ p: 2, borderTop: 2, borderColor: "divider" }}>
            <Typography variant="h6">Helpful Links:</Typography>
            <List dense>
              <ListItem>
                <Link
                  component="button"
                  variant="h6"
                  underline="hover"
                  sx={{ cursor: "pointer", fontSize: "1.15rem", fontWeight: 600 }}
                  onClick={() =>
                    handleUrlClick(
                      { text: "Coversheet Submission", url: urls.COVER_SHEET_SUBMISSION, newtab: true },
                      setSelectedPage,
                      setSelectedUrl
                    )
                  }
                >
                  Coversheet Submission
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  component="button"
                  variant="h6"
                  underline="hover"
                  sx={{ cursor: "pointer", fontSize: "1.15rem", fontWeight: 600 }}
                  onClick={() =>
                    handleUrlClick(
                      { text: "Instrument Avalibility and Announcements", url: urls.SEMESTER_INFO, newtab: true },
                      setSelectedPage,
                      setSelectedUrl
                    )
                  }
                >
                  2026A Instrument Avalibility and Announcements
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  component="button"
                  variant="h6"
                  underline="hover"
                  sx={{ cursor: "pointer", fontSize: "1.15rem", fontWeight: 600 }}
                  onClick={() =>
                    handleUrlClick(
                      { text: "KPF-CC Observing Block Submission", url: urls.KPF_CC_OBS_BLOCK_SUBMISSION, newtab: true },
                      setSelectedPage,
                      setSelectedUrl
                    )
                  }
                >
                  KPF-CC Observing Block Submission
                </Link>
              </ListItem>
              {isKeckEmployee && currentSemester && (
                <ListItem>
                  <Link
                    component="button"
                    variant="h6"
                    underline="hover"
                    sx={{ cursor: "pointer", fontSize: "1.15rem", fontWeight: 600 }}
                    onClick={() =>
                      handleUrlClick(
                        { text: "Submit Engineering Request", url: urls.SUB_ENG_REQ + currentSemester, newtab: true },
                        setSelectedPage,
                        setSelectedUrl
                      )
                    }
                  >
                    Submit Engineering Request ({currentSemester})
                  </Link>
                </ListItem>
              )}
            </List>
          </Box>
        </Stack>
      </Paper>
    </Main>
  );
}