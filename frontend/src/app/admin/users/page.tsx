"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { 
  FaUser, FaUsers, FaUserShield, FaUserTie, FaCashRegister,
  FaSearch, FaFilter, FaTimes, FaArrowUp, FaArrowDown, FaEdit, FaTrash, FaPlus
} from "react-icons/fa";
import Link from "next/link";
import WithPermission from "@/components/WithPermission";

type User = {
  _id: string;
  name: string;
  email: string;
  nic: string;
  role: string;
  permissions: string[];
  createdAt: string;
};

const roles = ["admin", "manager", "cashier"];

function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<keyof User>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchUsers = async () => {
    try {
      setLoading(true);
    const res = await fetch(`${apiUrl}/users`);
    const data = await res.json();
    setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();
    if (data?.user?._id) setCurrentUserId(data.user._id);
    } catch (err) {
      console.error("Failed to fetch current user", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === "admin").length;
    const managerCount = users.filter(u => u.role === "manager").length;
    const cashierCount = users.filter(u => u.role === "cashier").length;
    
    return { totalUsers, adminCount, managerCount, cashierCount };
  }, [users]);

  // Filter and Sort users
  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.nic.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === "all" || user.role === filterRole;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const valA = a[sortBy] || "";
        const valB = b[sortBy] || "";
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [users, searchTerm, filterRole, sortBy, sortOrder]);

  const toggleSort = (key: keyof User) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await fetch(`${apiUrl}/users/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("User deleted successfully");
          fetchUsers();
        } else {
          toast.error("Failed to delete user");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred");
      }
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditPermissions(user.permissions || []);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;

    try {
      const res = await fetch(`${apiUrl}/users/${editUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
          permissions: editPermissions,
        }),
      });

      if (res.ok) {
        toast.success("User updated successfully");
        setEditUser(null);
        await fetchUsers();

        if (editUser._id === currentUserId) {
          toast.loading("Updating permissions... Page will reload.");
          localStorage.setItem("forcePermissionReload", Date.now().toString());
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        toast.error("Failed to update user");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const togglePermission = (perm: string) => {
    setEditPermissions((prev) =>
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  };

  const allPermissions = [
    "users:view",
    "users:add",
    "products:view",
    "products:add",
    "products:purchasing",
    "orders:view",
  ];

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin": return "bg-purple-50 text-purple-600 border-purple-100";
      case "manager": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "cashier": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-10 min-h-screen bg-[#f8fafc]">
      {/* 2026 Ultra-Modern Studio Header */}
      <div className="relative mb-10 pt-0">
        <div className="absolute top-0 right-0 w-[60%] h-[600px] bg-gradient-to-bl from-indigo-500/[0.03] via-purple-500/[0.02] to-transparent blur-[120px] -z-10 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
          <div className="flex items-start gap-12">
            <div className="space-y-4 lg:space-y-8">
              {/* Futuristic Breadcrumb */}
              <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
                <Link href="/admin" className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors">Overview</Link>
                <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-full" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">All Users</span>
              </nav>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-[-0.06em] leading-[0.85] italic break-words">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x not-italic">All Users</span>
                </h1>
                <p className="text-slate-400 font-medium text-lg md:text-2xl leading-relaxed max-w-2xl">
                  Managing access control and permissions for your administrative ecosystem.
                </p>
              </div>
            </div>
        </div>

          <div className="flex flex-col items-start lg:items-end gap-6">
        <Link
          href="/admin/users/add"
              className="flex items-center gap-3 group bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 lg:mr-8"
        >
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                <FaPlus size={14} />
              </div>
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Add New User</span>
        </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="modern-card group flex items-center gap-6 border-l-4 border-indigo-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
            <FaUsers size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Users</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-purple-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500">
            <FaUserShield size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Admins</p>
            <p className="text-3xl font-black text-slate-900">{stats.adminCount}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-indigo-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
            <FaUserTie size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Managers</p>
            <p className="text-3xl font-black text-slate-900">{stats.managerCount}</p>
          </div>
        </div>
        <div className="modern-card group flex items-center gap-6 border-l-4 border-emerald-500 hover:scale-[1.02] transition-all duration-500 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
            <FaCashRegister size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cashiers</p>
            <p className="text-3xl font-black text-slate-900">{stats.cashierCount}</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="relative w-full lg:max-w-xl group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors duration-300">
            <FaSearch size={18} />
          </div>
            <input
              type="text"
              placeholder="Search by name, email, or NIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            className="modern-input !pl-16 !py-4 !rounded-2xl text-lg font-medium bg-slate-50/50 focus:bg-white transition-all duration-300"
            />
          </div>
        
        <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-slate-50/50 px-6 py-2 rounded-2xl border border-slate-100 flex-1 lg:flex-none">
            <FaFilter size={14} className="text-slate-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-black text-slate-600 uppercase tracking-widest cursor-pointer min-w-[140px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin Only</option>
              <option value="manager">Manager Only</option>
              <option value="cashier">Cashier Only</option>
            </select>
          </div>

          {(filterRole !== "all") && (
            <button
              onClick={() => setFilterRole("all")}
              className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all duration-300"
              title="Clear Filter"
            >
              <FaTimes size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Users Table Display */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="modern-card animate-pulse flex items-center justify-between rounded-[2rem] h-24 bg-white/50 border-slate-100">
              <div className="flex gap-4 items-center ml-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-32"></div>
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-100 rounded w-24 mr-8"></div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedUsers.length === 0 ? (
        <div className="modern-card py-32 text-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-transparent shadow-none">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-50 text-slate-200 mb-8">
            <FaUsers size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3">No users found</h3>
          <p className="text-slate-400 max-w-sm mx-auto font-medium">
            {searchTerm || filterRole !== "all" 
              ? "No users match your current search or filter criteria."
              : "Get started by adding your first user to the system."}
          </p>
          <button 
            onClick={() => {setSearchTerm(""); setFilterRole("all");}}
            className="mt-10 px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-600 transition-all duration-300"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="modern-table shadow-2xl shadow-slate-200/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                  <th className="px-8 py-6 cursor-pointer group" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-3">
                      Name
                      {sortBy === "name" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6 cursor-pointer group" onClick={() => toggleSort("email")}>
                    <div className="flex items-center gap-3">
                      Email
                      {sortBy === "email" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6">NIC</th>
                  <th className="px-8 py-6 text-center">Role</th>
                  <th className="px-8 py-6 text-center">Permissions</th>
                  <th className="px-8 py-6 cursor-pointer group" onClick={() => toggleSort("createdAt")}>
                    <div className="flex items-center gap-3">
                      Created At
                      {sortBy === "createdAt" && (sortOrder === "asc" ? <FaArrowUp size={10} className="text-indigo-400" /> : <FaArrowDown size={10} className="text-indigo-400" />)}
                    </div>
                  </th>
                  <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 transition-colors duration-300">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg tracking-tight">{u.name}</span>
                      </div>
                  </td>
                    <td className="px-8 py-6">
                      <span className="text-slate-600 font-medium">{u.email}</span>
                  </td>
                    <td className="px-8 py-6">
                      <span className="text-slate-600 font-medium">{u.nic}</span>
                  </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getRoleColor(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                      {u.permissions && u.permissions.length > 0 ? (
                          <>
                            {u.permissions.slice(0, 2).map((perm) => (
                          <span
                            key={perm}
                                className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold"
                          >
                            {perm.split(':')[0]}
                          </span>
                            ))}
                            {u.permissions.length > 2 && (
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold">
                          +{u.permissions.length - 2}
                        </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 text-[9px] font-bold">None</span>
                      )}
                    </div>
                  </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-slate-600 font-medium">
                        {new Date(u.createdAt).toLocaleDateString("en-LK", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                    </span>
                  </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleEdit(u)}
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl rounded-2xl transition-all duration-300 active:scale-95"
                        title="Edit User"
                      >
                          <FaEdit size={18} />
                      </button>
                      {u._id !== currentUserId && (
                        <button
                          onClick={() => handleDelete(u._id)}
                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-xl rounded-2xl transition-all duration-300 active:scale-95"
                          title="Delete User"
                        >
                            <FaTrash size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <FaEdit size={18} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Edit User Access</h2>
              </div>
              <button 
                onClick={() => setEditUser(null)} 
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Name:</span>
                    <p className="font-bold text-slate-900 mt-1">{editUser.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Email:</span>
                    <p className="font-bold text-slate-900 mt-1">{editUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">User Role <span className="text-rose-500">*</span></label>
                <select
                  className="modern-input !py-3 !rounded-xl"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permissions</label>
                <p className="text-xs text-slate-500 font-medium">
                  Select the permissions this user should have access to
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allPermissions.map((perm) => (
                    <div
                      key={perm}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        editPermissions.includes(perm)
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                      }`}
                      onClick={() => togglePermission(perm)}
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {perm.replace(/:/g, " → ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <label className="modern-switch">
                        <input
                          type="checkbox"
                          checked={editPermissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                        />
                        <span className="modern-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditUser(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default function ProtectedAllUsersPage() {
  return (
    <WithPermission required="users:view">
      <AllUsersPage />
    </WithPermission>
  );
}
