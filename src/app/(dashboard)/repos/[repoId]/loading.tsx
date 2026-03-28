import * as s from "./page.css";

export default function ProjectPageLoading() {
  return (
    <div className={s.pageWrapper}>
      <div className={s.pageHeader}>
        <div>
          <div className={s.breadcrumb}>
            <span>⎇</span>
            <div
              className={s.skeletonBlock}
              style={{ width: 200, height: 12 }}
            />
          </div>
          <div
            className={s.skeletonBlock}
            style={{ width: 280, height: 28, marginTop: 8 }}
          />
        </div>
      </div>

      <div className={s.boardWrapper}>
        <div className={s.skeletonColumns}>
          {["TODO", "IN_PROGRESS", "DONE"].map((col) => (
            <div key={col}>
              <div
                className={s.skeletonBlock}
                style={{ width: 100, height: 12, marginBottom: 16 }}
              />
              {[1, 2, 3].map((i) => (
                <div key={i} className={s.skeletonCard} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
