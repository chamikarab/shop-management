"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  FaUser, FaLock, FaUserShield, FaShieldAlt, FaKey, FaRocket, FaEye, FaEyeSlash,
  FaChartLine, FaBoxes, FaPlusCircle, FaShoppingCart, FaUsers, FaUserPlus, FaReceipt
} from "react-icons/fa";
import WithPermission from "@/components/WithPermission";

function AddUserForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  type PermissionKey = 
    | "dashboard:access"
    | "products:view"
    | "products:add"
    | "products:purchasing"
    | "users:view"
    | "users:add"
    | "orders:view";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    nic: "",
    role: "",
  });

  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>({
    "dashboard:access": false,
    "products:view": false,
    "products:add": false,
    "products:purchasing": false,
    "users:view": false,
    "users:add": false,
    "orders:view": false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggle = (key: PermissionKey) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
    const password = Array.from({ length: 10 }, () =>
      charset[Math.floor(Math.random() * charset.length)]
    ).join("");
    setFormData(prev => ({
      ...prev,
      password,
      confirmPassword: password
    }));
    toast.success("Password generated successfully!");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    const submitData = {
      ...formData,
      permissions: Object.entries(permissions)
        .filter(([, value]) => value)
        .map(([key]) => key),
    };

    try {
      const res = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) throw new Error("Failed to add user");

      toast.success("User successfully deployed to system!");
      router.push("/admin/users");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during user creation.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return "bg-purple-50 text-purple-600 border-purple-100";
      case "manager": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "cashier": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getPermissionIcon = (key: string) => {
    switch (key) {
      case "dashboard:access": return <FaChartLine size={14} />;
      case "products:view": return <FaBoxes size={14} />;
      case "products:add": return <FaPlusCircle size={14} />;
      case "products:purchasing": return <FaShoppingCart size={14} />;
      case "users:view": return <FaUsers size={14} />;
      case "users:add": return <FaUserPlus size={14} />;
      case "orders:view": return <FaReceipt size={14} />;
      default: return <FaShieldAlt size={14} />;
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return "from-purple-500/20 via-indigo-500/10 to-transparent";
      case "manager": return "from-indigo-500/20 via-blue-500/10 to-transparent";
      case "cashier": return "from-emerald-500/20 via-teal-500/10 to-transparent";
      default: return "from-slate-500/10 via-slate-400/5 to-transparent";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-10 min-h-screen bg-[#f8fafc]">
      {/* 2026 Ultra-Modern Studio Header */}
      <div className="relative mb-10 pt-0">
        <div className="absolute top-0 right-0 w-[60%] h-[600px] bg-gradient-to-bl from-indigo-500/[0.03] via-purple-500/[0.02] to-transparent blur-[120px] -z-10 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="flex items-start gap-12">
            <div className="space-y-8">
              {/* Futuristic Breadcrumb */}
              <nav className="flex items-center gap-4">
                <Link href="/admin" className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">Overview</Link>
                <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
                <Link href="/admin/users" className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">All Users</Link>
                <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Add New User</span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-7xl md:text-8xl font-black text-slate-900 tracking-[-0.06em] leading-[0.85] italic">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x not-italic">Add New User</span>
                </h1>
                <p className="text-slate-400 font-medium text-xl md:text-2xl leading-relaxed">
                  Architecting secure access credentials for your administrative ecosystem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        {/* Main Configuration Area */}
        <div className="xl:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Identity & Personal Information */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-50/50 transition-colors duration-700" />
              
              <div className="flex items-center gap-4 mb-10 relative">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <FaUser size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Identity & Personal Information</h2>
                  <p className="text-sm text-slate-400 font-medium">Core user attributes and identification data.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name <span className="text-rose-500">*</span></label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address <span className="text-rose-500">*</span></label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. john.doe@example.com"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                  />
                </div>
              </div>

              <div className="mt-8 space-y-3 relative">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">NIC Number <span className="text-rose-500">*</span></label>
                <input
                  name="nic"
                  value={formData.nic}
                  onChange={handleInputChange}
                  placeholder="e.g. 123456789V"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                />
              </div>
            </div>

            {/* Security & Authentication */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-emerald-50/50 transition-colors duration-700" />
              
              <div className="flex items-center gap-4 mb-10 relative">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <FaLock size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Security & Authentication</h2>
                  <p className="text-sm text-slate-400 font-medium">Password credentials and access validation.</p>
                </div>
              </div>

              <div className="space-y-6 relative">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Password <span className="text-rose-500">*</span></label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all duration-300 flex items-center gap-2"
                    >
                      <FaKey size={12} />
                      Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter secure password"
                      required
                      className="w-full px-6 pr-14 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Confirm Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password for verification"
                      required
                      className="w-full px-6 pr-14 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-slate-800 font-bold placeholder-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Role & Access Control */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-purple-50/50 transition-colors duration-700" />
              
              <div className="flex items-center gap-4 mb-10 relative">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <FaUserShield size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Role & Access Control</h2>
                  <p className="text-sm text-slate-400 font-medium">Define user role and system permissions.</p>
                </div>
              </div>

              <div className="space-y-8 relative">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">User Role <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-500 transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                    >
                      <option value="">Select Role</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                    Select the role that best fits the user&apos;s responsibilities and access level.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">System Permissions</label>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">
                      Toggle switches to grant or revoke specific access permissions.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(permissions).map(([key, value]) => (
                      <div
                        key={key}
                        onClick={() => handleToggle(key as PermissionKey)}
                        className={`group/perm flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                          value
                            ? "bg-white border-indigo-600 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50"
                            : "bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            value 
                              ? "bg-indigo-600 text-white" 
                              : "bg-white text-slate-400 border border-slate-100 shadow-sm group-hover/perm:text-indigo-500"
                          }`}>
                            {getPermissionIcon(key)}
                          </div>
                          <div>
                            <span className={`text-xs font-black uppercase tracking-wider transition-colors duration-300 ${
                              value ? "text-slate-900" : "text-slate-500"
                            }`}>
                              {key.split(":")[0]}
                            </span>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-300 ${
                              value ? "text-indigo-500" : "text-slate-300"
                            }`}>
                              {key.split(":")[1]} Access
                            </p>
                          </div>
                        </div>
                        <label className="modern-switch scale-75 origin-right">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => {}} // Controlled by parent div click
                          />
                          <span className="modern-slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Final Action */}
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link
                href="/admin/users"
                className="flex-1 px-8 py-5 bg-white border-2 border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[14px] rounded-[2rem] transition-all hover:bg-slate-50 active:scale-95 text-center flex items-center justify-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] bg-slate-900 text-white font-black uppercase tracking-widest text-[14px] py-6 rounded-[2.5rem] hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-200 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-xl shadow-slate-200"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating User...</span>
                  </>
                ) : (
                  <>
                    <FaRocket size={18} />
                    <span>Create User</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic Sidebar: Preview & Security */}
        <div className="xl:col-span-4">
          <div className="sticky top-0 space-y-10">
            {/* User Preview Card */}
            <div className="bg-white rounded-[3rem] p-0 overflow-hidden border border-slate-200 shadow-2xl group transition-all duration-500 hover:-translate-y-2 ring-1 ring-slate-200/50 relative">
              <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
                <div className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-indigo-400">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Live Preview
                </div>
              </div>

              <div className="h-64 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                {/* Dynamic Background Mesh */}
                <div 
                  className={`absolute inset-0 opacity-40 transition-all duration-700 bg-gradient-to-br ${getRoleGradient(formData.role)}`}
                />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-28 h-28 bg-white rounded-full shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border-8 border-white ring-1 ring-slate-200">
                    <FaUser size={48} className={formData.role ? getRoleColor(formData.role).split(" ")[1] : "text-slate-200"} />
                  </div>
                  {formData.role && (
                    <div className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-white shadow-xl ring-1 ring-slate-100 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${getRoleColor(formData.role).split(" ")[0].replace("-50", "-500")}`} />
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${getRoleColor(formData.role).split(" ")[1]}`}>
                        {formData.role} System Access
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-10 space-y-10 bg-white relative">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {formData.name || "New Registry"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500">{formData.email || "awaiting_credential@system.com"}</span>
                  </div>
                </div>

                <div className="space-y-6 pt-8 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">National ID (NIC)</p>
                      <p className="text-lg font-black text-slate-900 tracking-tighter">
                        {formData.nic || "NOT SET"}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Status</p>
                      <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                        Pre-Active
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Modules</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(permissions).filter(([, v]) => v).length > 0 ? (
                        Object.entries(permissions)
                          .filter(([, v]) => v)
                          .map(([key]) => (
                            <div key={key} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100 animate-in fade-in zoom-in duration-300">
                              {getPermissionIcon(key)}
                              {key.split(":")[0]}
                            </div>
                          ))
                      ) : (
                        <div className="px-3 py-1.5 bg-slate-50 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 border-dashed">
                          No Modules Selected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Guard Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group border border-slate-800">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-700" />
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] group-hover:bg-purple-500/20 transition-all duration-700" />
              
              <div className="flex items-center gap-6 mb-10 relative">
                <div className="p-4 bg-white/5 rounded-2xl text-indigo-400 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <FaShieldAlt size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">Security Guard</h4>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Access Protocol v2.6</p>
                </div>
              </div>

              <div className="space-y-6 relative">
                {[
                  { id: "01", text: "End-to-end credential encryption with dynamic salt injection." },
                  { id: "02", text: "Role-Based Access Control (RBAC) synchronization across POS nodes." },
                  { id: "03", text: "Real-time permission audit logging for administrative transparency." }
                ].map((item) => (
                  <div key={item.id} className="flex gap-4 group/item">
                    <span className="text-indigo-500 font-black text-xs pt-0.5 group-hover/item:scale-125 transition-transform">{item.id}.</span>
                    <p className="text-[12px] text-slate-400 font-medium leading-relaxed group-hover/item:text-slate-300 transition-colors">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modern-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }

        .modern-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .modern-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          border-radius: 26px;
          transition: 0.3s;
        }

        .modern-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.3s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .modern-switch input:checked + .modern-slider {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .modern-switch input:checked + .modern-slider:before {
          transform: translateX(24px);
        }

        .modern-switch:hover .modern-slider {
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }
      `}</style>
    </div>
  );
}

export default function ProtectedAddUserPage() {
  return (
    <WithPermission required="users:add">
      <AddUserForm />
    </WithPermission>
  );
}
