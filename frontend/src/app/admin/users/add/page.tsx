"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AddUserPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  // Random password generator
  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";
    return Array.from({ length: 10 }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add User</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <input name="name" placeholder="Name" required className="p-2 border w-full" />
        <input name="email" type="email" placeholder="Email" required className="p-2 border w-full" />
        <div className="flex gap-2">
          <input name="password" placeholder="Password" required className="p-2 border w-full" />
          <button
            type="button"
            onClick={() => {
              const password = generatePassword();
              const passwordInput = document.querySelector<HTMLInputElement>("input[name='password']");
              const confirmInput = document.querySelector<HTMLInputElement>("input[name='confirmPassword']");
              if (passwordInput && confirmInput) {
                passwordInput.value = password;
                confirmInput.value = password;
              }
            }}
            className="bg-blue-600 text-white px-3 py-2 rounded"
          >
            Generate
          </button>
        </div>
        <input
          name="confirmPassword"
          placeholder="Confirm Password"
          required
          className="p-2 border w-full"
        />
        <input name="nic" placeholder="NIC" required className="p-2 border w-full" />
        <select name="role" required className="p-2 border w-full">
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
          <option value="manager">Manager</option>
        </select>
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
          {loading ? "Saving..." : "Add User"}
        </button>
      </form>
    </div>
  );
}