import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { 
  BarChart2, 
  Loader2, 
  AlertCircle, 
  CalendarDays,
  ArrowRight,
  ChevronDown 
} from "lucide-react";
import { API } from "../../../../../../constant"; // Adjust path as needed
import { useProject } from "../../../../ProjectContext"; // Adjust path as needed

const MonthlyProjects = () => {
  const { tenderId } = useProject();
  const today = new Date();

  // --- State ---
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [rawScheduleData, setRawScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Constants ---
  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!tenderId) return;
    setLoading(true);
    try {
      // We fetch the full daily schedule which contains the nested 'schedule_data' array
      const res = await axios.get(`${API}/schedule/get-daily-schedule/${tenderId}`);
      if (res.data && res.data.data) {
        setRawScheduleData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching monthly data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenderId]);

  // --- Data Mapping Logic (Hierarchical) ---
  const mappedData = useMemo(() => {
    if (!rawScheduleData.length) return [];

    // Determine target Month Name (e.g., "December")
    const targetMonthName = format(new Date(selectedYear, selectedMonth, 1), "MMMM");

    return rawScheduleData.map((item) => {
      // 1. Find the specific Month Object in the 'schedule_data' array
      const monthData = item.schedule_data?.find(m => 
        m.month_name === targetMonthName && m.year === selectedYear
      );

      // 2. Extract Metrics (Safe Fallback)
      const metrics = monthData?.metrics || { 
        achieved_quantity: 0, 
        planned_quantity: 0, 
        lag_quantity: 0 
      };

      return {
        ...item,
        display_planned: metrics.planned_quantity || 0,
        display_achieved: metrics.achieved_quantity || 0,
        display_lag: metrics.lag_quantity || 0,
        // Active if there is any plan or achievement for this specific month
        is_active_month: (metrics.planned_quantity > 0 || metrics.achieved_quantity > 0)
      };
    });
  }, [rawScheduleData, selectedYear, selectedMonth]);

  const selectedMonthName = format(new Date(selectedYear, selectedMonth, 1), "MMMM");

  return (
    <div className="flex flex-col h-full bg-white dark:bg-layout-dark  border border-gray-200 dark:border-gray-800 overflow-hidden">
      
      {/* --- Header Control Bar --- */}
      <div className="bg-white dark:bg-layout-dark border-b border-gray-200 dark:border-gray-700 px-5 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Title Area */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
              <BarChart2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Monthly Overview</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Project progress for {selectedMonthName} {selectedYear}</p>
            </div>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-layout-dark p-1 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="appearance-none bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-200 py-1 pl-2 pr-6 rounded focus:outline-none cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{format(new Date(2000, i, 1), "MMMM")}</option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="w-px h-3 bg-gray-300 dark:bg-gray-700"></div>
            
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="appearance-none bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-200 py-1 pl-2 pr-6 rounded focus:outline-none cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="flex-1 overflow-hidden relative bg-white dark:bg-layout-dark">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-layout-dark/80 z-20 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
            <span className="text-xs text-gray-500 font-medium">Loading monthly data...</span>
          </div>
        ) : (
          <MonthlyTable data={mappedData} monthName={selectedMonthName} />
        )}
      </div>
    </div>
  );
};

// --- Sub-Component: Table ---
const MonthlyTable = ({ data, monthName }) => {
  
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
        <AlertCircle className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs font-medium">No schedule data found.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 dark:bg-layout-dark sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {/* Standard Columns */}
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-[40px]">#</th>
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px]">WBS ID</th>
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">Description</th>
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-[50px]">Unit</th>
            <th className="py-3 px-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right w-[70px]">Total</th>
            <th className="py-2.5 px-3 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-right bg-indigo-50/50 dark:bg-indigo-900/20 w-[70px]">Exec</th>
            <th className="py-2.5 px-3 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-right bg-rose-50/50 dark:bg-rose-900/20 w-[70px] border-r border-gray-200 dark:border-gray-700">Bal</th>

            {/* Monthly Metrics Section (Purple Theme) */}
            <th className="py-2.5 px-3 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider text-right w-[100px] border-l border-gray-200 dark:border-gray-700 bg-purple-50/30 dark:bg-purple-900/10">
              Planned
            </th>
            <th className="py-2.5 px-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-right w-[100px] bg-emerald-50/30 dark:bg-emerald-900/10">
              Achieved
            </th>
            <th className="py-2.5 px-3 text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-right w-[80px] bg-orange-50/30 dark:bg-orange-900/10">
              Lag
            </th>
            <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-[100px] border-l border-gray-100 dark:border-gray-800">
              Status
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-layout-dark text-sm">
          {data.map((row, index) => {
            // Row Visibility
            const isActive = row.is_active_month;
            const rowClass = isActive ? "bg-white dark:bg-layout-dark" : "bg-gray-50/60 dark:bg-layout-dark/60 opacity-50 grayscale-[0.8]";

            // Lag Color
            const isLagging = row.display_lag > 0.01;
            const lagColor = isLagging ? "text-red-600 dark:text-red-400 font-bold" : "text-gray-400 dark:text-gray-500";

            // Dates
            const startDate = row.start_date ? format(new Date(row.start_date), "dd MMM") : "-";
            const endDate = (row.revised_end_date || row.end_date) ? format(new Date(row.revised_end_date || row.end_date), "dd MMM") : "-";

            return (
              <tr key={row.wbs_id} className={`${rowClass} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group`}>
                
                {/* Index & ID */}
                <td className="py-3 px-4   text-center text-gray-400 dark:text-gray-600 ">{index + 1}</td>
                <td className="py-3 px-4 font-mono font-medium text-gray-600 dark:text-gray-300">{row.wbs_id}</td>

                {/* Description & Dates */}
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[220px]" title={row.description}>
                      {row.description}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5">
                      <CalendarDays size={9} />
                      <span>{startDate}</span>
                      <ArrowRight size={8} />
                      <span>{endDate}</span>
                    </div>
                  </div>
                </td>

                {/* Unit & Totals */}
                <td className="py-2.5 px-3 text-center"><span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-layout-dark text-gray-500 dark:text-gray-400 text-[10px]">{row.unit}</span></td>
                <td className="py-2.5 px-3 text-right font-medium text-gray-700 dark:text-gray-300">{row.quantity?.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-900/10">
                  {row.executed_quantity > 0 ? row.executed_quantity.toLocaleString() : "-"}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/10 border-r border-gray-100 dark:border-gray-800">
                  {row.balance_quantity?.toLocaleString()}
                </td>

                {/* Monthly Metrics */}
                <td className="py-2.5 px-3 text-right font-medium text-purple-700 dark:text-purple-300 border-l border-gray-100 dark:border-gray-800 bg-purple-50/10">
                  {row.display_planned > 0 ? row.display_planned.toFixed(2) : "-"}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/10">
                  {row.display_achieved > 0 ? row.display_achieved.toFixed(2) : "-"}
                </td>
                <td className={`py-2.5 px-3 text-right ${lagColor} bg-orange-50/10`}>
                  {row.display_lag === 0 || row.display_lag < 0.01 ? "-" : row.display_lag.toFixed(2)}
                </td>

                {/* Status */}
                <td className="py-2.5 px-3 text-center border-l border-gray-100 dark:border-gray-800">
                  <StatusBadge status={row.status} />
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// --- Helper: Status Badge ---
const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toLowerCase() || "pending";
  const styles = {
    completed: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
    inprogress: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    pending: "text-gray-500 bg-gray-100 dark:bg-layout-dark",
  };
  const labels = { completed: "Done", inprogress: "Active", pending: "Pending" };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${styles[normalizedStatus]}`}>
      {labels[normalizedStatus]}
    </span>
  );
};

export default MonthlyProjects;