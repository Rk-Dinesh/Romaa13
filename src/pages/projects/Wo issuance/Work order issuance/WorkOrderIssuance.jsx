import { useEffect, useState } from "react";
import {  WOIssuancedata } from "../../../../components/Data";
import Table from "../../../../components/Table";
import { API } from "../../../../constant";
import { toast } from "react-toastify";
import axios from "axios";



const WorkOrderIssuance = () => {
   const projectId = localStorage.getItem("tenderId");
     const [data, setData] = useState([]);
     const [loading, setLoading] = useState(true);

   const Columns = [
  { label: "RequestId", key: "requestId" },
  { label: "Title", key: "title" },
  { label: "Description", key: "description" },
  {
    label: "Date",
    key: "requestDate",
  },
  // { label: "Total", key: "total" },
  // { label: "Level", key: "level" },
];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/workorderrequest/api/getbyIdapproved/${projectId}`);
        
        if (res.data.data && Array.isArray(res.data.data)) {
          setData(res.data.data);
        } else {
          toast.error("No Work Order Requests found");
        }
      } catch (error) {
        console.error("Error fetching WorkOrderRequests:", error);
        toast.error("Failed to fetch Work Order Requests");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);


  return (
    <Table
      contentMarginTop="mt-0"
      endpoint={data}
      columns={Columns}
      routepoint={"viewwoissuance"}
      exportModal={false}
    />
  );
};

export default WorkOrderIssuance;
