import type { ReactNode } from "react";
import { TopNavLoader } from "@/components/TopNavLoader";
import * as s from "./layout.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={s.wrapper}>
      <TopNavLoader />
      <main className={s.main}>{children}</main>
    </div>
  );
}
