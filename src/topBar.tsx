import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { useEffect, useState } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Box } from "@mui/material";
import { Avatar } from "@mui/material";
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import type { userInfoApiResponse } from "./api";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import UserTable from './observerInfo'; // Import your UserTable component
import { getMyPhoto } from './api';

const drawerWidth = 240;

// updating clock
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}
/**
 * Styled AppBar that shifts right when the sidebar is open.
 */
const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

interface TopBarProps {
  open: boolean;
  handleDrawerOpen: () => void;
  user: userInfoApiResponse;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  setSelectedPage?: (page: string) => void;
  setSelectedUrl?: (url: string | null) => void;  
};
/**
 * TopBar displays the app bar with title, clock, dark mode switch, and user avatar.
 */
export default function TopBar({
  open,
  handleDrawerOpen,
  user,
  darkMode,
  setDarkMode,
  setSelectedPage,      
  setSelectedUrl        
}: TopBarProps) {
  const now = useClock();
  const ut = now.toISOString().slice(11, 19); // ut time
  const utDateStr = now.toISOString().slice(0, 10); // e.g., "2025-10-29"
  const hstDate = new Date(now.getTime() - 10 * 60 * 60 * 1000);
  const hst = hstDate.toISOString().slice(11, 19); // hst time
  const hstDateStr = hstDate.toISOString().slice(0, 10); // e.g., "2025-10-28"

  // State to control profile dialog open/close
  const [profileOpen, setProfileOpen] = useState(false);

    // State for the observer photo
  const [obsPhoto, setObsPhoto] = useState<string | null>(null);

  // Fetch observer photo once
  useEffect(() => {
    if (user?.Id) {
      getMyPhoto(user.Id)
        .then((photoUrl) => setObsPhoto(photoUrl))
        //.catch((err) => console.error("Error fetching photo:", err));
    }
  }, [user?.Id]);

  return (
    <StyledAppBar position="fixed" open={open}>
      <Toolbar>
      {/* Show menu icon if sidebar is closed */}
        {!open && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" noWrap component="div">
          Observer Portal
        </Typography>

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
          {/* Clock section reformatted and centered */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mr: 2 }}>
            <Typography variant="h5" sx={{ display: "flex", alignItems: "center" }}>
              UT: {ut} {utDateStr}
            </Typography>
            <AccessTimeIcon fontSize="medium" sx={{ verticalAlign: "middle" }} />
            <Typography variant="h5" sx={{ display: "flex", alignItems: "center" }}>
              HST: {hst} {hstDateStr}
            </Typography>
          </Box>

          {/* Dark mode switch with tooltip */}
          <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <Switch
              checked={darkMode}
              onChange={e => setDarkMode(e.target.checked)}
              color="default"
              sx={{ mr: 2 }}
            />
          </Tooltip>

          {/* Profile avatar bubble with tooltip */}
          <Tooltip title="View profile">
            <IconButton sx={{ p: 0 }} onClick={() => setProfileOpen(true)}>
              <Avatar
                alt={user?.FirstName ?? "User"}
                src={`data:image/jpeg;base64,${obsPhoto}`} // full data URL or fallback
                sx={{ width: 40, height: 40 }}
              >
                {(user?.FirstName?.[0] ?? "").toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      {/* Profile dialog */}
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Your Information</DialogTitle>
        <DialogContent>
          {/* Add larger avatar at the top */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            mb: 3,
            mt: 1
          }}>
            <Avatar
              alt={user?.FirstName ?? "User"}
              src={`data:image/jpeg;base64,${obsPhoto}`}
              sx={{ 
                width: 120, 
                height: 120,
                border: '3px solid',
                borderColor: 'primary.main',
                fontSize: '3rem'
              }}
            >
              {(user?.FirstName?.[0] ?? "").toUpperCase()}
            </Avatar>
          </Box>
          
          <UserTable
            user={user}
            setSelectedPage={(page) => {
              setProfileOpen(false); // Close the dialog when Edit Profile is clicked
              if (setSelectedPage) setSelectedPage(page);
            }}
            setSelectedUrl={setSelectedUrl}
          />
        </DialogContent>
      </Dialog>
    </StyledAppBar>
  );
}