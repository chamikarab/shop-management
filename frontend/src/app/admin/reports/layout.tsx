import { ReactNode } from "react";
import WithPermission from "@/components/WithPermission";

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <WithPermission required="reports:view">{children}</WithPermission>;
}
