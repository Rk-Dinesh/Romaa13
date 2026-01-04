import React, { useEffect, useState } from "react";
import romaaLogo from "../../../../assets/images/romaa logo.png";
import Title from "../../../../components/Title";
import { HiArrowsUpDown } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-toastify";
import { API } from "../../../../constant";
import { useParams } from "react-router-dom";

const VendorRequestModal = ({ onclose, vendors, requestid, tenderId }) => {
  const [rows, setRows] = useState([]);
  const [workOrderRequestId, setWorkOrderRequestId] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVendor, setSelectedVendor] = useState("");
  const [deliveryPeriod, setDeliveryPeriod] = useState("");

  // ✅ Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await axios.get(
          `${API}/workorderrequest/api/getdetailbyId/${tenderId}/${requestid}`
        );

        if (
          res.data.data.materialsRequired &&
          Array.isArray(res.data.data.materialsRequired)
        ) {
          const formatted = res.data.data.materialsRequired.map(
            (item, index) => ({
              sno: index + 1,
              work: item.materialName || "Work",
              unit: item.unit || "",
              quantity: item.quantity || 0,
              enterPrice: "",
              total: "",
              materialId: item._id,
            })
          );
          setRows(formatted);
          setWorkOrderRequestId(res.data.data._id);
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
        toast.error("Failed to load materials");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [tenderId, requestid]);

  // ✅ Update price & total dynamically
  const handlePriceChange = (index, value) => {
    const updatedRows = [...rows];
    updatedRows[index].enterPrice = value;
    updatedRows[index].total = value ? value * updatedRows[index].quantity : "";
    setRows(updatedRows);
  };

  // ✅ Submit Vendor Quotation
  const handleSubmit = async () => {
    const hasEmpty = rows.some((r) => !r.enterPrice);
    if (hasEmpty) {
      toast.warning("Please enter price for all items");
      return;
    }

    if (!selectedVendor) {
      toast.warning("Please enter a vendor ID or name before submitting");
      return;
    }

    if (!deliveryPeriod) {
      toast.warning("Please select a delivery date");
      return;
    }

    const quoteItems = rows.map((r) => ({
      materialName: r.work,
      quotedUnitRate: Number(r.enterPrice),
      unit: r.unit,
      quantity: Number(r.quantity),
      totalAmount: Number(r.total),
    }));

    try {
      const payload = {
        workOrderRequestId,
        tenderId,
        vendorId: selectedVendor.toUpperCase(),
        deliveryPeriod,
        quoteItems,
      };

      const res = await axios.post(
        `${API}/workorderrequest/api/workorder-requests/${workOrderRequestId}/vendor-quotation`,
        payload
      );


      toast.success("Your quotation submitted successfully!");

      // ✅ Reset the form fields
      setSelectedVendor("");
      setDeliveryPeriod("");
      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          enterPrice: "",
          total: "",
        }))
      );

      // ✅ Optional: refresh data if needed
      // fetchMaterials();  // Uncomment if you want to re-fetch materials after submit

      // ✅ Trigger parent callback if provided
      if (onSubmit) onSubmit(res.data);
    } catch (error) {
      console.error("Error submitting quotation:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit vendor quotation"
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-layout-dark rounded-xl w-[95%] max-w-5xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <img src={romaaLogo} alt="ROMAA" className="h-8 object-contain" />
            <h3 className="text-xl font-semibold text-darkest-blue">
              Work Order Quotation
            </h3>
          </div>

          <button
            onClick={onclose}
            className="text-gray-500 hover:text-red-500 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Vendor Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Vendor ID / Name
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v.vendor_id}>
                    {v.vendor_name} ({v.vendor_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading…</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-gray-100 dark:bg-darkest-blue">
                  <tr>
                    {[
                      "S.No",
                      "Work",
                      "Unit",
                      "Qty",
                      "Rate (₹)",
                      "Total (₹)",
                    ].map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2">{row.sno}</td>
                      <td className="text-left px-2">{row.work}</td>
                      <td>{row.unit}</td>
                      <td>{row.quantity}</td>
                      <td>
                        <input
                          type="number"
                          value={row.enterPrice}
                          onChange={(e) =>
                            handlePriceChange(index, e.target.value)
                          }
                          className="border rounded px-2 py-1 w-24 text-center"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          readOnly
                          value={row.total}
                          className="border rounded px-2 py-1 w-24 text-center "
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-layout-dark">
          <button
            onClick={onclose}
            className="px-5 py-2 border rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-darkest-blue text-white rounded-md hover:bg-blue-900"
          >
            Submit Quotation
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorRequestModal;
