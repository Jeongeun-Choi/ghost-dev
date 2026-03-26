"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/features/auth/services/auth.service";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: "none",
        border: "1px solid #1a3040",
        color: "#4a6a7a",
        fontSize: "10px",
        letterSpacing: "0.08em",
        padding: "4px 8px",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ff4ecd")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a3040")}
    >
      SIGN_OUT
    </button>
  );
}
