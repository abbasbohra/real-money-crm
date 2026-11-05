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

  // State for active tab: 'list', 'add', or 'admin'
  const [activeTab, setActiveTab] = useState("list");

  // State to track if the logged-in user is an admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));

    // Listen for auth changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Check if the current user has admin privileges
  useEffect(() => {
    if (!session) return;

    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (data?.is_admin) setIsAdmin(true);
    };
    checkAdmin();
  }, [session]);

  // If not logged in, show login screen
  if (!session) return <Auth />;

  // Helper for tab styling
  const getTabClass = (tabName) => {
    const baseClass =
      "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200";
    return activeTab === tabName
      ? `${baseClass} border-teal-500 text-teal-600`
      : `${baseClass} border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Real Money Logo"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Real Money
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Loan Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">
                {session.user.email}
              </p>
              <p className="text-xs text-slate-500">
                {isAdmin ? "Administrator" : "Staff Member"}
              </p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm font-medium text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-8 -mb-px overflow-x-auto">
            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab("list")}
              className={getTabClass("list")}
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Dashboard
            </button>

            {/* Add Application Tab */}
            <button
              onClick={() => setActiveTab("add")}
              className={getTabClass("add")}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Application
            </button>

            {/* Admin Panel Tab (Only visible to Admins) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={getTabClass("admin")}
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Admin Panel
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
        {/* Tab 1: List & Stats */}
        {activeTab === "list" && (
          <div className="space-y-6">
            <StatsBar refreshKey={refreshKey} />
            <CustomerList refreshKey={refreshKey} />
          </div>
        )}

        {/* Tab 2: Add Form */}
        {activeTab === "add" && (
          <div className="max-w-4xl mx-auto">
            <CustomerForm
              onAdded={() => {
                setRefreshKey((k) => k + 1); // Refresh the list data
                setActiveTab("list"); // Automatically switch back to list
              }}
              onCancel={() => setActiveTab("list")}
            />
          </div>
        )}

        {/* Tab 3: Admin Panel */}
        {activeTab === "admin" && isAdmin && <AdminPanel />}
      </main>
    </div>
  );
}
