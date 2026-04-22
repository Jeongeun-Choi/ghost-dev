import * as s from "./Spinner.css";

export type SpinnerSize = "sm" | "md" | "lg";
export type SpinnerColor = "cyan" | "magenta" | "green" | "white";

interface SpinnerProps {
  /** 스피너 크기. 기본값: "md" */
  size?: SpinnerSize;
  /** 스피너 색상. 기본값: "cyan" */
  color?: SpinnerColor;
  /** 전체 영역 중앙 정렬 여부. 기본값: false */
  fullPage?: boolean;
  /** 접근성 레이블 */
  label?: string;
  className?: string;
}

export function Spinner({
  size = "md",
  color = "cyan",
  fullPage = false,
  label = "로딩 중",
  className,
}: SpinnerProps) {
  const spinner = (
    <span
      className={`${s.base} ${s.sizeVariants[size]} ${s.colorVariants[color]}${className ? ` ${className}` : ""}`}
      role="status"
      aria-label={label}
    />
  );

  if (fullPage) {
    return <div className={s.wrapperFullPage}>{spinner}</div>;
  }

  return spinner;
}
