"use client";

import { useState } from "react";
import styles from "./ActiveNode.module.css";

export default function ActiveNode() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("neural-network-v2");

  const handleRepoChange = (repo: string) => {
    setSelectedRepo(repo);
    setIsDropdownOpen(false);
  };

  return (
    <section className={styles.activeNodeSection}>
      <div className={styles.leftContainer}>
        <div className={styles.systemStatus}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            className={styles.statusIcon}
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="var(--neon-pink)"
            />
          </svg>
          <span className={styles.statusText}>SYSTEM_LINK_ESTABLISHED</span>
        </div>
        <h2 className={styles.nodeTitle}>
          ACTIVE
          <br />
          NODE:
        </h2>
      </div>

      <div className={styles.rightContainer}>
        <div className={styles.repoSelector}>
          <button
            className={styles.dropdownButton}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className={styles.repoInfo}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                className={styles.repoIcon}
              >
                <path
                  d="M12 2C6.47 2 2 6.47 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48C19.13 20.17 22 16.42 22 12c0-5.53-4.47-10-10-10z"
                  fill="var(--neon-cyan)"
                />
              </svg>
              <span>{selectedRepo}</span>
            </div>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              className={styles.chevronIcon}
            >
              <path d="M7 10l5 5 5-5H7z" fill="var(--neon-cyan)" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <button
                onClick={() => handleRepoChange("neural-network-v2")}
                className={styles.dropdownItem}
              >
                neural-network-v2
              </button>
              <button
                onClick={() => handleRepoChange("cyber-deck-ui")}
                className={styles.dropdownItem}
              >
                cyber-deck-ui
              </button>
              <button
                onClick={() => handleRepoChange("ghost-core-api")}
                className={styles.dropdownItem}
              >
                ghost-core-api
              </button>
            </div>
          )}
        </div>

        <button className={styles.addTicketBtn}>
          <span className={styles.plusIcon}>+</span>
          ADD_NEW_TICKET
        </button>
      </div>
    </section>
  );
}
