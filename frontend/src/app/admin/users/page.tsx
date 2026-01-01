"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchUsers = async () => {
    const res = await fetch(`${apiUrl}/users`);
    const data = await res.json();
    setUsers(data);
  };

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const fetchCurrentUser = async () => {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();
    if (data?.user?._id) setCurrentUserId(data.user._id);
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            User Management
          </h1>
          <p className="text-slate-600 font-medium">Manage user accounts, roles, and permissions</p>
        </div>
        <Link
          href="/admin/users/add"
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 shadow-lg text-center"
        >
          Add New User
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="modern-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name, email, or NIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modern-input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="modern-input"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="modern-card text-center py-12">
          <p className="text-slate-500 text-lg">No users found</p>
          <p className="text-slate-400 text-sm mt-2">
            {searchTerm || filterRole !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first user"}
          </p>
        </div>
      ) : (
        <div className="modern-table">
          <table className="w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>NIC</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="font-semibold text-slate-900">{u.name}</div>
                  </td>
                  <td>
                    <span className="text-slate-600">{u.email}</span>
                  </td>
                  <td>
                    <span className="text-slate-600">{u.nic}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : u.role === 'manager'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {u.permissions && u.permissions.length > 0 ? (
                        u.permissions.slice(0, 2).map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                          >
                            {perm.split(':')[0]}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">No permissions</span>
                      )}
                      {u.permissions && u.permissions.length > 2 && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                          +{u.permissions.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-slate-600">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
                        title="Edit User"
                      >
                        Edit
                      </button>
                      {u._id !== currentUserId && (
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all hover:scale-105"
                          title="Delete User"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 p-4">
          <div className="modern-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Edit User Access
              </h2>
              <p className="text-slate-600">Update role and permissions for {editUser.name}</p>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Name:</span>
                    <p className="font-semibold text-slate-900">{editUser.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <p className="font-semibold text-slate-900">{editUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  className="modern-input"
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

              {/* Permissions */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Permissions
                </label>
                <p className="text-xs text-slate-500 mb-4">
                  Select the permissions this user should have access to
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allPermissions.map((perm) => (
                    <div
                      key={perm}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        editPermissions.includes(perm)
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-slate-50 border-slate-200 hover:border-purple-200'
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setEditUser(null)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="modern-btn modern-btn-primary"
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