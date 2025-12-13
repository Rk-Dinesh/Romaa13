import { toast } from "react-toastify";
import UploadDetailedEstimate from "./UploadDetailedEstimate";
import axios from "axios";
import { API } from "../../../../../../constant";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../../../components/Button";
import { TbFileExport } from "react-icons/tb";
import Loader from "../../../../../../components/Loader";

const BoqProjectsColumns = [
  { label: "Particulars", key: "particulars" },
  { label: "Number", key: "nos" },
  { label: "Length", key: "l" },
  { label: "Breadth", key: "b" },
  { label: "Density", key: "d_h" },
  { label: "Contents", key: "content" },
];

const NewInletDet = ({ name }) => {
  const { tender_id } = useParams();
  const [detailedEstimate, setDetailedEstimate] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedAbstract, setExpandedAbstract] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [delayedLoading, setDelayedLoading] = useState(false);

  const fetchDetailedEstimate = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API}/detailedestimate/getdatacustomhead?tender_id=${tender_id}&nametype=${name}`
      );
      setDetailedEstimate(res.data.data || []);
    } catch (err) {
      toast.error("Failed to fetch tenders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailedEstimate();
  }, [tender_id, name]);

  const toggleExpand = (abstractId) => {
    setExpandedAbstract((prev) => (prev === abstractId ? null : abstractId));
  };

    useEffect(() => {
      let timer;
  
      if (loading) {
        // Show loader immediately
        setDelayedLoading(true);
      } else {
        // Keep loader visible for minDelay ms before hiding
        timer = setTimeout(() => setDelayedLoading(false), 2000);
      }
  
      return () => clearTimeout(timer);
    }, [loading, 2000]);

  return (
    <div className="w-full">
      {delayedLoading ? (
        <Loader/>
      ) : (
        <div className="mt-1">
         <div className="flex justify-end mb-2">
           <Button 
              button_icon={<TbFileExport  size={22} />}
              button_name="Upload"
              bgColor="dark:bg-layout-dark bg-white"
              textColor="dark:text-white text-darkest-blue"
              onClick={() => setShowUpload(true)}
            />
         </div>

          <div className="rounded-lg bg-slate-50 dark:bg-layout-dark ">
            <div className="grid grid-cols-12 px-6 py-3 text-sm font-semibold text-black dark:text-white border-b border-slate-200 dark:border-slate-700">
              <div className="col-span-1">S.no</div>
              <div className="col-span-2">Abstract ID</div>
              <div className="col-span-3">Item Description</div>
              <div className="col-span-2 text-right">Quantity</div>
              {/* <div className="col-span-2 text-right">Rate</div> */}
            </div>

            <div className=" divide-y-2 divide-slate-200 dark:divide-slate-700 bg-white dark:bg-layout-dark">
              {detailedEstimate.map((item, index) => {
                const isOpen = expandedAbstract === item.abstract_id;
                const abs = item.abstract_details || {};
                return (
                  <div key={item.abstract_id} className="group ">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.abstract_id)}
                      className="w-full grid grid-cols-12 px-6 py-3 text-sm items-center text-slate-800 dark:text-white"
                    >
                      <div className="col-span-1">{index + 1}</div>
                      <div className="col-span-2">{item.abstract_id}</div>
                      <div className="col-span-3 text-left">
                        {abs.description || "N/A"}
                      </div>
                      <div className="col-span-2 text-right">
                        {abs.quantity || "N/A"}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        {/* <span>₹{abs.rate || "N/A"}</span> */}
                        <span
                          className={`transition-transform ${
                            isOpen ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          ▼
                        </span>
                      </div>
                    </button>

                    <div
                      className={`overflow-hidden transition-[max-height] duration-300  ${
                        isOpen ? "max-h-[500px]" : "max-h-0"
                      }`}
                    >
                      <div className="px-6 pb-4 pt-1  dark:bg-layout-dark dark:text-white ">
                        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white  ">
                          <table className="min-w-full text-xs">
                            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-white ">
                              <tr>
                                {BoqProjectsColumns.map((col) => (
                                  <th
                                    key={col.key}
                                    className="px-3 py-2 text-left font-semibold "
                                  >
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(item.breakdown || []).map((detail, idx) => (
                                <tr
                                  key={idx}
                                  className="border-t border-slate-100 hover:bg-slate-50  text-black bg-slate-200  "
                                >
                                  {BoqProjectsColumns.map((col) => (
                                    <td key={col.key} className="px-3 py-2">
                                      {detail[col.key] ?? "N/A"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {detailedEstimate.length === 0 && (
                <div className="flex px-6 py-6 text-sm text-slate-500 dark:text-white justify-center items-center">
                  No matching results found.
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}

      {showUpload && (
        <UploadDetailedEstimate
          onSuccess={fetchDetailedEstimate}
          name={name}
          onclose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};

export default NewInletDet;
