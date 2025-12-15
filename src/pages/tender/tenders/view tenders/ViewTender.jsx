import React, { useEffect, useState } from "react";
import Title from "../../../../components/Title";
import { TbFileExport } from "react-icons/tb";
import { LuFileCheck } from "react-icons/lu";
import { MdArrowBackIosNew } from "react-icons/md";
import TenderOverView from "./tender overview/TenderOverView";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Plan from "./plans/Plan";
import BOQ from "./Boq/BOQ";
import ZeroCost from "./zero cost/TenderZeroCost";
import Contract from "./contract/Contract";
import Vendor from "./vendor/Vendors";
import EMD from "./Emd/EMD";
import axios from "axios";
import { API } from "../../../../constant";
import Penalities from "./Penalties/Penalities";
import Bid from "./bid/Bid";
import Loader from "../../../../components/Loader";
import TenderDetailedEstimate from "./detailed estimate/TenderDetailedEstimate";
import GeneralSetup from "./Setup/GeneralSetup";
import { toast } from "react-toastify";

const ViewTender = () => {
  const { tender_id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isApproved, setIsApproved] = useState(false);
  const [activeTabLoading, setActiveTabLoading] = useState(true);

  const tabs = [
    {
      id: "1",
      label: "Tender Overview",
      component: <TenderOverView />,
      buttons: [
        {
          label: "Approve Tender",
          icon: <LuFileCheck size={23} />,
          className: "bg-darkest-blue text-white",
        },
        {
          label: "Export",
          icon: <TbFileExport size={23} />,
          className: "bg-white text-darkest-blue",
        },
      ],
    },
    { id: "2", label: "Tender Documents", component: <Plan /> },
    { id: "3", label: "Bid", component: <Bid /> },

    // 👉 Route-based tabs
    {
      id: "4",
      label: "Detailed Estimate",
      type: "route",
      path: `/tender/tenders/${tender_id}/detailedestimate`,
    },

    { id: "5", label: "BOQ", component: <BOQ /> },

    {
      id: "6",
      label: "Zero Cost",
      type: "route",
      path: `/tender/tenders/${tender_id}/zerocost`,
    },

    { id: "7", label: "EMD", component: <EMD /> },
    { id: "8", label: "Vendor", component: <Vendor /> },
    { id: "9", label: "Contract", component: <Contract /> },
    { id: "10", label: "Penalties", component: <Penalities /> },
    { id: "11", label: "SetUp", component: <GeneralSetup /> },
  ];

  const defaultTab = tabs[0].id;
  const activeTab = searchParams.get("tab") || defaultTab;
  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const checkApprovalStatus = async () => {
    try {
      const res = await axios.get(`${API}/tender/approval-status/${tender_id}`);
      if (res.data.success) {
        setIsApproved(res.data.approved);
      }
    } catch (error) {
      toast.error("Error checking approval status");
    } finally {
      setActiveTabLoading(false);
    }
  };

  useEffect(() => {
    setActiveTabLoading(true);
    checkApprovalStatus();
  }, [tender_id]);

  const handleTabChange = (tab) => {
    if (tab.type === "route") {
      navigate(tab.path);
    } else {
      setSearchParams({ tab: tab.id });
    }
  };

  return (
    <div className="font-roboto-flex flex flex-col h-full">
      <div className="flex justify-between items-center">
        <Title
          title="Tender Management"
          sub_title="Tender"
          active_title={activeTabData?.label}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 py-2.5">
        {tabs.map((tab) => (
          <p
            key={tab.id}
            className={`px-4 py-2.5 rounded-lg text-sm cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-darkest-blue text-white"
                : "bg-layout-dark text-white"
            }`}
            onClick={() => handleTabChange(tab)}
          >
            {tab.label}
          </p>
        ))}
      </div>

      {/* Content */}
      <div className="h-full overflow-y-auto no-scrollbar">
        {activeTabLoading ? (
          <Loader />
        ) : (
          activeTabData?.type !== "route" && activeTabData?.component
        )}

        <div className="flex justify-end mt-2">
          <p
            onClick={() => navigate("..")}
            className="flex items-center gap-2 bg-darkest-blue text-white px-8 py-2 rounded cursor-pointer"
          >
            <MdArrowBackIosNew /> Back
          </p>
        </div>
      </div>
    </div>
  );
};

export default ViewTender;