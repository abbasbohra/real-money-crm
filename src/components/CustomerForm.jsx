import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function CustomerForm({ onAdded }) {
  const [form, setForm] = useState({
    loan_id: "", // Added Loan ID
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
      loan_id: form.loan_id || null, // Save Loan ID
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
      setForm({
        loan_id: "",
        full_name: "",
        mobile_number: "",
        email: "",
        address: "",
        loan_amount: "",
        bank_partner: "",
        status: "pending",
      });
      setFile(null);
      setFileKey(Date.now());
      onAdded?.();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Customer Loan Details Form
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter customer details and upload documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Loan ID & Customer Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Loan ID
            </label>
            <input
              name="loan_id"
              value={form.loan_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
              placeholder="e.g. LN-10045"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer Name *
            </label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
              placeholder="e.g. John Doe"
            />
          </div>
        </div>

        {/* Row 2: Mobile & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mobile Number
            </label>
            <input
              name="mobile_number"
              type="tel"
              value={form.mobile_number}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
              placeholder="john@example.com"
            />
          </div>
        </div>

        {/* Row 3: Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Address
          </label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
            placeholder="123 Main St, City"
          />
        </div>

        <hr className="border-slate-100 my-2" />

        {/* Row 4: Loan Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Loan Amount
            </label>
            <input
              name="loan_amount"
              type="number"
              value={form.loan_amount}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
              placeholder="50000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Partner Bank
            </label>
            <input
              name="bank_partner"
              value={form.bank_partner}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
              placeholder="e.g. HDFC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition cursor-pointer"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* File Upload Dropzone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Loan Documents (PDF/Image)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-teal-500 transition cursor-pointer relative bg-slate-50 hover:bg-teal-50/30">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-10 w-10 text-slate-400"
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
                <span className="font-semibold text-teal-600">
                  Click to upload
                </span>{" "}
                or drag and drop
              </div>
              <p className="text-xs text-slate-500">
                {file ? file.name : "PDF, PNG, JPG up to 10MB"}
              </p>
            </div>
            <input
              key={fileKey}
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-xl transition shadow-sm mt-4"
        >
          {loading ? "Saving Application..." : "Save Application"}
        </button>
      </form>
    </div>
  );
}
