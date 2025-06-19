"use client";

import { useEffect, useState } from "react";
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

  const fetchUsers = async () => {
    const res = await fetch("http://localhost:3000/users");
    const data = await res.json();
    setUsers(data);
  };

  const fetchCurrentUser = async () => {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();
    if (data?.user?._id) setCurrentUserId(data.user._id);
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await fetch(`http://localhost:3000/users/${id}`, {
        method: "DELETE",
      });
      fetchUsers();
    }
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditPermissions(user.permissions || []);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;

    await fetch(`http://localhost:3000/users/${editUser._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: editRole,
        permissions: editPermissions,
      }),
    });

    setEditUser(null);
    await fetchUsers();

    if (editUser._id === currentUserId) {
      console.log("🔁 Updating permissions for current user...");
      localStorage.setItem("forcePermissionReload", Date.now().toString());
      window.location.reload(); // Force full refresh to update sidebar immediately
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-200 text-center">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">NIC</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Created At</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(users) &&
            users.map((u) => (
              <tr key={u._id} className="text-center">
                <td className="p-2 border">{u.name}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.nic}</td>
                <td className="p-2 border capitalize">{u.role}</td>
                <td className="p-2 border">
                  {new Date(u.createdAt).toLocaleString()}
                </td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              Edit Access: {editUser.name}
            </h2>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Role</label>
              <select
                className="border p-2 w-full"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map((perm) => (
                  <label key={perm} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editPermissions.includes(perm)}
                      onChange={() => togglePermission(perm)}
                    />
                    <span>{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
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