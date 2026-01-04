
import Filters from "../../../components/Filters";
import Table from "../../../components/Table";

import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../../../constant";



const PurchaseOrder = () => {
  const Columns = [
    { label: "Request ID", key: "requestId" },
    { label: "Date", key: "requestDate" },
    { label: "Project", key: "projectName" },
    { label: "Date of Requirements", key: "requiredOn" },
    { label: "Requested by", key: "siteIncharge" },
    { label: "Status", key: "status" },
  ];
  const [data, setData] = useState([]);
   const fetchRequests = async () => {
    try {


      const res = await axios.get(
        `${API}/purchaseorderrequest/api/getbyIdQuotationApproved`
      );


      const formatted = res.data?.data?.map((item) => ({
        requestId: item.requestId,
        requestDate: item.requestDate
          ? new Date(item.requestDate).toLocaleDateString("en-GB")
          : "-",

        projectName: item.projectId,
        requiredOn: item.requiredByDate
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
      subtitle="Purchase Order"
      pagetitle="Purchase Order"
      endpoint={data}
      columns={Columns}
      routepoint={"viewpurchaseorder"}
      FilterModal={Filters}

    />
  );
};

export default PurchaseOrder;
