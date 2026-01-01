"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import "../../styles/users.css";
import WithPermission from "@/components/WithPermission";

function AddUserForm() {
  const [loading, setLoading] = useState(false);
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

  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>({
    "dashboard:access": false,
    "products:view": false,
    "products:add": false,
    "products:purchasing": false,
    "users:view": false,
    "users:add": false,
    "orders:view": false,
  });

  const handleToggle = (key: PermissionKey) => {
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
    const formDataObj = new FormData(form);

    const formData = {
      name: (formDataObj.get('name') as string) || '',
      email: (formDataObj.get('email') as string) || '',
      password: (formDataObj.get('password') as string) || '',
      confirmPassword: (formDataObj.get('confirmPassword') as string) || '',
      nic: (formDataObj.get('nic') as string) || '',
      role: (formDataObj.get('role') as string) || '',
      permissions: Object.entries(permissions)
        .filter(([, value]) => value)
        .map(([key]) => key),
    };

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to add user");

      toast.success("User added successfully");
      form.reset();
      router.push("/admin/users");
    } catch {
      toast.error("Error adding user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Add New User
        </h1>
        <p className="text-slate-600 text-lg">Create a new user account with role and permissions</p>
      </div>

      <div className="modern-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  placeholder="Enter full name"
                  required
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  required
                  className="modern-input"
                />
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                NIC Number <span className="text-red-500">*</span>
              </label>
              <input
                name="nic"
                placeholder="Enter NIC number"
                required
                className="modern-input"
              />
            </div>
          </div>

          {/* Password Section */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
              Password
            </h2>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-sm px-4 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
                  >
                    Generate Password
                  </button>
                </div>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  required
                  className="modern-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  required
                  className="modern-input"
                />
              </div>
            </div>
          </div>

          {/* Role Section */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
              Role & Access
            </h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                User Role <span className="text-red-500">*</span>
              </label>
              <select name="role" required className="modern-input">
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Select the role that best fits the user&apos;s responsibilities</p>
            </div>
          </div>

          {/* Permissions Section */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
              Permissions
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Select the permissions this user should have. Toggle switches to grant or revoke access.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(permissions).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {key.replace(/:/g, " → ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <label className="modern-switch">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => handleToggle(key as PermissionKey)}
                    />
                    <span className="modern-slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <Link
              href="/admin/users"
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all text-center border-2 border-slate-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.5] bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white font-black py-4 rounded-2xl hover:from-green-700 hover:to-green-700 shadow-xl shadow-green-100 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading-spinner-small"></span>
                  Creating User...
                </span>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .loading-spinner-small {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

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