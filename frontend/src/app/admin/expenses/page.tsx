"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaReceipt, FaTrash } from "react-icons/fa";
import BeerLoader from "@/components/BeerLoader";
import {
  DAILY_EXPENSE_CATEGORIES,
  formatCurrency,
  todayDateString,
} from "@/lib/reports";
import WithPermission from "@/components/WithPermission";

type Expense = {
  _id: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  isFixed?: boolean;
  createdAt?: string;
};

const emptyForm = () => ({
  title: "",
  category: "Other",
  amount: "",
  expenseDate: todayDateString(),
  notes: "",
});

export default function DailyExpensesPage() {
  return (
    <WithPermission required="expenses:view">
      <DailyExpensesPageContent />
    </WithPermission>
  );
}

function DailyExpensesPageContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterDate, setFilterDate] = useState(() => todayDateString());
  const [form, setForm] = useState(emptyForm);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${apiUrl}/expenses`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load expenses");
      const data = await res.json();
      const all: Expense[] = Array.isArray(data) ? data : data.data || [];
      setExpenses(all.filter((e) => !e.isFixed));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => expense.expenseDate.slice(0, 10) === filterDate),
    [expenses, filterDate]
  );

  const totals = useMemo(() => {
    const dayTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthPrefix = filterDate.slice(0, 7);
    const monthTotal = expenses
      .filter((e) => e.expenseDate.slice(0, 7) === monthPrefix)
      .reduce((sum, e) => sum + e.amount, 0);
    return { dayTotal, monthTotal, count: filteredExpenses.length };
  }, [expenses, filteredExpenses, filterDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(form.amount);
    if (!form.title.trim()) {
      toast.error("Please enter an expense title");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          amount,
          expenseDate: form.expenseDate,
          notes: form.notes.trim() || undefined,
          isFixed: false,
        }),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      toast.success("Expense recorded");
      setForm(emptyForm());
      setFilterDate(form.expenseDate);
      await fetchExpenses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;

    try {
      const res = await fetch(`${apiUrl}/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Expense deleted");
      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete expense");
    }
  };

  if (loading) return <BeerLoader />;

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-8 bg-[#f8fafc] min-h-screen">
      <header>
        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">
          Finance
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Daily Expenses
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Record day-to-day variable costs. For rent, salary, and other fixed monthly costs, use{" "}
          <a href="/admin/reports/pnl" className="text-indigo-600 font-bold hover:underline">
            Monthly P&L
          </a>
          .
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Expenses", value: formatCurrency(totals.dayTotal) },
          { label: "Entries Today", value: String(totals.count) },
          { label: "This Month (daily only)", value: formatCurrency(totals.monthTotal) },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {item.label}
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 lg:col-span-1 h-fit"
        >
          <div className="flex items-center gap-2 mb-2">
            <FaPlus className="text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900">Add Daily Expense</h2>
          </div>

          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Delivery fuel"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className={inputClass}
            >
              {DAILY_EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Amount (Rs.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Expense Date</label>
            <input
              type="date"
              value={form.expenseDate}
              onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Additional details..."
              className={`${inputClass} h-auto py-2 resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save Expense"}
          </button>
        </form>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FaReceipt className="text-indigo-600" />
              <h2 className="text-lg font-black text-slate-900">Expense List</h2>
            </div>
            <div>
              <label className={labelClass}>Filter by Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/80">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No daily expenses recorded for this date.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr
                      key={expense._id}
                      className="border-b border-slate-50 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {expense.title}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{expense.category}</td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                        {expense.notes || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(expense._id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete expense"
                        >
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot>
                  <tr className="bg-indigo-50 font-black text-slate-900">
                    <td colSpan={2} className="px-6 py-4 uppercase text-[10px] tracking-widest">
                      Day Total
                    </td>
                    <td className="px-6 py-4 text-right text-rose-700">
                      {formatCurrency(totals.dayTotal)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelClass =
  "text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-2";

const inputClass =
  "w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";
