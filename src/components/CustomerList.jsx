import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../supabaseClient";

const statusStyles = {
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
};

const statusLabel = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function CustomerList({ refreshKey }) {
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState("month"); // 'month', 'quarter', 'year'
  const [loading, setLoading] = useState(false);

  // State for search input
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Data based on time filter
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

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  }, [filter]);

  // Trigger fetch on load, filter change, or refreshKey change (from adding a new record)
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Generate secure URL to view document
  const viewDoc = async (path) => {
    const { data } = await supabase.storage
      .from("loan-documents")
      .createSignedUrl(path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Search logic (Filters Name, Mobile, or Loan ID)
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();

    return customers.filter(
      (c) =>
        (c.full_name && c.full_name.toLowerCase().includes(query)) ||
        (c.mobile_number && c.mobile_number.toLowerCase().includes(query)) ||
        (c.loan_id && c.loan_id.toLowerCase().includes(query)),
    );
  }, [customers, searchQuery]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      {/* Header and Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Application Records
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage and track your loan applications.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Search Bar */}
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
              placeholder="Search Name, Phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition text-sm"
            />
          </div>

          {/* Time Filter Tabs */}
          <div className="inline-flex bg-slate-100 rounded-xl p-1 w-full sm:w-auto">
            {["month", "quarter", "year"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg transition-all ${
                  filter === f
                    ? "bg-white shadow-sm text-slate-900 font-semibold"
                    : "text-slate-500 hover:text-slate-700 font-medium"
                }`}
              >
                {f === "month"
                  ? "This Month"
                  : f === "quarter"
                    ? "This Quarter"
                    : "This Year"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          Loading records...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-500">
            {searchQuery
              ? "No results found for your search."
              : "No applications found for this period."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-4 px-4 font-semibold">Customer & ID</th>
                <th className="pb-4 px-4 font-semibold">Contact</th>
                <th className="pb-4 px-4 font-semibold">Loan Details</th>
                <th className="pb-4 px-4 font-semibold">Status</th>
                <th className="pb-4 px-4 font-semibold text-center">
                  Document
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition">
                  {/* Column 1: Customer Name & Loan ID */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {c.loan_id && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono font-medium border border-slate-200">
                          {c.loan_id}
                        </span>
                      )}
                      <p className="font-semibold text-slate-900">
                        {c.full_name}
                      </p>
                    </div>
                    <p
                      className="text-xs text-slate-500 mt-1 truncate max-w-[150px]"
                      title={c.address}
                    >
                      {c.address || "No address provided"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Applied: {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </td>

                  {/* Column 2: Contact Info */}
                  <td className="py-4 px-4">
                    {c.mobile_number ? (
                      <p className="text-sm font-medium text-slate-700">
                        {c.mobile_number}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No phone</p>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="text-xs text-teal-600 hover:underline block mt-0.5"
                      >
                        {c.email}
                      </a>
                    )}
                  </td>

                  {/* Column 3: Loan Details */}
                  <td className="py-4 px-4">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(c.loan_amount)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.bank_partner || "—"}
                    </p>
                  </td>

                  {/* Column 4: Status Badge */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[c.status] || "bg-slate-100 text-slate-700"}`}
                    >
                      {statusLabel[c.status] || c.status}
                    </span>
                  </td>

                  {/* Column 5: Document Viewer */}
                  <td className="py-4 px-4 text-center">
                    {c.document_path ? (
                      <button
                        onClick={() => viewDoc(c.document_path)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        No file
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
