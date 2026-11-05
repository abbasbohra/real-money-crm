import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function StatsBar({ refreshKey }) {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1).toISOString();
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();

      const { data } = await supabase
        .from("loan_customers")
        .select("status")
        .gte("created_at", start)
        .lte("created_at", end);

      if (data) {
        setStats({
          total: data.length,
          approved: data.filter((d) => d.status === "approved").length,
          rejected: data.filter((d) => d.status === "rejected").length,
          pending: data.filter((d) => d.status === "pending").length,
        });
      }
    };
    fetchStats();
  }, [refreshKey]);

  const cards = [
    {
      label: "Total This Year",
      value: stats.total,
      color: "bg-slate-900",
      text: "text-white",
    },
    {
      label: "Approved",
      value: stats.approved,
      color: "bg-emerald-500",
      text: "text-white",
    },
    {
      label: "Pending",
      value: stats.pending,
      color: "bg-amber-500",
      text: "text-white",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      color: "bg-rose-500",
      text: "text-white",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`${c.color} ${c.text} rounded-xl p-5 shadow-sm`}
        >
          <p className="text-sm opacity-80">{c.label}</p>
          <p className="text-3xl font-bold mt-1">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
