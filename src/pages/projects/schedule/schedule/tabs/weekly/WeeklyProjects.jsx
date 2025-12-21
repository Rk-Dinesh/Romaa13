import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { format, getDaysInMonth } from "date-fns";
import { 
  BarChart3, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Clock, 
  ArrowRight,
  CalendarDays,
  Calendar
} from "lucide-react";
import { API } from "../../../../../../constant"; 
import { useProject } from "../../../../ProjectContext"; 

const WeeklyProjects = () => {
  const { tenderId } = useProject();
  const today = new Date();

  // --- State ---
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0); 
  const [rawScheduleData, setRawScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Constants ---
  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  // --- Dynamic Week Ranges ---
  const weeks = useMemo(() => {
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
    return [
      { label: "Week 1", range: "01 - 07", key: "firstweek" },
      { label: "Week 2", range: "08 - 14", key: "secondweek" },
      { label: "Week 3", range: "15 - 21", key: "thirdweek" },
      { label: "Week 4", range: `22 - ${daysInMonth}`, key: "fourthweek" },
    ];
  }, [selectedYear, selectedMonth]);

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!tenderId) return;
    setLoading(true);
    try {
      // NOTE: Using get-daily-schedule as it returns the full 'schedule_data' nested array
      const res = await axios.get(`${API}/schedule/get-daily-schedule/${tenderId}`);
      if (res.data && res.data.data) {
        setRawScheduleData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching weekly data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenderId]);

  // --- Data Mapping Logic ---
  const mappedData = useMemo(() => {
    if (!rawScheduleData.length) return [];

    // 1. Determine target Month Name (e.g., "December") to match API
    const targetMonthName = format(new Date(selectedYear, selectedMonth, 1), "MMMM");

    return rawScheduleData.map((item) => {
      // 2. Find the Month Object in schedule_data array
      const monthData = item.schedule_data?.find(m => 
        m.month_name === targetMonthName && m.year === selectedYear
      );

      // 3. Find the Week Object inside the Month (by index or label)
      // The API returns 'weeks' array: [firstweek, secondweek, thirdweek, fourthweek]
      const weekData = monthData?.weeks?.[selectedWeekIndex];
      
      // 4. Extract Metrics (Safe Fallback)
      const metrics = weekData?.metrics || { 
        achieved_quantity: 0, 
        planned_quantity: 0, 
        lag_quantity: 0 
      };

      return {
        ...item,
        display_planned: metrics.planned_quantity || 0,
        display_achieved: metrics.achieved_quantity || 0,
        display_lag: metrics.lag_quantity || 0,
        // Helper: Row is active if there is any plan or execution this week
        is_active_week: (metrics.planned_quantity > 0 || metrics.achieved_quantity > 0)
      };
    });
  }, [rawScheduleData, selectedYear, selectedMonth, selectedWeekIndex]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-layout-dark  border border-gray-200 dark:border-gray-800 overflow-hidden ">
      
      {/* --- Header Control Bar --- */}
      <div className="bg-white dark:bg-layout-dark border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Performance</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Track planned vs achieved progress per week</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">

            {/* Year & Month Selectors */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-layout-dark p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setSelectedWeekIndex(0); }}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 py-1.5 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{format(new Date(2000, i, 1), "MMMM")}</option>
                ))}
              </select>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-700"></div>
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setSelectedWeekIndex(0); }}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 py-1.5 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Week Tabs */}
            <div className="flex items-center bg-gray-100 dark:bg-layout-dark p-1 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto max-w-full">
              {weeks.map((week, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedWeekIndex(idx)}
                  className={`
                    flex flex-col items-center justify-center px-4 py-1.5 rounded-md text-xs font-medium transition-all min-w-[80px]
                    ${selectedWeekIndex === idx 
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600" 
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-700"}
                  `}
                >
                  <span>{week.label}</span>
                  <span className="text-[10px] opacity-70 mt-0.5 font-normal">{week.range}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="flex-1 overflow-hidden relative bg-white dark:bg-layout-dark">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-layout-dark/80 z-10 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500 font-medium">Loading weekly data...</p>
          </div>
        ) : (
          <WeeklyTable data={mappedData} selectedWeekLabel={weeks[selectedWeekIndex].label} />
        )}
      </div>
    </div>
  );
};

// --- Sub-Component: Table ---
const WeeklyTable = ({ data, selectedWeekLabel }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
        <AlertCircle className="w-8 h-8 opacity-50" />
        <p className="text-sm font-medium">No schedule data found for this period.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar px-1">
      <table className="w-full text-left border-collapse ">
        <thead className="bg-gray-50 dark:bg-layout-dark sticky top-0  shadow-sm">
          <tr>
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 w-[100px text-center]">#</th>
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 w-[100px]">WBS ID</th>
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 min-w-[200px]">Description</th>
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center w-[60px]">Unit</th>
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right w-[60px]"> Qty</th>
            <th className="py-2.5 px-3 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-right bg-indigo-50/50 dark:bg-indigo-900/20 w-[70px]">Exec</th>
            <th className="py-2.5 px-3 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-right bg-rose-50/50 dark:bg-rose-900/20 w-[70px] border-r border-gray-200 dark:border-gray-700">Bal</th>

            {/* Weekly Section */}
            <th className="py-3 px-4 text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider text-right w-[100px] border-l border-gray-200 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-900/10">
            Plan
            </th>
            <th className="py-3 px-4 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-right w-[100px] bg-emerald-50/30 dark:bg-emerald-900/10">
              {/* {selectedWeekLabel} Done */} Achieved
            </th>
            <th className="py-3 px-4 text-[11px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider text-right w-[80px] bg-orange-50/30 dark:bg-orange-900/10">
              Lag
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-layout-dark">
          {data.map((row, index) => {
            // Row Visibility Logic: Dim non-active rows for better focus
            const isActive = row.is_active_week;
            const rowClass = isActive ? "bg-white dark:bg-layout-dark" : "bg-gray-50/60 dark:bg-layout-dark/60 opacity-50 grayscale-[0.8]";

            // Lag Color Logic (Positive = Behind = Red)
            const isLagging = row.display_lag > 0.01; 
            const lagColor = isLagging ? "text-red-600 dark:text-red-400 font-bold" : "text-gray-400 dark:text-gray-500";

            // Dates
            const startDate = row.start_date ? format(new Date(row.start_date), "dd MMM") : "-";
            const endDate = (row.revised_end_date || row.end_date) ? format(new Date(row.revised_end_date || row.end_date), "dd MMM") : "-";

            return (
              <tr key={row.wbs_id} className={`${rowClass} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group`}>
                <td className="py-3 px-4 text-sm text-center font-medium text-gray-600 dark:text-gray-300">
                  {index + 1}
                </td>
                <td className="py-3 px-4 text-sm font-mono font-medium text-gray-600 dark:text-gray-300">
                  {row.wbs_id}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[280px]" title={row.description}>
                      {row.description}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                      <Calendar size={10} />
                      <span>{startDate}</span>
                      <ArrowRight size={8} />
                      <span>{endDate}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-center">
                  <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {row.unit}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                  {row.quantity?.toLocaleString()}
                </td>
               <td className="py-2.5 px-3 text-sm text-right font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-900/10">
                  {row.executed_quantity > 0 ? row.executed_quantity.toLocaleString() : "-"}
                </td>
                <td className="py-2.5 px-3 text-sm text-right font-semibold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/10 border-r border-gray-100 dark:border-gray-800">
                  {row.balance_quantity?.toLocaleString()}
                </td>

                {/* Weekly Data */}
                <td className="py-3 px-4 text-right bg-blue-50/30 dark:bg-blue-900/5 border-l border-gray-100 dark:border-gray-800">
                  <span className={`text-sm font-bold ${row.display_planned > 0 ? "text-blue-700 dark:text-blue-400" : "text-gray-300 dark:text-gray-600"}`}>
                  {row.display_planned > 0 ? row.display_planned.toFixed(2) : "-"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right bg-green-50/30 dark:bg-green-900/5 border-l border-gray-100 dark:border-gray-800">
                  <span className={`text-sm font-bold ${row.display_achieved > 0 ? "text-green-700 dark:text-green-400" : "text-gray-300 dark:text-gray-600"}`}>
                  {row.display_achieved > 0 ? row.display_achieved.toFixed(2) : "-"}
                  </span>
                </td>
                <td className={`py-3 px-4 text-right border-l border-gray-100 dark:border-gray-800 ${lagColor} bg-orange-50/30 dark:bg-orange-900/5`}>
                  <span className="text-sm font-mono">
                    {row.display_lag === 0 ? "-" : row.display_lag.toFixed(2)}
                  </span>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyProjects;