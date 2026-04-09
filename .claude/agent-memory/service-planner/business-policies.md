---
name: Business Policies
description: ghost-dev의 핵심 비즈니스 정책 — 토큰 한도, 삭제 정책, 재시도 정책
type: project
---

## 토큰 한도
- 일일 50만 토큰 (유저별, `get_today_token_usage` Supabase RPC로 체크)
- 한도 초과 시 HTTP 429 반환

**Why:** Anthropic API 비용 제어.

## 재시도 정책
- 에이전트 실행 실패 시 최대 3회 자동 재시도 (error callback에서 처리)
- 단, 현재 error callback에서 실제 workflow_dispatch 재트리거 코드가 미완성 상태임 (TODO 주석 존재)
- 에이전트 내부에서도 rate limit 시 MAX_OUTER_RETRIES=3, STEP_DELAY_MS=30초 대기

## 삭제 정책
- 티켓 삭제: Hard Delete (`ghostdev_tickets` 테이블에서 즉시 삭제)
- 레포 삭제: 미구현 (deactivate 기능 없음)
- 런 로그 삭제: 정책 미정의

## 권한 정책
- 단일 유저 서비스 (팀/조직 개념 없음, user_id 기반 소유권 확인)
- Callback API는 callback_token(UUID)으로만 인증 (서비스 클라이언트 사용)
- GitHub Webhook은 HMAC-SHA256 서명 검증

## 티켓 상태 전이
- 생성 시: TODO (기본값) — 단, 생성 시 status 직접 지정 가능 (보안 이슈 가능성)
- 실행 시: IN_PROGRESS
- 성공 콜백: DONE
- 실패(최대 재시도 초과): FAILED
- Webhook completion: success → DONE, 그 외 → TODO (FAILED로 가지 않음 - 버그 가능성)
