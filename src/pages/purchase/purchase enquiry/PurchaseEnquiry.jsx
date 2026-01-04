import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../../../constant";
import Table from "../../../components/Table";
import Filters from "../../../components/Filters";
import CreateEnquiry from "./CreateEnquiry";
import { IoReorderThree } from "react-icons/io5";


const PurchaseEnquiry = () => {
  const [data, setData] = useState([]);

  const Columns = [
    { label: "Request ID", key: "requestId" },
    { label: "Date", key: "requestDate" },
    { label: "Project", key: "projectName" },
    { label: "Date of Requirements", key: "requiredByDate" },
    { label: "Requested by", key: "siteIncharge" },
    { label: "Status", key: "status" },
  ];

  const fetchRequests = async () => {
    try {
    

      const res = await axios.get(
        `${API}/purchaseorderrequest/api/getbyIdQuotationRequested`
      );


      const formatted = res.data?.data?.map((item) => ({
        requestId: item.requestId,
        requestDate: item.requestDate
          ? new Date(item.requestDate).toLocaleDateString("en-GB")
          : "-",

        projectName: item.projectId,    
        requiredByDate: item.requiredByDate
          ? new Date(item.requiredByDate).toLocaleDateString("en-GB")
          : "-",

        siteIncharge: item.siteDetails?.siteIncharge || "N/A",
        status: item.status,
      }));

      setData(formatted || []);
    } catch (err) {
      console.error("Error fetching PR list", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <Table
      title="Purchase Management"
      subtitle="Purchase Request"
      pagetitle="Purchase Request"
      AddModal={CreateEnquiry}
      addButtonLabel="Create Enquiry"
      addButtonIcon={<IoReorderThree size={22} />}
      onSuccess={fetchRequests}
      endpoint={data}
      columns={Columns}
      routepoint="viewpurchaseenquire"
      FilterModal={Filters}
      id2Key="requestId"
    />
  );
};

export default PurchaseEnquiry;
