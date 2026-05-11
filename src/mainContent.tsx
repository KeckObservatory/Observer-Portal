import { styled } from '@mui/material/styles';

import { scheduleApi} from './api';
import { metricsApi } from './api';
import Paper from '@mui/material/Paper';
import { OrderedNightMetricsStrip } from './metrics';
import { Box } from '@mui/material';
import { renderTable } from './telStatus';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { ObserverInfoBannerWithSchedule } from './observerInfo';
import type { userInfoApiResponse } from './api';
import { Main } from './theme';
import { getShiftedDates } from './api';


import StandardPatch from './assets/StandardPatch.png';
import urls from './urls.json'
//import handleUrlClick from './sideBar';
import { handleUrlClick } from './urlLogic';

interface MainContentProps  {
  open: boolean;
  user: userInfoApiResponse;
  setSelectedPage?: (page: string) => void;
  setSelectedUrl?: (url: string | null) => void; 
};

/**
 * Styled Paper component for grid items.
 */
const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100%',
}));

const fastLinks = [
  { text: "Submit a Cover Sheet", url: urls.COVER_SHEET_SUBMISSION, newtab: true},
  { text: "Trigger a Target of Opportunity", url: urls.ToO_REQUEST_TOOL, newtab: true },
  { text: "KPF-CC Observing Block Submission", url: urls.KPF_CC_OBS_BLOCK_SUBMISSION, newtab: true },
  { text: "Planning Tool", url: urls.PLANNING_TOOL, newtab: true },
  { text: "Upload your Starlist", url: urls.TARGET_LIST_MANAGEMENT, newtab: true},
  { text: "Keck Observatory Archive", url: urls.KOA, newtab: true },
  { text: "Observers\' Data Access Portal (ODAP)", url: urls.ODAP, newtab: true},

];

/**
 * MainContent component displays the dashboard with:
 * - Observer info banner
 * - Keck I and Keck II instrument status tables
 * - Fast Links section
 * - Night metrics strip
 */
export default function MainContent({ open, user, setSelectedPage, setSelectedUrl }: MainContentProps) {
  
  // Fetch telescope schedule and metrics data
  const telescopeSchedData = scheduleApi();          
  const metricsData = metricsApi();       

  // Filter instruments by telescope number 
  const keckI = telescopeSchedData?.filter(item => item.TelNr === 1) || [];
  const keckII = telescopeSchedData?.filter(item => item.TelNr === 2) || [];

  const {hstDate} = getShiftedDates();

  // console.log("Shifted HST:", hstDate);
  // console.log("Shifted UTC:", utcDate);

  // console.log("Now Local:", new Date());
  // console.log("Now UTC:", new Date().toISOString());



  return (
    <Main open={open}>
       {/* Welcome message at the top */}
          <Paper
            elevation={3}
            sx={{
              mb: 3,
              p: 3,
              display: "flex",
              alignItems: "flex-start",
              position: "relative",
              flexDirection: "row",
              justifyContent: "center",
              minHeight: 170,
              bgcolor: "background.paper", // theme background
              color: "text.primary",       // theme text
            }}
          >
            <img
              src={StandardPatch}
              alt="Keck Logo"
              style={{
                height: 150,
                width: "auto",
                position: "absolute",
                top: 10,
                left: 24,
              }}
            />
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, color: "text.secondary" }}>
                Welcome to the Keck Observer Portal!
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 1, color: "text.secondary" }}>
                Your dashboard for schedules, instrument status, and observing resources.
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 1, color: "text.secondary" }}>
                Have feedback?{" "}
                <a
                  href="https://forms.gle/9FWFXDm13HgY1gpf8"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1976d2", textDecoration: "underline", fontWeight: 500, fontSize: "1rem" }}
                >
                  Go here
                </a>
                {" "}to fill out our form. Thanks!
              </Typography>
            </Box>
          </Paper>
      
      {/* Banner with welcome and checklist */}
      <ObserverInfoBannerWithSchedule
        user={user}
        setSelectedPage={setSelectedPage}
        setSelectedUrl={setSelectedUrl}
      />

      {/* Main dashboard grid with status tables */}
      <Grid container spacing={2} sx={{ height: "85%" }}>
      {/* Keck I instrument status */}
        <Grid size={{ xs: 12, sm: 4, md: 4 }} sx={{ height: "100%" }}>
          <Item>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            Keck I
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
            Instrument availability for the night of {hstDate} HST
          </Typography>
            {keckI.length > 0 ? renderTable(keckI) : <div>Loading Keck I...</div>}
          </Item>
        </Grid>

        {/* Keck II instrument status */}
        <Grid size={{ xs: 12, sm: 4, md: 4 }} sx={{ height: "100%" }}>
          <Item>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            Keck II
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
            Instrument availability for the night of {hstDate} HST
          </Typography>
            {keckII.length > 0 ? renderTable(keckII) : <div>Loading Keck II...</div>}
          </Item>
        </Grid>

        {/* Fast Links section */}
        <Grid size={{ xs: 12, sm: 4, md: 4 }} sx={{ height: "100%" }}>
          <Item
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              minHeight: 416.5, 
              maxHeight: 400,
            }}
          >
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
              Fast Links
            </Typography>
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", mt: 2 }}>
              {fastLinks.map(link => (
                <Typography
                  key={link.text}
                  component="button"
                  variant="body1"
                  sx={{
                    background: "none",
                    border: "none",
                    color: "primary.main",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: 500,
                    fontSize: "1.1rem",
                    p: 0,
                    m: 0,
                    width: "100%",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => handleUrlClick(link, setSelectedPage, setSelectedUrl)}
                >
                  {link.text}
                </Typography>
              ))}
            </Box>
          </Item>
        </Grid>
      </Grid>

      {/* Night metrics strip */}
      <Box sx={{ height: 24 }} /> 
      {metricsData?.[0] ? (
        <OrderedNightMetricsStrip data={metricsData[0]} />
      ) : (
        <div>Loading metrics...</div>
      )}
      <Box sx={{ height: 24 }} /> 
    </Main>
  );
}