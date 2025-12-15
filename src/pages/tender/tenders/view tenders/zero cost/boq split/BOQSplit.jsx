import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API } from "../../../../../../constant";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

const formatNumber = (num) => {
  if (num === undefined || num === null || num === "") return "-";
  const n = Number(num);
  if (Number.isNaN(n)) return "-";
  return n.toFixed(2);
};

const BOQSplit = () => {
  const { tender_id } = useParams();
  const [boq, setBoq] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBoqSplit = async () => {
    if (!tender_id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/boq/get-items/${tender_id}`);
      setBoq(res.data.data || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch BOQ items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoqSplit();
  }, [tender_id]);

  const items = useMemo(() => boq?.items || [], [boq]);

  if (loading) {
    return <div className="p-4 text-center">Loading BOQ Split…</div>;
  }

  if (!boq || !Array.isArray(items) || items.length === 0) {
    return (
      <div className="p-4 text-center text-red-500">
        No BOQ split data found for Tender {tender_id}
      </div>
    );
  }

  // --- STYLING CONFIGURATION ---
  const WIDTHS = {
    sl: 50,
    item: 180,
    desc: 200,
    unit: 50,
    qty: 60,
  };

  const getStickyStyle = (colName, isHeader = false) => {
    let left = 0;
    if (colName === "item") left = WIDTHS.sl;
    if (colName === "desc") left = WIDTHS.sl + WIDTHS.item;
    if (colName === "unit") left = WIDTHS.sl + WIDTHS.item + WIDTHS.desc;
    if (colName === "qty") left = WIDTHS.sl + WIDTHS.item + WIDTHS.desc + WIDTHS.unit;

    return {
      position: "sticky",
      left: `${left}px`,
      zIndex: isHeader ? 30 : 20, // High z-index to stay on top
      width: WIDTHS[colName],
      minWidth: WIDTHS[colName],
      maxWidth: WIDTHS[colName],
    };
  };

  // --- FIX: BORDER STYLES ---
  // 1. We use 'border-separate' on the table.
  // 2. We apply 'border-r' and 'border-b' to every cell.
  // 3. We apply 'border-t' and 'border-l' to the main table wrapper to close the box.
  
  const baseCellClass = "border-r border-b border-gray-300 px-2 py-2";
  
  // Sticky Cell Class (White background is CRITICAL to hide scrolling content behind it)
  const stickyClass = `${baseCellClass} bg-white group-hover:bg-gray-50`; 
  
  // Header Sticky Class
  const headerStickyClass = `${baseCellClass} bg-gray-100 text-gray-700 font-bold`;

  // Shadow for the last sticky column to create a "floating" effect
  const lastStickyShadow = "shadow-[4px_0_5px_-2px_rgba(0,0,0,0.1)] border-r-2 border-r-gray-400";

  return (
    <div className="space-y-4">
      {/* Top Cards */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="border rounded-md px-2 py-1 bg-green-50">
            <p className="text-[11px] text-gray-500">BOQ Total</p>
            <p className="font-semibold text-green-700">
              {formatNumber(boq.boq_total_amount)}
            </p>
          </div>
          <div className="border rounded-md px-2 py-1 bg-blue-50">
            <p className="text-[11px] text-gray-500">Zero‑Cost Total</p>
            <p className="font-semibold text-blue-700">
              {formatNumber(boq.zero_cost_total_amount)}
            </p>
          </div>
          <div className="border rounded-md px-2 py-1 bg-amber-50">
            <p className="text-[11px] text-gray-500">Variance Amount</p>
            <p className="font-semibold text-amber-700">
              {formatNumber(boq.variance_amount)}
            </p>
          </div>
          <div className="border rounded-md px-2 py-1 bg-rose-50">
            <p className="text-[11px] text-gray-500">Variance %</p>
            <p className="font-semibold text-rose-700">
              {formatNumber(boq.variance_percentage)}%
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Container - Added border-t and border-l here */}
      <div className="overflow-x-auto border-t border-l border-gray-300 bg-white shadow-sm max-w-full ">
        
        {/* FIX: Changed to border-separate and border-spacing-0 */}
        <table className="border-separate border-spacing-0 text-xs table-fixed min-w-full">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase">
              {/* --- STICKY HEADERS --- */}
              <th rowSpan={2} style={getStickyStyle("sl", true)} className={`${headerStickyClass} text-center`}>
                Sl. No.
              </th>
              <th rowSpan={2} style={getStickyStyle("item", true)} className={`${headerStickyClass} text-left`}>
                Item
              </th>
              <th rowSpan={2} style={getStickyStyle("desc", true)} className={`${headerStickyClass} text-left`}>
                Description
              </th>
              <th rowSpan={2} style={getStickyStyle("unit", true)} className={`${headerStickyClass} text-center`}>
                Unit
              </th>
              <th rowSpan={2} style={getStickyStyle("qty", true)} className={`${headerStickyClass} ${lastStickyShadow} text-center`}>
                Qty
              </th>
              {/* --- END STICKY HEADERS --- */}

              <th colSpan={2} className={`${baseCellClass} text-center bg-blue-50 min-w-[160px]`}>BOQ</th>
              <th colSpan={2} className={`${baseCellClass} text-center bg-green-100 min-w-[160px]`}>Zero‑Cost</th>
              <th colSpan={2} className={`${baseCellClass} text-center bg-emerald-50 min-w-[160px]`}>Consumable</th>
              <th colSpan={2} className={`${baseCellClass} text-center bg-emerald-50 min-w-[160px]`}>Bulk</th>
              <th colSpan={2} className={`${baseCellClass} text-center bg-yellow-50 min-w-[160px]`}>Machinery</th>
              <th colSpan={2} className={`${baseCellClass} text-center bg-yellow-50 min-w-[160px]`}>Fuel</th>
              <th colSpan={2} className={`${baseCellClass} text-center bg-purple-50 min-w-[160px]`}>Contractor</th>
              <th colSpan={2} className={`${baseCellClass} text-center bg-purple-50 min-w-[160px]`}>NMR</th>
              <th colSpan={2} className={`${baseCellClass} text-center bg-rose-50 min-w-[160px]`}>Variance</th>
            </tr>

            <tr className="bg-gray-100 text-gray-600">
              <th className={`${baseCellClass} text-center bg-blue-50`}>Rate</th>
              <th className={`${baseCellClass} text-center bg-blue-50`}>Amount</th>
              <th className={`${baseCellClass} text-center bg-green-100`}>Rate</th>
              <th className={`${baseCellClass} text-center bg-green-100`}>Amount</th>
              <th className={`${baseCellClass} text-center bg-emerald-50`}>Rate</th>
              <th className={`${baseCellClass} text-center bg-emerald-50`}>Amount</th>
              <th className={`${baseCellClass} text-center bg-emerald-50`}>Rate</th>
              <th className={`${baseCellClass} text-center bg-emerald-50`}>Amount</th>
              <th className={`${baseCellClass} text-center bg-yellow-50`}>Rate</th>
              <th className={`${baseCellClass} text-center bg-yellow-50`}>Amount</th>
              <th className={`${baseCellClass} text-center bg-yellow-50`}>Rate</th>
              <th className={`${baseCellClass} text-center bg-yellow-50`}>Amount</th>
              <th className={`${baseCellClass} text-center bg-purple-50`}>Rate</th>
              <th className={`${baseCellClass} text-center bg-purple-50`}>Amount</th>
              <th className={`${baseCellClass} text-center bg-purple-50`}>Rate</th>
              <th className={`${baseCellClass} text-center bg-purple-50`}>Amount</th>
              <th className={`${baseCellClass} text-center bg-rose-50`}>Amt</th>
              <th className={`${baseCellClass} text-center bg-rose-50`}>%</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it, idx) => (
              <tr key={it.item_id || idx} className="hover:bg-gray-50 text-gray-700 group">
                {/* --- STICKY BODY COLUMNS --- */}
                <td style={getStickyStyle("sl")} className={`${stickyClass} text-center`}>
                  {idx + 1}
                </td>
                <td style={getStickyStyle("item")} className={`${stickyClass} font-medium truncate`} title={it.item_name}>
                  {it.item_name}
                </td>
                <td style={getStickyStyle("desc")} className={`${stickyClass} text-xs truncate`} title={it.description}>
                  {it.description}
                </td>
                <td style={getStickyStyle("unit")} className={`${stickyClass} text-center`}>
                  {it.unit}
                </td>
                <td style={getStickyStyle("qty")} className={`${stickyClass} ${lastStickyShadow} text-right`}>
                  {formatNumber(it.quantity)}
                </td>
                {/* --- END STICKY BODY COLUMNS --- */}

                <td className={`${baseCellClass} text-right bg-blue-50/40`}>{formatNumber(it.n_rate)}</td>
                <td className={`${baseCellClass} text-right bg-blue-50/40`}>{formatNumber(it.n_amount)}</td>
                <td className={`${baseCellClass} text-right bg-green-100/40 font-semibold`}>{formatNumber(it.final_rate)}</td>
                <td className={`${baseCellClass} text-right bg-green-100/40 font-semibold`}>{formatNumber(it.final_amount)}</td>
                <td className={`${baseCellClass} text-right bg-emerald-50/30`}>{formatNumber(it.consumable_material_rate)}</td>
                <td className={`${baseCellClass} text-right bg-emerald-50/30`}>{formatNumber(it.consumable_material_amount)}</td>
                <td className={`${baseCellClass} text-right bg-emerald-50/30`}>{formatNumber(it.bulk_material_rate)}</td>
                <td className={`${baseCellClass} text-right bg-emerald-50/30`}>{formatNumber(it.bulk_material_amount)}</td>
                <td className={`${baseCellClass} text-right bg-yellow-50/30`}>{formatNumber(it.machinery_rate)}</td>
                <td className={`${baseCellClass} text-right bg-yellow-50/30`}>{formatNumber(it.machinery_amount)}</td>
                <td className={`${baseCellClass} text-right bg-yellow-50/30`}>{formatNumber(it.fuel_rate)}</td>
                <td className={`${baseCellClass} text-right bg-yellow-50/30`}>{formatNumber(it.fuel_amount)}</td>
                <td className={`${baseCellClass} text-right bg-purple-50/30`}>{formatNumber(it.contractor_rate)}</td>
                <td className={`${baseCellClass} text-right bg-purple-50/30`}>{formatNumber(it.contractor_amount)}</td>
                <td className={`${baseCellClass} text-right bg-purple-50/30`}>{formatNumber(it.nmr_rate)}</td>
                <td className={`${baseCellClass} text-right bg-purple-50/30`}>{formatNumber(it.nmr_amount)}</td>
                <td className={`${baseCellClass} text-right bg-rose-50/40 text-red-700`}>{formatNumber(it.variance_amount)}</td>
                <td className={`${baseCellClass} text-right bg-rose-50/40 text-red-700`}>{formatNumber(it.variance_percentage)}%</td>
              </tr>
            ))}

            {/* Footer totals */}
            <tr className="bg-gray-200 font-semibold z-30">
              <td 
                colSpan={5} 
                className={`sticky left-0 bg-gray-200 border-r border-b border-gray-300 text-right px-2 py-2 ${lastStickyShadow} z-30`}
              >
                Totals
              </td>
              
              <td className={`${baseCellClass} bg-blue-50`}></td>
              <td className={`${baseCellClass} text-right bg-blue-50`}>{formatNumber(boq.boq_total_amount)}</td>
              <td className={`${baseCellClass} bg-green-100`}></td>
              <td className={`${baseCellClass} text-right bg-green-100`}>{formatNumber(boq.zero_cost_total_amount)}</td>
              <td className={`${baseCellClass} bg-emerald-50`}></td>
              <td className={`${baseCellClass} text-right bg-emerald-50`}>{formatNumber(boq.consumable_material)}</td>
              <td className={`${baseCellClass} bg-emerald-50`}></td>
              <td className={`${baseCellClass} text-right bg-emerald-50`}>{formatNumber(boq.bulk_material)}</td>
              <td className={`${baseCellClass} bg-yellow-50`}></td>
              <td className={`${baseCellClass} text-right bg-yellow-50`}>{formatNumber(boq.machinery)}</td>
              <td className={`${baseCellClass} bg-yellow-50`}></td>
              <td className={`${baseCellClass} text-right bg-yellow-50`}>{formatNumber(boq.fuel)}</td>
              <td className={`${baseCellClass} bg-purple-50`}></td>
              <td className={`${baseCellClass} text-right bg-purple-50`}>{formatNumber(boq.contractor)}</td>
              <td className={`${baseCellClass} bg-purple-50`}></td>
              <td className={`${baseCellClass} text-right bg-purple-50`}>{formatNumber(boq.nmr)}</td>
              <td className={`${baseCellClass} bg-rose-50 text-right`}>{formatNumber(boq.variance_amount)}</td>
              <td className={`${baseCellClass} bg-rose-50 text-right`}>{formatNumber(boq.variance_percentage)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BOQSplit;