import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { toast } from "react-toastify";
import axios from "axios";
import { API } from "../../../constant";

const initialMaterial = { materialName: "", quantity: "", unit: "" };
const initialVendor = { vendorId: "", vendorName: "" };

const CreateEnquiry = ({ onclose, onSuccess }) => {
  const [entryType, setEntryType] = useState(""); 

  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [projectVendors, setProjectVendors] = useState([]); 

  // Selected values
  const [projectId, setProjectId] = useState("");
  const [requestId, setRequestId] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [siteName, setSiteName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [siteIncharge, setSiteIncharge] = useState("");
  const [requiredByDate, setRequiredByDate] = useState("");

  const [materials, setMaterials] = useState([{ ...initialMaterial }]);
  const [selectedVendors, setSelectedVendors] = useState([{ ...initialVendor }]);

  const isReadOnly = entryType === "existing" && requestId;

  /** LOAD PROJECTS */
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await axios.get(`${API}/tender/all`);
      setProjects(res.data?.data || []);
    } catch {
      toast.error("Failed to load projects");
    }
  };

  /** FETCH VENDORS FOR PROJECT (FIXED) */
  const loadVendors = async (id) => {
    try {
      const res = await axios.get(`${API}/permittedvendor/getvendor/${id}`);
      // FIX: Access the nested 'permitted_vendors' array
      setProjectVendors(res.data?.data?.permitted_vendors || []);
    } catch (err) {
      console.error("Failed to load vendors", err);
      setProjectVendors([]);
    }
  };

  /** RESET FORM FIELDS */
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSiteName("");
    setSiteLocation("");
    setSiteIncharge("");
    setRequiredByDate("");
    setMaterials([{ ...initialMaterial }]);
    setSelectedVendors([{ ...initialVendor }]);
  };

  /** PROJECT SELECTION */
  const handleProjectSelect = async (id) => {
    setProjectId(id);
    setRequestId("");
    setRequests([]);
    resetForm();
    
    if (id) {
        loadVendors(id);
    }

    if (entryType !== "existing") return;

    try {
      const res = await axios.get(
        `${API}/purchaseorderrequest/api/getbyId/${id}`
      );

      const pendingRequests = (res.data?.data || []).filter(
        (r) => r.status === "Request Raised"
      );

      setRequests(pendingRequests);
    } catch {
      toast.error("No Purchase Requests Found");
    }
  };

  /** REQUEST AUTO FILL */
  const handleRequestSelect = async (id) => {
    setRequestId(id);

    try {
      const res = await axios.get(
        `${API}/purchaseorderrequest/api/getdetailbyId/${projectId}/${id}`
      );

      const d = res.data?.data || {};

      setTitle(d.title || "");
      setDescription(d.description || "");
      setSiteName(d.siteDetails?.siteName || "");
      setSiteLocation(d.siteDetails?.location || "");
      setSiteIncharge(d.siteDetails?.siteIncharge || "");
      setRequiredByDate(d.requiredByDate?.substring(0, 10) || "");
      setMaterials(d.materialsRequired || [{ ...initialMaterial }]);
    } catch {
      toast.error("Failed to load request details");
    }
  };

  /** MATERIAL ROW HANDLERS */
  const handleAddRow = () =>
    setMaterials([...materials, { ...initialMaterial }]);

  const handleDeleteRow = (index) => {
    if (materials.length === 1) return;
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (i, field, value) => {
    const updated = [...materials];
    updated[i][field] = value;
    setMaterials(updated);
  };

  /** VENDOR ROW HANDLERS */
  const handleAddVendor = () => 
    setSelectedVendors([...selectedVendors, { ...initialVendor }]);

  const handleDeleteVendor = (index) => {
    if (selectedVendors.length === 1) return;
    setSelectedVendors(selectedVendors.filter((_, i) => i !== index));
  };

  const handleVendorChange = (i, field, value) => {
    const updated = [...selectedVendors];
    updated[i][field] = value;

    // Auto-fill Logic
    if (field === "vendorId") {
        const vendor = projectVendors.find(v => v.vendor_id === value);
        if (vendor) updated[i].vendorName = vendor.vendor_name;
    } else if (field === "vendorName") {
        const vendor = projectVendors.find(v => v.vendor_name === value);
        if (vendor) updated[i].vendorId = vendor.vendor_id;
    }

    setSelectedVendors(updated);
  };

  /** SUBMIT */
  const handleSubmit = async () => {
    if (!projectId) return toast.warning("Project is required");

    const validVendors = selectedVendors.filter(v => v.vendorId && v.vendorName);
    if (validVendors.length === 0) return toast.warning("At least one valid vendor is required");

    const payload = {
      projectId,
      title,
      description,
      siteDetails: {
        siteName,
        location: siteLocation,
        siteIncharge,
      },
      requiredByDate,
      materialsRequired: materials,
      status: "Quotation Requested",
      permittedVendor: validVendors.map(v => ({
          vendorId: v.vendorId,
          vendorName: v.vendorName
      }))
    };

    try {
      if (entryType === "existing") {
        if (!requestId)
          return toast.warning("Select Request ID for existing entry");

        await axios.put(
          `${API}/purchaseorderrequest/api/updateStatus/${requestId}`,
          { 
              status: "Quotation Requested",
              permittedVendor: payload.permittedVendor 
          }
        );
      } else {
        await axios.post(`${API}/purchaseorderrequest/api/create`, payload);
      }

      toast.success("Enquiry Sent Successfully!");
      if (onSuccess) onSuccess();
      onclose();
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-xl shadow-2xl relative max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Create Enquiry
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Send enquiry for materials to vendors
            </p>
          </div>
          <button
            onClick={onclose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* TOP CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Entry Type</label>
              <select
                value={entryType}
                onChange={(e) => {
                  setEntryType(e.target.value);
                  setProjectId("");
                  setRequestId("");
                  resetForm();
                  setRequests([]);
                }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="" className="dark:bg-gray-800">Select</option>
                <option value="manual" className="dark:bg-gray-800">Manual Entry</option>
                <option value="existing" className="dark:bg-gray-800">Existing Request</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Project</label>
              <select
                value={projectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                disabled={isReadOnly}
                className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <option value="" className="dark:bg-gray-800">Select Project</option>
                {projects.map((p, i) => (
                  <option key={i} value={p.tender_id} className="dark:bg-gray-800">
                    {p.tender_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional Request ID */}
            {entryType === "existing" && projectId && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Request ID</label>
                <select
                  value={requestId}
                  onChange={(e) => handleRequestSelect(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" className="dark:bg-gray-800">Select Request</option>
                  {requests.map((r, i) => (
                    <option key={i} value={r.requestId} className="dark:bg-gray-800">
                      {r.requestId}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <hr className="border-gray-200 dark:border-gray-800" />

          {/* SELECT VENDORS SECTION */}
          <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span> Select Vendors
                </h3>
                <button onClick={handleAddVendor} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    + Add Vendor
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-3 w-12 text-center">#</th>
                            <th className="px-4 py-3">Vendor ID</th>
                            <th className="px-4 py-3">Vendor Name</th>
                            <th className="px-4 py-3 w-20 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {selectedVendors.map((row, i) => (
                            <tr key={i} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 text-center text-gray-400">{i + 1}</td>
                                
                                {/* Vendor ID Select */}
                                <td className="px-4 py-3">
                                    <select
                                        value={row.vendorId}
                                        onChange={(e) => handleVendorChange(i, "vendorId", e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-gray-200 py-1 transition-colors"
                                    >
                                        <option value="" className="dark:bg-gray-800">Select ID</option>
                                        {/* SAFE CHECK: Check if projectVendors is array */}
                                        {Array.isArray(projectVendors) && projectVendors.map((v, idx) => (
                                            <option key={v.vendor_id || idx} value={v.vendor_id} className="dark:bg-gray-800">{v.vendor_id}</option>
                                        ))}
                                    </select>
                                </td>

                                {/* Vendor Name Select */}
                                <td className="px-4 py-3">
                                    <select
                                        value={row.vendorName}
                                        onChange={(e) => handleVendorChange(i, "vendorName", e.target.value)}
                                        className="w-full bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-gray-200 py-1 transition-colors"
                                    >
                                        <option value="" className="dark:bg-gray-800">Select Name</option>
                                        {/* SAFE CHECK: Check if projectVendors is array */}
                                        {Array.isArray(projectVendors) && projectVendors.map((v, idx) => (
                                            <option key={v.vendor_id || idx} value={v.vendor_name} className="dark:bg-gray-800">{v.vendor_name}</option>
                                        ))}
                                    </select>
                                </td>

                                <td className="px-4 py-3 text-center">
                                    {selectedVendors.length > 1 && (
                                        <button onClick={() => handleDeleteVendor(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <IoClose size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-800" />

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
              <input
                value={title}
                readOnly={isReadOnly}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none ${isReadOnly ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
              <textarea
                value={description}
                readOnly={isReadOnly}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none ${isReadOnly ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}`}
                rows={2}
              />
            </div>
          </div>

          {/* SITE DETAILS SECTION */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span> Site Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Site Name</label>
                <input
                  value={siteName}
                  readOnly={isReadOnly}
                  onChange={(e) => setSiteName(e.target.value)}
                  className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none ${isReadOnly ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Location</label>
                <input
                  value={siteLocation}
                  readOnly={isReadOnly}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none ${isReadOnly ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Site Incharge</label>
                <input
                  value={siteIncharge}
                  readOnly={isReadOnly}
                  onChange={(e) => setSiteIncharge(e.target.value)}
                  className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none ${isReadOnly ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Required By</label>
                <input
                  type="date"
                  value={requiredByDate}
                  readOnly={isReadOnly}
                  onChange={(e) => setRequiredByDate(e.target.value)}
                  className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none ${isReadOnly ? 'cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''}`}
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-800" />

          {/* MATERIALS TABLE */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span> Materials Required
              </h3>
              
              {!isReadOnly && (
                <button
                  onClick={handleAddRow}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  + Add Item
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3 min-w-[200px]">Material Name</th>
                    <th className="px-4 py-3 w-32">Qty</th>
                    <th className="px-4 py-3 w-24">Unit</th>
                    {!isReadOnly && <th className="px-4 py-3 w-20 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {materials.map((row, i) => (
                    <tr key={i} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-400">{i + 1}</td>
                      
                      <td className="px-4 py-3">
                        {isReadOnly ? (
                          <span className="text-gray-800 dark:text-gray-200">{row.materialName}</span>
                        ) : (
                          <input
                            value={row.materialName}
                            onChange={(e) => handleMaterialChange(i, "materialName", e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-gray-200 py-1 transition-colors"
                            placeholder="Enter material name"
                          />
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isReadOnly ? (
                          <span className="text-gray-800 dark:text-gray-200">{row.quantity}</span>
                        ) : (
                          <input
                            value={row.quantity}
                            onChange={(e) => handleMaterialChange(i, "quantity", e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-gray-200 py-1 transition-colors"
                            placeholder="0.00"
                          />
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isReadOnly ? (
                          <span className="text-gray-800 dark:text-gray-200">{row.unit}</span>
                        ) : (
                          <input
                            value={row.unit}
                            onChange={(e) => handleMaterialChange(i, "unit", e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-gray-200 py-1 transition-colors"
                            placeholder="Unit"
                          />
                        )}
                      </td>

                      {!isReadOnly && (
                        <td className="px-4 py-3 text-center">
                          {materials.length > 1 && (
                            <button
                              onClick={() => handleDeleteRow(i)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove Row"
                            >
                              <IoClose size={18} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onclose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-md transition-all"
            >
              Save Enquiry
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateEnquiry;