import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import CustomerForm from "../src/components/CustomerForm";
import CustomerList from "../src/components/CustomerList";
import StatsBar from "./StatusBar";
import AdminPanel from "./AdminPanel";

export default function App() {
  const [session, setSession] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("list");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();
      if (data?.is_admin) setIsAdmin(true);
    };
    checkAdmin();
  }, [session]);

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#0B1120] text-white border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Placeholder - Replace with your logo */}
            <img
              src="/logo.png"
              alt="Real Money Logo"
              className="w-10 h-10 mx-auto rounded-full object-cover shadow-sm mb-0 border-2 border-slate-100"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Real Money</h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Loan Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200">
                {session.user.email}
              </p>
              <p className="text-xs text-emerald-400 font-medium">
                {isAdmin ? "Administrator" : "Staff"}
              </p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700 px-4 py-2 rounded-lg transition-all border border-slate-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-6 -mb-px overflow-x-auto">
            {["list", "add", ...(isAdmin ? ["admin"] : [])].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab === "list" && "Dashboard & Records"}
                {tab === "add" && "Add Application"}
                {tab === "admin" && "Admin Panel"}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "list" && (
          <div className="space-y-6 animate-fade-in">
            <StatsBar refreshKey={refreshKey} />
            <CustomerList refreshKey={refreshKey} isAdmin={isAdmin} />
          </div>
        )}
        {activeTab === "add" && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <CustomerForm
              onAdded={() => {
                setRefreshKey((k) => k + 1);
                setActiveTab("list");
              }}
              onCancel={() => setActiveTab("list")}
            />
          </div>
        )}
        {activeTab === "admin" && isAdmin && (
          <div className="animate-fade-in">
            <AdminPanel />
          </div>
        )}
      </main>
    </div>
  );
}
