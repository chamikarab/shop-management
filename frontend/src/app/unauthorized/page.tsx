"use client";

import Link from "next/link";
import { FaBan } from "react-icons/fa";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-white px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="bg-red-600 p-4 rounded-full shadow-lg">
            <FaBan size={48} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-red-500">
          Unauthorized Access
        </h1>

        <p className="text-sm md:text-base text-gray-300">
          You do not have permission to view this page. If you think this is a mistake,
          please contact the system administrator.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="bg-gray-800 hover:bg-gray-700 transition px-4 py-2 rounded text-sm font-medium"
          >
            🔐 Back to Login
          </Link>
          <Link
            href="/admin"
            className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded text-sm font-medium"
          >
            🏠 Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}