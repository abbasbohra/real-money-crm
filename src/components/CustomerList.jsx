import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";
import EditModal from "../EditModal";
import Papa from "papaparse";

// Modern Status Badges
const statusStyles = {
  approved:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
};
const statusLabel = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function CustomerList({ refreshKey, isAdmin }) {
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState("month");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    let start, end;
    if (filter === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (filter === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    const { data, error } = await supabase
      .from("loan_customers")
      .select("*")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false });

    if (!error) setCustomers(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const viewDoc = async (path) => {
    const { data } = await supabase.storage
      .from("loan-documents")
      .createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const formatCurrency = (amount) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async (customer) => {
    if (
      !window.confirm(
        `Delete record for ${customer.full_name}? This cannot be undone.`,
      )
    )
      return;
    setDeletingId(customer.id);
    try {
      if (customer.document_path) {
        await supabase.storage
          .from("loan-documents")
          .remove([customer.document_path]);
      }
      await supabase.from("loan_customers").delete().eq("id", customer.id);
      fetchData();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.mobile_number?.includes(q) ||
        c.loan_id?.toLowerCase().includes(q),
    );
  }, [customers, searchQuery]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Recent Applications
          </h2>
          <p className="text-sm text-slate-500">
            Manage and track loan records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search ID, Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm shadow-sm"
            />
          </div>

          {/* Time Filter */}
          <div className="flex bg-slate-200/70 p-1 rounded-lg">
            {["month", "quarter", "year"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  filter === f
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {f === "month" ? "Month" : f === "quarter" ? "Quarter" : "Year"}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const csv = Papa.unparse(
                filteredCustomers.map((c) => ({
                  "Loan ID": c.loan_id,
                  Name: c.full_name,
                  Phone: c.mobile_number,
                  Bank: c.bank_partner,
                  Amount: c.loan_amount,
                  Status: c.status,
                })),
              );
              const blob = new Blob([csv], { type: "text/csv" });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = "Export.csv";
              link.click();
            }}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3 px-6">Customer Details</th>
              <th className="py-3 px-6">Loan Info</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-center">Document</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredCustomers.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">
                      {c.full_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {c.mobile_number || c.email || "No contact"}
                    </span>
                    {c.loan_id && (
                      <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                        ID: {c.loan_id}
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(c.loan_amount)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {c.bank_partner || "—"}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[c.status]}`}
                  >
                    {statusLabel[c.status] || c.status}
                  </span>
                </td>

                <td className="py-4 px-6 text-center">
                  {c.document_path ? (
                    <button
                      onClick={() => viewDoc(c.document_path)}
                      className="text-slate-400 hover:text-emerald-600 transition"
                    >
                      <svg
                        className="w-5 h-5 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>

                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingCustomer(c)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Edit"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            No records found.
          </div>
        )}
      </div>

      {editingCustomer && (
        <EditModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
