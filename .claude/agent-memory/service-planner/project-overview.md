---
name: ghost-dev Project Overview
description: ghost-dev 서비스의 전체 구조, 기술 스택, 구현된 기능 요약
type: project
---

## 서비스 개요
GitHub 레포를 연결하면 AI 에이전트(Claude Sonnet 4.6)가 티켓 기반으로 코드를 자동 작성하고 PR을 올리는 서비스.
GitHub Actions workflow_dispatch로 에이전트를 실행함.

**Why:** 개발자가 작업 명세(티켓)만 작성하면 AI가 직접 코드를 작성해 PR을 올려주는 자동화.

**How to apply:** 기획 시 GitHub Actions 실행 흐름(dispatch → run → callback)을 항상 고려해야 함.

## 기술 스택
- Next.js App Router + React 19 + TypeScript
- Supabase (Auth, DB, Realtime)
- Vanilla Extract (스타일링)
- TanStack React Query (서버 상태) + Jotai (전역 UI 상태)
- AI SDK (Vercel AI SDK) + Anthropic Claude Sonnet 4.6

## 핵심 데이터 모델
- `ghostdev_users`: GitHub OAuth 유저 (github_access_token 암호화)
- `ghostdev_repos`: 활성화된 GitHub 레포 (workspace_config: 모노레포 정보)
- `ghostdev_tickets`: 작업 명세 (status: TODO/IN_PROGRESS/DONE/FAILED)
- `ghostdev_agent_runs`: 에이전트 실행 이력 (status: PENDING→QUEUED→IN_PROGRESS→SUCCESS/FAILURE/CANCELLED)
- `ghostdev_run_logs`: 실시간 로그 (Supabase Realtime 구독)

## 구현된 주요 기능 (as of 2026-03-28)
- 레포 활성화: GitHub OAuth 연동, 워크플로/시크릿 자동 설치
- 티켓 CRUD: 생성(AI 브랜치명 자동 제안 포함), 칸반 보드, 워크스페이스 필터
- 에이전트 실행: workflow_dispatch 트리거, 콜백 API(성공/실패), 재시도(최대 3회)
- 실시간 로그: Supabase Realtime으로 run_logs 스트리밍
- GitHub Webhook: workflow_run 이벤트로 run status 동기화
- 티켓 상세 페이지: 최신 run의 로그 뷰어 (RunLogViewer)

## 미구현 사항 (Jira 기준)
- GAD-5: 티켓 상세 페이지 고도화 (현재 기본 구현만 있음)
- GAD-6: 폴더 구조 재편 (진행 중)
