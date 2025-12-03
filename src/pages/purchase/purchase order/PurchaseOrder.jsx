
import Filters from "../../../components/Filters";
import Table from "../../../components/Table";

import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../../../constant";


// const Columns = [

//   { label: "Project Name", key: "projectname" },
//     { label: "Project ID", key: "projectid" },
//   { label: "location", key: "location" },
//     { label: "Supplier ID", key: "supplierid" },
//   { label: "Date", key: "date" },
//   { label: "Project Value", key: "projectvalue" },
//   { label: "Due Date", key: "duedate" },
// ];

const PurchaseOrder = () => {
  const Columns = [
    { label: "Request ID", key: "requestId" },
    { label: "Date", key: "requestDate" },
    { label: "Project", key: "projectName" },
    { label: "Date of Requirements", key: "requiredOn" },
    { label: "Requested by", key: "siteIncharge" },
  ];
  const [data, setData] = useState([]);
   const fetchRequests = async () => {
    try {
      const tenderId = localStorage.getItem("tenderId");

      const res = await axios.get(
        `${API}/purchaseorderrequest/api/getQuotationApproved`
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
