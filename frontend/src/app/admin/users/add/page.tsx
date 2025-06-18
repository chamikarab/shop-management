"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "../../styles/users.css";
import WithPermission from "@/components/WithPermission";

function AddUserForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [permissions, setPermissions] = useState({
    "dashboard:access": false,
    "products:view": false,
    "products:add": false,
    "products:purchasing": false,
    "users:view": false,
    "users:add": false,
    "orders:view": false,
  });

  const handleToggle = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
    return Array.from({ length: 10 }, () =>
      charset[Math.floor(Math.random() * charset.length)]
    ).join("");
  };

  const handleGeneratePassword = () => {
    const password = generatePassword();
    const passwordInput = document.querySelector<HTMLInputElement>("input[name='password']");
    const confirmInput = document.querySelector<HTMLInputElement>("input[name='confirmPassword']");
    if (passwordInput && confirmInput) {
      passwordInput.value = password;
      confirmInput.value = password;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;

    const formData = {
      name: form.name.value,
      email: form.email.value,
      password: form.password.value,
      confirmPassword: form.confirmPassword.value,
      nic: form.nic.value,
      role: form.role.value,
      permissions: Object.entries(permissions)
        .filter(([_, value]) => value)
        .map(([key]) => key),
    };

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to add user");

      toast.success("User added successfully");
      form.reset();
      router.push("/admin/users");
    } catch (err) {
      toast.error("Error adding user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-9xl">
      <h1 className="text-2xl font-bold mb-6">Add New User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Name" required className="p-2 border w-full rounded" />
        <input name="email" type="email" placeholder="Email" required className="p-2 border w-full rounded" />

        <div className="flex gap-2">
          <input name="password" placeholder="Password" required className="p-2 border w-full rounded" />
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            Generate
          </button>
        </div>

        <input
          name="confirmPassword"
          placeholder="Confirm Password"
          required
          className="p-2 border w-full rounded"
        />
        <input name="nic" placeholder="NIC Number" required className="p-2 border w-full rounded" />

        <select name="role" required className="p-2 border w-full rounded">
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
          <option value="manager">Manager</option>
        </select>

        <div className="permissions-section">
          <h3>Permissions</h3>
          <div className="permissions-grid">
            {Object.entries(permissions).map(([key, value]) => (
              <div key={key} className="permission-item">
                <span className="capitalize">{key.replace(/:/g, " → ")}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleToggle(key)}
                  />
                  <span className="slider" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded font-semibold text-white ${
            loading ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Saving..." : "Add User"}
        </button>
      </form>
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