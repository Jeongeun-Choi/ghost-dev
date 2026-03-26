import styles from "./Console.module.css";

export default function Console() {
  return (
    <footer className={styles.consoleFooter}>
      <div className={styles.terminalContainer}>
        <div className={styles.terminalContent}>
          <span className={styles.prompt}>{">_"}</span>
          <span className={styles.commandText}>GHOSTDEV_CONSOLE_V2.5</span>
          <span className={styles.cursor}></span>
        </div>
        <div className={styles.recordingIndicator}></div>
      </div>
    </footer>
  );
}
