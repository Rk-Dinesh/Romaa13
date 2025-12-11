import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../../../../../constant";
import { useParams } from "react-router-dom";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const tenderProcessDataTemplate = [
  { label: "Site Inspection", key: "site_investigation" },
  { label: "Pre bid Meeting", key: "pre_bid_meeting" },
  { label: "Bid Submit", key: "bid_submission" },
  { label: "Technical Bid Opening", key: "technical_bid_opening" },
  { label: "Commercial Bid Opening", key: "commercial_bid_opening" },
  { label: "Negotiations", key: "negotiation" },
  { label: "Work Order", key: "work_order" },
  { label: "Agreement", key: "agreement" },
];

// Default schema for regular steps
const getStepSchema = () =>
  yup.object().shape({
    notes: yup.string().required("Notes are required"),
    date: yup.string().required("Date is required"),
    time: yup.string().required("Time is required"),
  });

// Schema for Work Order step
const getWorkOrderSchema = () =>
  yup.object().shape({
    workOrder_id: yup.string().required("Work Order ID is required"),
    workOrder_issued_date: yup.string().required("Work Order Issued Date is required"),
  });

// Schema for Agreement step
const getAgreementSchema = () =>
  yup.object().shape({
    agreement_id: yup.string().required("Agreement ID is required"),
    agreement_value: yup.number().required("Agreement Value is required"),
    agreement_issued_date: yup.string().required("Agreement Issued Date is required"),
  });

const TenderProcessStepper = ({ onUploadSuccess }) => {
  const { tender_id } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processData, setProcessData] = useState([]);
  const [file, setFile] = useState(null);

  // Dynamic schema based on current step
  const getSchema = () => {
    const step = processData[currentStep];
    if (step?.key === "work_order") return getWorkOrderSchema();
    if (step?.key === "agreement") return getAgreementSchema();
    return getStepSchema();
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(getSchema()),
    mode: "onBlur",
  });

  useEffect(() => {
    const fetchSavedProgress = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/tender/process/${tender_id}`);
        const savedData = res.data?.processData || [];

        const initialData = tenderProcessDataTemplate.map((step) => {
          const savedStep = savedData.find((d) => d.key === step.key);
          return {
            ...step,
            notes: savedStep?.notes || "",
            date: savedStep?.date || "",
            time: savedStep?.time || "",
            completed: savedStep?.completed === true,
          };
        });

        const firstUncompletedIndex = initialData.findIndex(
          (step) => step.completed !== true
        );
        const startStep =
          firstUncompletedIndex === -1
            ? initialData.length - 1
            : firstUncompletedIndex;

        setProcessData(initialData);
        setCurrentStep(startStep);

        reset({
          notes: initialData[startStep].notes,
          date: initialData[startStep].date,
          time: initialData[startStep].time,
        });
        setFile(null);
      } catch (err) {
        console.error("Error fetching tender process data:", err);
        const freshData = tenderProcessDataTemplate.map((step) => ({
          ...step,
          notes: "",
          date: "",
          time: "",
          completed: false,
        }));
        setProcessData(freshData);
        setCurrentStep(0);
        reset({
          notes: "",
          date: "",
          time: "",
        });
        setFile(null);
      } finally {
        setLoading(false);
      }
    };

    if (tender_id) fetchSavedProgress();
  }, [tender_id, reset]);

  useEffect(() => {
    if (processData.length === 0) return;
    const step = processData[currentStep];
    reset({
      notes: step.notes,
      date: step.date,
      time: step.time,
    });
    setFile(null);
  }, [currentStep, processData, reset]);

 const onNext = async (data) => {
  const step = processData[currentStep];
  setLoading(true);
  try {
    const defaultDate = new Date().toISOString().split("T")[0];
    const defaultTime = new Date().toTimeString().slice(0, 5);

    let payload = {
      tender_id,
      step_key: step.key,
      notes: data.notes || "passed",
      date: data.date || defaultDate,
      time: data.time || defaultTime,
    };

    if (step.key === "work_order") {
      payload = {
        ...payload,
        workOrder_id: data.workOrder_id,
        workOrder_issued_date: data.workOrder_issued_date,
      };
      // Only send file with step data API, not with update API
      if (file) {
        const formData = new FormData();
        formData.append("tender_id", tender_id);
        formData.append("step_key", step.key);
        formData.append("notes", payload.notes);
        formData.append("date", payload.date);
        formData.append("time", payload.time);
        formData.append("file", file);
        await axios.post(`${API}/tender/processaws/step`, formData);
      } else {
        await axios.post(`${API}/tender/process/step`, payload);
      }

     const updateFormData ={
      workOrder_id: data.workOrder_id,
      workOrder_issued_date: data.workOrder_issued_date,
     }
      await axios.put(`${API}/tender/update-workorder/${tender_id}`, updateFormData);
    } else if (step.key === "agreement") {
      payload = {
        ...payload,
        agreement_id: data.agreement_id,
        agreement_value: data.agreement_value,
        agreement_issued_date: data.agreement_issued_date,
      };
      // Only send file with step data API, not with update API
      if (file) {
        const formData = new FormData();
        formData.append("tender_id", tender_id);
        formData.append("step_key", step.key);
        formData.append("notes", payload.notes);
        formData.append("date", payload.date);
        formData.append("time", payload.time);
        formData.append("file", file);
        await axios.post(`${API}/tender/processaws/step`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${API}/tender/process/step`, payload);
      }

      // Send update API call without file
      const updateFormData ={
        agreement_id: data.agreement_id,
        agreement_value: data.agreement_value,
        agreement_issued_date: data.agreement_issued_date,
      }
      await axios.put(`${API}/tender/update-agreement/${tender_id}`, updateFormData);
    } else {
      // For regular steps, send file only if present
      if (file) {
        const formData = new FormData();
        formData.append("tender_id", tender_id);
        formData.append("step_key", step.key);
        formData.append("notes", payload.notes);
        formData.append("date", payload.date);
        formData.append("time", payload.time);
        formData.append("file", file);
        await axios.post(`${API}/tender/processaws/step`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${API}/tender/process/step`, payload);
      }
    }

    setProcessData((prev) =>
      prev.map((s, i) =>
        i === currentStep
          ? {
              ...s,
              notes: payload.notes,
              date: payload.date,
              time: payload.time,
              completed: true,
            }
          : s
      )
    );
    if (onUploadSuccess) onUploadSuccess();

    if (currentStep < processData.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      alert("Tender process completed!");
    }
  } catch (err) {
    console.error("Error saving step data:", err);
    alert("Failed to save step data. Please try again.");
  } finally {
    setLoading(false);
  }
};


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;
    setFile(selectedFile);
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-6">
        Loading Tender Process...
      </div>
    );
  }

  const step = processData[currentStep];
  const allCompleted = processData.every((step) => step.completed);

  return (
    <div className="max-w-3xl mx-auto p-3 rounded-lg select-none">
      <p className="font-semibold text-lg mb-4">Tender Process Overview</p>
      {/* Stepper Header */}
      <div className="flex flex-wrap justify-between mb-10 gap-4 max-w-4xl mx-auto">
        {processData.map((s, i) => {
          const isCurrent = i === currentStep;
          const isCompleted = s.completed;
          const isUpcoming = !isCurrent && !isCompleted;

          return (
            <div key={s.key} className="flex-1 min-w-[80px] relative">
              <div
                className={`
                  w-10 h-10 mx-auto rounded-full flex items-center justify-center font-semibold text-sm
                  transition-colors duration-300 select-none cursor-default
                  ${isCurrent ? "bg-blue-600 text-white dark:bg-blue-500" : ""}
                  ${isCompleted ? "bg-green-500 text-white dark:bg-green-400" : ""}
                  ${isUpcoming ? "bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400" : ""}
                `}
                title={s.label}
              >
                {i + 1}
              </div>
              {i !== processData.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`
                    absolute top-5 right-0 w-full h-1 bg-gray-300 dark:bg-gray-700
                    ${isCompleted ? "bg-green-500 dark:bg-green-400" : ""}
                    transition-colors duration-300
                    left-[calc(50%+20px)]
                    right-[-50%]
                    -z-10
                    hidden sm:block
                  `}
                  style={{
                    width: "calc(100% - 40px)",
                    height: "2px",
                  }}
                />
              )}
              <p
                className={`
                  text-center mt-2 text-xs font-semibold truncate select-none transition-colors duration-300
                  ${isCurrent ? "text-blue-700 dark:text-blue-400" : ""}
                  ${isCompleted ? "text-green-700 dark:text-green-300" : ""}
                  ${isUpcoming ? "text-gray-500 dark:text-gray-400" : ""}
                `}
                title={s.label}
              >
                {s.label}
              </p>
            </div>
          );
        })}
      </div>

      {!allCompleted ? (
        <form onSubmit={handleSubmit(onNext)} className="space-y-6 text-gray-800 dark:text-gray-200">
          <h3 className="font-semibold text-xl dark:text-white">{step.label}</h3>

          {/* Conditional rendering for Work Order and Agreement steps */}
          {step.key === "work_order" ? (
            <>
              <div>
                <label htmlFor="workOrder_id" className="block font-medium mb-1">
                  Work Order ID
                </label>
                <input
                  id="workOrder_id"
                  {...register("workOrder_id")}
                  className={`w-full rounded-md border px-3 py-2 focus:outline-none dark:bg-gray-800 dark:text-white ${
                    errors.workOrder_id ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.workOrder_id && (
                  <p className="mt-1 text-red-600 text-sm">{errors.workOrder_id.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="workOrder_issued_date" className="block font-medium mb-1">
                  Work Order Issued Date
                </label>
                <input
                  id="workOrder_issued_date"
                  type="date"
                  {...register("workOrder_issued_date")}
                  className={`w-full rounded-md border px-3 py-2 focus:outline-none dark:bg-gray-800 dark:text-white ${
                    errors.workOrder_issued_date ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.workOrder_issued_date && (
                  <p className="mt-1 text-red-600 text-sm">{errors.workOrder_issued_date.message}</p>
                )}
              </div>
            </>
          ) : step.key === "agreement" ? (
            <>
              <div>
                <label htmlFor="agreement_id" className="block font-medium mb-1">
                  Agreement ID
                </label>
                <input
                  id="agreement_id"
                  {...register("agreement_id")}
                  className={`w-full rounded-md border px-3 py-2 focus:outline-none dark:bg-gray-800 dark:text-white ${
                    errors.agreement_id ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.agreement_id && (
                  <p className="mt-1 text-red-600 text-sm">{errors.agreement_id.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="agreement_value" className="block font-medium mb-1">
                  Agreement Value
                </label>
                <input
                  id="agreement_value"
                  type="number"
                  {...register("agreement_value")}
                  className={`w-full rounded-md border px-3 py-2 focus:outline-none dark:bg-gray-800 dark:text-white ${
                    errors.agreement_value ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.agreement_value && (
                  <p className="mt-1 text-red-600 text-sm">{errors.agreement_value.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="agreement_issued_date" className="block font-medium mb-1">
                  Agreement Issued Date
                </label>
                <input
                  id="agreement_issued_date"
                  type="date"
                  {...register("agreement_issued_date")}
                  className={`w-full rounded-md border px-3 py-2 focus:outline-none dark:bg-gray-800 dark:text-white ${
                    errors.agreement_issued_date ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.agreement_issued_date && (
                  <p className="mt-1 text-red-600 text-sm">{errors.agreement_issued_date.message}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="notes" className="block font-medium mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  rows={4}
                  className={`w-full rounded-md border px-3 py-2 resize-none focus:outline-none dark:bg-gray-800 dark:text-white ${
                    errors.notes ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter notes for this step"
                />
                {errors.notes && (
                  <p className="mt-1 text-red-600 text-sm">{errors.notes.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block font-medium mb-1">
                    Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    {...register("date")}
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none dark:bg-gray-800 dark:text-white ${
                      errors.date ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-red-600 text-sm">{errors.date.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="time" className="block font-medium mb-1">
                    Time
                  </label>
                  <input
                    id="time"
                    type="time"
                    {...register("time")}
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none dark:bg-gray-800 dark:text-white ${
                      errors.time ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.time && (
                    <p className="mt-1 text-red-600 text-sm">{errors.time.message}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="file" className="block font-medium mb-1">
              Upload File (optional)
            </label>
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              className="w-full text-gray-700 dark:text-gray-300"
            />
            {file && (
              <p className="mt-1 text-xs dark:text-gray-400 truncate" title={file.name}>
                {file.name}
              </p>
            )}
          </div>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep < processData.length - 1 ? "Next" : "Finish"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-center text-green-600 dark:text-green-400 font-semibold">
          All tender process steps are completed.
        </p>
      )}
    </div>
  );
};

export default TenderProcessStepper;
