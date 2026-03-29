import * as s from "./page.css";
import { GitHubSignInButton } from "@/features/auth/components/GitHubSignInButton";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className={s.container}>
      <div className={s.card}>
        <div className={s.logoRow}>
          <div className={s.logoIcon}>⚡</div>
          <h1 className={s.title}>GHOST_DEV</h1>
        </div>

        <p className={s.subtitle}>
          내가 업무에 집중하는 동안,
          <br />
          AI는 내 사이드 프로젝트를 빌드합니다.
        </p>

        <div className={s.divider} />

        {error === "unauthorized" && (
          <p className={s.errorMessage}>등록되지 않은 계정입니다.</p>
        )}

        <GitHubSignInButton className={s.signInButton} />
      </div>
    </main>
  );
}
