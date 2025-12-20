import axios from "axios";
import React, { useEffect, useState } from "react";
import { API } from "../../../../../../constant";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../../../../../components/Button";
import { GiArrowFlights } from "react-icons/gi";


const Summary = () => {
  const { tender_id } = useParams();
  const [summaryData, setSummaryData] = useState({});
  const [tenderDetails, setTenderDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [freezed, setfreezed] = useState(false);

  const fetchSummary = async () => {
    if (!tender_id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/rateanalysis/getsummary/${tender_id}`);
      setSummaryData(res.data.data.summary);
      setTenderDetails(res.data.data.tenderdetails);
      setfreezed(res.data.data.freeze);
    } catch (err) {
      console.error(err);
      toast.error("Error fetching summary data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [tender_id]);

  const fmt = (v) =>
    v !== undefined && v !== null
      ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : "";

  const handlefreeze = async () => {
    try {
      await axios.put(`${API}/rateanalysis/freeze/${tender_id}`);
      toast.success("Zero Cost Estimate frozen successfully");
      setfreezed(true)
    } catch (error) {
      console.error(error);
      toast.error("Failed to freeze Zero Cost Estimate");
    }
  };
  return (
    <div className="grid gap-4">
      {/* Header block */}
      <div className="dark:bg-layout-dark bg-white p-4 rounded-lg space-y-2 text-sm">
        <p className="font-semibold">Zero Cost Estimate - Summary</p>
        <div className="grid grid-cols-12 gap-1 items-center">
           <p className="col-span-4 font-medium">Tender Name</p>
          <p className="col-span-8 text-xs opacity-50">
            {tenderDetails.tender_name}
          </p>
          <p className="col-span-4 font-medium">Project</p>
          <p className="col-span-8 text-xs opacity-50">
            {tenderDetails.tender_project_name}
          </p>
          <p className="col-span-4 font-medium">Client</p>
          <p className="col-span-8 text-xs opacity-50">
            {tenderDetails.client_name}
          </p>
          <p className="col-span-4 font-medium">Location</p>
          <p className="col-span-8 text-xs opacity-50">
            {tenderDetails.tender_location?.city},{" "}
            {tenderDetails.tender_location?.state}
          </p>
        </div>
      </div>

      <Button
        button_icon={<GiArrowFlights size={18} />}
        button_name={freezed ? "Freezed" : "Freeze"}
        bgColor="dark:bg-layout-dark bg-white"
        textColor="dark:text-white text-darkest-blue"
        onClick={freezed ? null : handlefreeze}
        disabled={freezed}
      />

      {/* Main summary table */}
      <div className="bg-white dark:bg-layout-dark rounded-lg shadow border border-gray-200 dark:border-border-dark-grey overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-border-dark-grey">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-white">
            Zero Cost Estimate Summary
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-border-dark-grey">
              <tr>
                {/* wider + more padding */}
                <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-white w-20">
                  Sl. No.
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-white">
                  Description
                </th>
                <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-white w-44">
                  Amount (in Rs)
                </th>
              </tr>
            </thead>

            <tbody>
              {/* 1 COSTS */}
              <tr className="border-b border-gray-200 dark:border-border-dark-grey bg-purple-100/40 dark:bg-gray-800">
                <td className="px-4 py-2 font-semibold">1</td>
                <td className="px-4 py-2 font-semibold">COSTS</td>
                <td className="px-4 py-2 text-right" />
              </tr>
              <tr className="border-b border-gray-100 dark:border-border-dark-grey">
                <td className="px-4 py-2 pl-8">a)</td>
                <td className="px-4 py-2">Direct Cost</td>
                <td className="px-4 py-2 text-right">
                  ₹{fmt(summaryData.zero_cost_total_amount)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-border-dark-grey">
                <td className="px-4 py-2 pl-8">b)</td>
                <td className="px-4 py-2">Indirect Cost (Site Overhead)</td>
                <td className="px-4 py-2 text-right">
                  ₹{fmt(summaryData.siteoverhead_total_amount)}
                </td>
              </tr>

              {/* 2 TOTAL COST */}
              <tr className="border-b border-gray-200 dark:border-border-dark-grey bg-purple-100/60 dark:bg-gray-800">
                <td className="px-4 py-2 font-semibold">2</td>
                <td className="px-4 py-2 font-semibold">TOTAL COST (DC + IDC)</td>
                <td className="px-4 py-2 text-right font-semibold">
                  ₹{fmt(summaryData.total_cost)}
                </td>
              </tr>

              {/* 3 CONTRACT VALUE / SALES (BOQ Total) */}
              <tr className="border-b border-gray-200 dark:border-border-dark-grey bg-purple-100/60 dark:bg-gray-800">
                <td className="px-4 py-2 font-semibold">3</td>
                <td className="px-4 py-2 font-semibold">
                  CONTRACT VALUE (SALES) – BOQ Total Amount
                </td>
                <td className="px-4 py-2 text-right font-semibold">
                  ₹{fmt(summaryData.boq_total_amount)}
                </td>
              </tr>

              {/* 4 GROSS MARGIN */}
              <tr className="border-b border-gray-200 dark:border-border-dark-grey bg-purple-100/60 dark:bg-gray-800">
                <td className="px-4 py-2 font-semibold">4</td>
                <td className="px-4 py-2 font-semibold">GROSS MARGIN</td>
                <td className="px-4 py-2 text-right font-semibold">
                  ₹{fmt(summaryData.margin)}
                </td>
              </tr>

              {/* 5 ESCALATION BENEFITS */}
              <tr className="border-b border-gray-200 dark:border-border-dark-grey">
                <td className="px-4 py-2 font-semibold">5</td>
                <td className="px-4 py-2 font-semibold">
                  ESCALATION BENEFITS @ {summaryData.escalation_benefits_percentage}%
                </td>
                <td className="px-4 py-2 text-right font-semibold">
                  {summaryData.escalation_benefits_percentage}%
                </td>
              </tr>

              {/* 6 TOTAL MARGIN */}
              <tr className="border-b border-gray-200 dark:border-border-dark-grey bg-purple-100/60 dark:bg-gray-800">
                <td className="px-4 py-2 font-semibold">6</td>
                <td className="px-4 py-2 font-semibold">TOTAL MARGIN (4 + 5)</td>
                <td className="px-4 py-2 text-right font-semibold">
                  ₹{fmt(summaryData.total_margin)}
                </td>
              </tr>

              {/* 7 GM % */}
              <tr className="border-b border-gray-100 dark:border-border-dark-grey bg-blue-50 dark:bg-gray-800">
                <td className="px-4 py-2 font-semibold">7</td>
                <td className="px-4 py-2 font-semibold">GM %</td>
                <td className="px-4 py-2 text-right font-semibold">
                  {summaryData.grossmargin_percentage
                    ? summaryData.grossmargin_percentage.toFixed(2)
                    : "0.00"}
                  %
                </td>
              </tr>

              {/* 8 Risk & Contingency */}
              <tr className="border-b border-gray-100 dark:border-border-dark-grey">
                <td className="px-4 py-2">8</td>
                <td className="px-4 py-2">Risk &amp; Contingency</td>
                <td className="px-4 py-2 text-right">
                  {summaryData.risk_contingency ?? 0}%
                </td>
              </tr>

              {/* 9 HO Overheads */}
              <tr className="border-b border-gray-100 dark:border-border-dark-grey">
                <td className="px-4 py-2">9</td>
                <td className="px-4 py-2">HO Overheads</td>
                <td className="px-4 py-2 text-right">
                  {summaryData.ho_overheads ?? 0}%
                </td>
              </tr>

              {/* 10 PBT */}
              <tr className="border-b border-gray-200 dark:border-border-dark-grey bg-blue-50 dark:bg-gray-800">
                <td className="px-4 py-2 font-semibold">10</td>
                <td className="px-4 py-2 font-semibold">PBT</td>
                <td className="px-4 py-2 text-right font-semibold">
                  {summaryData.PBT ? summaryData.PBT.toFixed(2) : "0.00"}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="px-4 py-2 text-xs text-gray-500">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default Summary;



