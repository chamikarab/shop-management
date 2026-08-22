"use client";

import {
  PERMISSION_GROUPS,
  type PermissionKey,
  formatPermissionDescription,
  formatPermissionLabel,
  getAssignablePermissionGroups,
} from "@/lib/permissions";

type PermissionPickerProps = {
  selected: string[];
  onToggle: (permission: PermissionKey) => void;
  compact?: boolean;
  actorRole?: string;
  disabled?: boolean;
};

export default function PermissionPicker({
  selected,
  onToggle,
  compact = false,
  actorRole,
  disabled = false,
}: PermissionPickerProps) {
  const groups = actorRole
    ? getAssignablePermissionGroups(actorRole)
    : PERMISSION_GROUPS;

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {group.label}
          </p>
          <div
            className={`grid gap-3 ${
              compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {group.permissions.map((permission) => {
              const isSelected = selected.includes(permission.key);
              return (
                <div
                  key={permission.key}
                  className={`flex items-center justify-between gap-3 rounded-xl border transition-all ${
                    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  } ${compact ? "p-3" : "p-4"} ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-300"
                      : "bg-slate-50 border-slate-200 hover:border-indigo-200"
                  }`}
                  onClick={() => {
                    if (!disabled) onToggle(permission.key);
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">
                      {permission.label}
                    </p>
                    {!compact && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {permission.description}
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      {permission.key}
                    </p>
                  </div>
                  <label className="modern-switch shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => {
                        if (!disabled) onToggle(permission.key);
                      }}
                    />
                    <span className="modern-slider" />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PermissionPickerStyles() {
  return (
    <style jsx global>{`
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
  );
}

export { formatPermissionLabel, formatPermissionDescription };
