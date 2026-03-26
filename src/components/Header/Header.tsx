import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
          >
            <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="var(--neon-pink)" />
          </svg>
        </div>
        <div className={styles.logoTextContainer}>
          <h1 className={styles.mainTitle}>GHOST_DEV</h1>
          <p className={styles.subTitle}>NEURAL_OVERRIDE_OS</p>
        </div>
      </div>

      <div className={styles.userProfile}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>GHOST_OPERATOR</span>
          <span className={styles.userLevel}>LEVEL: OMEGA</span>
        </div>
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                fill="var(--neon-cyan)"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
