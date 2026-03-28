import Image from "next/image";
import * as s from "./TopNav.css";
import { SignOutButton } from "./SignOutButton";

interface TopNavProps {
  userLogin?: string;
  userAvatar?: string;
}

export function TopNav({ userLogin, userAvatar }: TopNavProps) {
  return (
    <nav className={s.nav}>
      {/* 로고 */}
      <div className={s.logoSection}>
        <div className={s.logoIcon}>⚡</div>
        <div className={s.logoText}>
          <span className={s.logoTitle}>GHOST_DEV</span>
          <span className={s.logoSubtitle}>AGENT_OS_v16.0</span>
        </div>
      </div>

      {/* 유저 정보 */}
      <div className={s.userSection}>
        <div className={s.userInfo}>
          <span className={s.userName}>{userLogin ?? "GHOST_OPERATOR"}</span>
          <div className={s.secureLink}>
            <span className={s.secureDot} />
            SECURE_LINK
          </div>
        </div>
        <div className={s.avatar}>
          {userAvatar ? (
            <Image src={userAvatar} alt="avatar" width={36} height={36} />
          ) : (
            <div style={{ width: 36, height: 36, background: "#1a3040" }} />
          )}
        </div>
        <SignOutButton />
      </div>
    </nav>
  );
}
