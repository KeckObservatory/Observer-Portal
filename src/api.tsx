// File to handle all API calls and export the data for the Observer Portal

import { useEffect, useState } from "react";
import urls from './urls.json';
import { differenceInCalendarDays } from "date-fns";


/**
 * Returns the current shifted date as YYYY-MM-DD.
 * If before 8am HST (18:00 UTC), returns yesterday's date.
 */
export function getShiftedDates() {
  const nowUtc = new Date(); // THIS is always UTC internally

  // Convert UTC → HST by subtracting 10 hours
  const hstNow = new Date(nowUtc.getTime() - 10 * 60 * 60 * 1000);

  // Determine shifted HST date
  const shiftedHst = new Date(hstNow);

  if (hstNow.getUTCHours() < 8) {
    // Still before 8am HST
    shiftedHst.setUTCDate(shiftedHst.getUTCDate() - 1);
  }

  // Format YYYY-MM-DD
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const hstDate = fmt(shiftedHst);

  // Convert shifted HST midnight → UTC  
  const utcEquivalent = new Date(shiftedHst.getTime() + 10 * 60 * 60 * 1000);
  const utcDate = fmt(utcEquivalent);

  return { hstDate, utcDate };
  
}

/**
 * Returns the date six months later from the given start date as YYYY-MM-DD.
 */
function getDateSixMonthsLater(startDateStr: string) {
  const startDate = new Date(startDateStr);
  // Add 6 months
  startDate.setMonth(startDate.getMonth() + 6);

  // Format as YYYY-MM-DD
  return startDate.toISOString().split('T')[0];
}

/**
 * Given current semester, calculates previous X semester names (used in dropdowns).
 */
export function getLastSemesters(current: string, count: number): string[] {
  const match = current.match(/(\d{4})([AB])/);
  if (!match) return [];

  let year = parseInt(match[1]);
  let term = match[2];
  const semesters: string[] = [];

  for (let i = 0; i < count; i++) {
    if (term === "A") {
      term = "B";
      year--;
    } else {
      term = "A";
    }
    semesters.push(`${year}${term}`);
  }
  return semesters;
}

/* Interface for metrics API response */ 
export interface metricsApiResponse {
  udate: string;
  dusk_12deg: string;
  dusk_18deg: string;
  dawn_18deg: string;
  dawn_12deg: string;
  dark: string;
  sunset: string;
  sunrise: string;
  moonRADEC: string;
  moonrise: string;
  moonset: string;
  moonillumination: string;
  moonphase: string;
  moonbrightness: string;
  length: string;
  midpoint: string;
}

/**
 * Fetches time metrics for the current shifted date.
 */
export function metricsApi() {
  const [data, setData] = useState<metricsApiResponse | null>(null);

useEffect(() => {
    const fetchData = async () => {
        // Get current date with shift
        const {utcDate} = getShiftedDates();

        // Fetch metrics list
        const timeList = await fetch(urls.METRICS_API + `date=${utcDate}`);
        const timeMetrics: metricsApiResponse = await timeList.json();
        setData(timeMetrics);
  };
  fetchData();
}, []);
  return data;}

  /**
 * Interface for telescope schedule API response
 */
export interface TelescopeSchedApiResponse {
  Instrument: string;
  State: string;
  TelNr: number;
}

/**
 * Fetches the instrument status for the current shifted date for main page telSchedule.
 * For instruments that are "TDA Ready" or "Scheduled", also fetches their real-time ready state.
 */
export function scheduleApi() {
  const [data, setData] = useState<(TelescopeSchedApiResponse & { ReadyState?: string })[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {hstDate} = getShiftedDates();
        // Fetch only instrument status
        const response = await fetch(
          `${urls.SCHEDULE_API}/getInstrumentStatus?date=${hstDate}&numdays=1`
        );
        const result = await response.json();
        const statesMap = result[0]; // instrument status data

        // Map the instruments into a list with name, TelNr, and State
        let instrumentsWithState: (TelescopeSchedApiResponse & { ReadyState?: string })[] = await Promise.all(
          Object.entries(statesMap).map(async ([instrumentName, instState]: any) => {
            let stateLabel = "Unknown";
            if (instState) {
              if (instState.Available === 0) {
                stateLabel = "Not Available";
              } else if (instState.Available === 1 && instState.Scheduled === 0) {
                stateLabel = "TDA Ready";
              } else if (instState.Available === 1 && instState.Scheduled === 1) {
                stateLabel = "Scheduled";
              }
            }

            let readyState: string | undefined = undefined;
            // If TDA Ready or Scheduled, fetch the real-time ready state
            if (stateLabel === "TDA Ready" || stateLabel === "Scheduled") {
              try {
                const readyRes = await fetch(
                  `${urls.SCHEDULE_API}/getInstrumentReadyState?instrument=${encodeURIComponent(instrumentName)}&date=${hstDate}`
                );
                if (readyRes.ok) {
                  const readyJson = await readyRes.json();
                  readyState = readyJson.State || undefined;
                  //console.log(readyState, 'ready state json')
                }
              } catch {
                // ignore error, leave readyState undefined
              }
            }

            return {
              Instrument: instrumentName,
              TelNr: instState?.TelNr ?? 0,
              State: stateLabel,
              ReadyState: readyState,
            };
          })
        );

        setData(instrumentsWithState);
      } catch (err) {
        //console.error("Error fetching instrument status:", err);
      }
    };

    fetchData();
  }, []);

  return data;
}

/**
 * Interface for user info API response, called in App.tsx
 */
export interface userInfoApiResponse {
  Id: number;
  Title: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  Email: string;
  Affiliation: string;
  WorkArea: string;
  Interests: string;
  Street: string;
  City: string;
  State: string;
  Country: string;
  Zip: string;
  Phone: string;
  URL: string;
  ProfilePictureURL : string;
}

/**
 * Fetches the current user's info.
 */
export function userInfoApi() {
  const [data, setData] = useState<userInfoApiResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Need to include credentials to get cookies
        const userInfo = await fetch(urls.USERINFOCOOKIES , {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        //console.log(userInfo, 'userinfo in function')
        const user = await userInfo.json();
        //console.log(user, 'user in function')

      setData(user);
    } catch (err) {
      //console.error("Error fetching user:", err);
    }
  };

  fetchData();
}, []);
  return data;}

/**
 * Interface for employee night staff API response
 */
export interface nightStaffApiResponse {
  FirstName: string;
  Type: string; // oa, sa
  Email: string;
  TelNr: string;
}

/**
 * Interface for constructed combined schedule + night staff.
 */
export interface CombinedSchedule {
  Date: string;
  StartTime: string;
  EndTime: string;
  TelNr: number;
  Principal: string;
  Observers: string;
  Instrument: string; 
  ProjCode: string;
  staff?: nightStaffApiResponse[];
  DaysUntil: number;
}

/**
* Interface for observation schedule API response
*  */
export interface obsScheduleApiResponse {
  Date: string;
  StartTime: string;
  EndTime: string;
  TelNr: number;
  Principal: string;
  Observers: string;
  Instrument: string;
  ProjCode: string;
}

/**
 * Fetches the combined schedule and staff for an observer.
 */
export function useCombinedSchedule(obsid: number) {
  const [data, setData] = useState<(CombinedSchedule & { DaysUntil: number })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCombined = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Get the observer’s schedule
        const {hstDate} = getShiftedDates();
        const endDate = getDateSixMonthsLater(hstDate);

        const scheduleRes = await fetch(
          `${urls.SCHEDULE_API}/getScheduleByUser?obsid=${obsid}&startdate=${hstDate}&enddate=${endDate}`
        );
        if (!scheduleRes.ok) throw new Error("Failed to fetch schedule");
        const schedule: obsScheduleApiResponse[] = await scheduleRes.json();

        // Step 2: For each schedule date, fetch the night staff
        const staffPromises = schedule.map(async (night) => {
          const employeeRes = await fetch(
            `${urls.EMPLOYEE_API}/getNightStaff?date=${night.Date}`
          );
          if (!employeeRes.ok) throw new Error("Failed to fetch night staff");
          const staff: nightStaffApiResponse[] = await employeeRes.json();

          // Calculate days until observation
          const today = new Date();
          const obsDate = new Date(night.Date);
          const DaysUntil = differenceInCalendarDays(obsDate, today);

          return { ...night, staff, DaysUntil };
        });

        const combined = await Promise.all(staffPromises);
        setData(combined);
      } catch (err: any) {
        //console.error("Error fetching combined schedule:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCombined();
  }, [obsid]);

  return { data, loading, error };
}

/**
 * Interface for each observing log 
*/
export interface obsLog {
  filename: string;
  title: string;
}

/**
 * getObsLogInfo ApiResponse interface 
 */
export interface obsLogApiResponse {
  logs: obsLog[];
}

/**
 * Fetches observing logs for a given observer and semester.
 * If semester is "All Logs", fetches logs from multiple semesters.
 */
export function useObsLogApi(obsid: number, semester: string, currentSemester: string) {
  const [data, setData] = useState<obsLogApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        // need to call api call differently for "All Logs"
        if (semester === "All Logs") {
          const semesters = [currentSemester, ...getLastSemesters(currentSemester, 10)];
          
          const allLogsPromises = semesters.map(async (sem) => {
            try {
              const response = await fetch(
                `${urls.PROPOSALS_API}/getObsLogInfo?obsid=${obsid}&semester=${sem}`
              );
              const json = await response.json();
              return json.logs || [];
            } catch (err) {
              //console.error(`Error fetching logs for ${sem}:`, err);
              return [];
            }
          });

          const allLogsArrays = await Promise.all(allLogsPromises);
          const allLogs = allLogsArrays.flat();
          
          setData({ logs: allLogs });
        } else {
          // Fetch logs for specific semester
          const response = await fetch(
            `${urls.PROPOSALS_API}/getObsLogInfo?obsid=${obsid}&semester=${semester}`
          );
          const json = await response.json();
          setData(json);
        }
      } catch (err) {
        //console.error(err);
        setData({ logs: [] });
      } finally {
        setLoading(false);
      }
    }

    if (semester && currentSemester) { // Make sure we have currentSemester
      fetchLogs();
    }
  }, [obsid, semester, currentSemester]);

  return { data, loading };
}

/**
 * Fetches the current semester based on the shifted date.
 */
export function getCurrentSemester() {
  const [semester, setSemester] = useState<string>("");

  useEffect(() => {
    async function fetchCurrent() {
      try {
        // get formatted HST date
        const {hstDate} = getShiftedDates();
        const res = await fetch(urls.SCHEDULE_API + `/getSemester?date=${hstDate}`);
        const json = await res.json(); // { semester: "2025B" }
        const current = json.semester;
        setSemester(current);
      } catch (err) {
        //console.error("Failed to get current semester", err);
      }
    }
    fetchCurrent();
  }, []);

  return semester;
}


/**
 * Fetches employee links for a given observer.
 */
export async function getEmployeeLinks(obsid: number): Promise<{ links?: { name: string; url: string }[] }> {
  try {
    const res = await fetch(urls.EMPLOYEE_API + `/getEmployeeLinks?obsid=${obsid}`);
    return await res.json();
  } catch {
    return {};
  }
}

/**
 * Fetches newest semester avaliable to submit coversheet.
 */
export async function getNewestSemester(): Promise<string> {
  try {
    const res = await fetch(urls.PROPOSALS_API + `/getNewestSemester`);
    const json = await res.json(); // { semester: "2025B" }
    //console.log(json, 'newest semester api response')
    return json.semester;
  } catch {
    return "";
  }
}

export interface myRequestsApiResponse {
  FromDate: string;
  Instrument: string;
  Principal: string;
  ProjCode: string;
  ReqNo: number;
  Status: string;
  Telescope: string;
  observer_names: string;
  observers: string;
  semester: string;
  NumNights: number;
  Id: number;
}


export async function getMyRequests (obsid: number): Promise<myRequestsApiResponse[]> {
    try {
    const res = await fetch(urls.OBSERVING_API + `/getObsRequests?obsid=${obsid}`);
    const json = await res.json(); 
    //console.log(json, 'my requests api response')
    return json.requests;
  } catch {
    return [];
  }
}


export async function getMyPhoto(obsid: number): Promise<string | null> {
  try {
    const res = await fetch(
      urls.OBSERVING_API + `/getObserverPhoto?obsid=${obsid}`
    );

    const json = await res.json();

    if (!json.thumbnail) return null;
    return json.thumbnail;

  } catch (err) {
    //console.error("Error fetching photo:", err);
    return null;
  }
}

/**
 * Interface for cover sheet program
 */
export interface CoverSheetProgram {
  name: string;
  semid: string;
  title?: string;
  type?: string;
}

/**
 * Interface for cover sheets API response
 */
export interface CoverSheetsApiResponse {
  programs: CoverSheetProgram[];
}

/**
 * Fetches cover sheets for a given observer and semester.
 * If semester is "All Coversheets", fetches from multiple semesters.
 */
export function useCoverSheetsApi(obsid: number, semester: string, currentSemester: string) {
  const [data, setData] = useState<CoverSheetsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoverSheets() {
      setLoading(true);
      try {
        if (semester === "All Coversheets") {
          // Fetch from multiple semesters like logs
          const semesters = [currentSemester, ...getLastSemesters(currentSemester, 15)];
          
          const allCoversheetsPromises = semesters.map(async (sem) => {
            try {
              const response = await fetch(
                `${urls.PROPOSALS_API}/getAllProposals?obsid=${obsid}&type=coversheet`
              );
              const json = await response.json();
              
              // Filter by semester and add with title/type
              const semesterPrograms = (json.programs || []).filter((p: CoverSheetProgram) =>
                p.semid && p.semid.includes(sem)
              );

              // add with title/type info
              const enrichedPrograms = await Promise.all(
                semesterPrograms.map(async (program: CoverSheetProgram) => {
                  try {
                    const coverResponse = await fetch(`${urls.PROPOSALS_API}/getCoverSheetInfo?semid=${program.semid}`);
                    const coverData = await coverResponse.json();
                    if (coverData.success === "SUCCESS" && coverData.result) {
                      return {
                        ...program,
                        title: coverData.result.title,
                        type: coverData.result.type
                      };
                    }
                  } catch (err) {
                  }
                  return program;
                })
              );

              return enrichedPrograms;
            } catch (err) {
              return [];
            }
          });

          const allCoversheetsArrays = await Promise.all(allCoversheetsPromises);
          const allCoversheets = allCoversheetsArrays.flat();
          
          // Sort by semester (newest first)
          allCoversheets.sort((a, b) => {
            if (a.semid && b.semid) {
              return b.semid.localeCompare(a.semid);
            }
            return 0;
          });
          
          setData({ programs: allCoversheets });
        } else {
          // Fetch for specific semester
          const response = await fetch(
            `${urls.PROPOSALS_API}/getAllProposals?obsid=${obsid}&type=coversheet`
          );
          const json = await response.json();
          
          // Filter by selected semester
          const programs = (json.programs || []).filter((p: CoverSheetProgram) =>
            p.semid && p.semid.includes(semester)
          );

          // Enrich with title/type
          const enrichedPrograms = await Promise.all(
            programs.map(async (program: CoverSheetProgram) => {
              try {
                const coverResponse = await fetch(`${urls.PROPOSALS_API}/getCoverSheetInfo?semid=${program.semid}`);
                const coverData = await coverResponse.json();
                if (coverData.success === "SUCCESS" && coverData.result) {
                  return {
                    ...program,
                    title: coverData.result.title,
                    type: coverData.result.type
                  };
                }
              } catch (err) {
                // Silent fail
              }
              return program;
            })
          );

          setData({ programs: enrichedPrograms });
        }
      } catch (err) {
        setData({ programs: [] });
      } finally {
        setLoading(false);
      }
    }

    if (semester && currentSemester) {
      fetchCoverSheets();
    }
  }, [obsid, semester, currentSemester]);

  return { data, loading };
}
