import Table from "../../../components/Table";
import axios from "axios";
import { API } from "../../../constant";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const trackingColumns = [
 
  { label: "Note", key: "security_deposit_note" },
  {
    label: "Amount Collected",
    key: "amount_collected",
    formatter: (value) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(value || 0),
  },
  {
    label: "Pending Amount",
    key: "amount_pending",
    formatter: (value) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(value || 0),
  },
  // { label: "Collected By", key: "amount_collected_by" },
  {
    label: "Collected Date",
    key: "amount_collected_date",
    render: (item) =>
      item.amount_collected_date
        ? new Date(item.amount_collected_date).toLocaleDateString("en-GB")
        : "-",
  },
  { label: "Collected Time", key: "amount_collected_time" },
];

const SecurityDepositTrackingTable = () => {
  const { tender_id } = useParams();
   const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTracking = async () => {
    if (!tender_id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/tender/securitydeposittracking/${tender_id}`);
      // backend: res.json({ securityDepositTracking: [...] })
      setTracking(res.data.securityDepositTracking || []);
    } catch (e) {
      console.error("Failed to fetch Security Deposit tracking", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [tender_id]);

  return (
    <Table
      title="Security Deposit Tracking"
      subtitle={tender_id}
      pagetitle="Security Deposit Collection History"
      loading={loading}
      endpoint={tracking}
      columns={trackingColumns}
    />
  );
};

export default SecurityDepositTrackingTable;
