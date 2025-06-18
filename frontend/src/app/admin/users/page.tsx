"use client";
import { useEffect, useState } from "react";
import WithPermission from "@/components/WithPermission";

type User = {
  _id: string;
  name: string;
  email: string;
  nic: string;
  role: string;
  createdAt: string;
};

function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const res = await fetch("http://localhost:3000/users");
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await fetch(`http://localhost:3000/users/${id}`, {
        method: "DELETE",
      });
      fetchUsers();
    }
  };

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
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(users) && users.map((u) => (
            <tr key={u._id} className="text-center">
              <td className="p-2 border">{u.name}</td>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border">{u.nic}</td>
              <td className="p-2 border capitalize">{u.role}</td>
              <td className="p-2 border">{new Date(u.createdAt).toLocaleString()}</td>
              <td className="p-2 border">
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