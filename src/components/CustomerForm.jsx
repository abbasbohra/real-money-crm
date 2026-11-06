import { useState } from "react";
import { supabase } from "../supabaseClient";
import imageCompression from "browser-image-compression"; // Import the library

export default function CustomerForm({ onAdded, onCancel }) {
  const [form, setForm] = useState({
    loan_id: "",
    full_name: "",
    mobile_number: "",
    email: "",
    address: "",
    loan_amount: "",
    bank_partner: "",
    status: "pending",
  });
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check if the file is an image (JPG, PNG)
    if (selectedFile.type.startsWith("image/")) {
      try {
        // Compression options: Max size 1MB, max width/height 1920px
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };

        // Show a quick alert so the user knows it's compressing
        console.log(
          `Original size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        );

        const compressedFile = await imageCompression(selectedFile, options);

        console.log(
          `Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
        );

        // Create a new File object to keep the original name
        const newFile = new File([compressedFile], selectedFile.name, {
          type: compressedFile.type,
          lastModified: Date.now(),
        });

        setFile(newFile);
      } catch (error) {
        console.error("Compression error:", error);
        alert("Failed to compress image. Uploading original file.");
        setFile(selectedFile);
      }
    } else {
      // If it's a PDF or other file, don't compress, just set it
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    let documentPath = null;

    if (file) {
      // Validate max size just in case (e.g., 5MB limit for PDFs)
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum allowed size is 5MB.");
        setLoading(false);
        return;
      }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("loan-documents")
        .upload(path, file);

      if (uploadError) {
        alert("File upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }
      documentPath = path;
    }

    const { error } = await supabase.from("loan_customers").insert({
      loan_id: form.loan_id || null,
      full_name: form.full_name,
      mobile_number: form.mobile_number || null,
      email: form.email || null,
      address: form.address || null,
      bank_partner: form.bank_partner || null,
      loan_amount: form.loan_amount ? Number(form.loan_amount) : null,
      status: form.status,
      document_path: documentPath,
      user_id: user.id,
    });

    if (error) {
      alert("Save failed: " + error.message);
    } else {
      onAdded?.();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg shadow-sm transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            New Loan Application
          </h2>
          <p className="text-sm text-slate-500">
            Enter customer details and upload documents.
          </p>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Customer Name *
              </label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Loan ID
              </label>
              <input
                name="loan_id"
                value={form.loan_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. LN-10045"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <input
                name="mobile_number"
                type="tel"
                value={form.mobile_number}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Address
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="123 Main St, City, State"
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Loan Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Loan Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Loan Amount (₹)
              </label>
              <input
                name="loan_amount"
                type="number"
                value={form.loan_amount}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Partner Bank
              </label>
              <input
                name="bank_partner"
                value={form.bank_partner}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. HDFC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Loan Documents (PDF/Image)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-6 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-emerald-500 transition cursor-pointer relative bg-slate-50 hover:bg-emerald-50/30 group">
            <div className="space-y-2 text-center">
              <svg
                className="mx-auto h-10 w-10 text-slate-400 group-hover:text-emerald-500 transition-colors"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-emerald-600 group-hover:text-emerald-700">
                  Click to upload
                </span>{" "}
                or drag and drop
              </div>
              <p className="text-xs text-slate-500">
                {file
                  ? `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
                  : "Images will be auto-compressed. Max 5MB."}
              </p>
            </div>
            <input
              key={fileKey}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange} // Use the new compression handler
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="w-1/3 bg-white border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-2/3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-xl transition shadow-sm"
          >
            {loading ? "Saving Application..." : "Save Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
