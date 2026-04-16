---
name: Known Issues & Gaps
description: 코드 분석을 통해 발견된 버그, 미구현, 개선 필요 항목 (2026-03-28 기준)
type: project
---

## 버그 / 안정성

- error callback에서 workflow_dispatch 재트리거 코드가 실제로 실행되지 않음 (TODO 주석만 있음)
- Webhook handler에서 workflow 실패 시 티켓이 FAILED가 아닌 TODO로 되돌아감
- dispatch 후 3초 sleep + listWorkflowRuns로 run_id를 추론하는 방식이 불안정 (race condition 가능)
- TicketCard에서 실행 실패 시 alert()으로 에러 표시 (UX 저하)
- CreateTicketModal에서 제출 실패 시 사용자 피드백 없음 (silently fail)

## 미구현 기능

- 티켓 편집 UI 없음 (API는 PATCH 존재)
- 레포 비활성화(deactivate) 기능 없음
- PR URL이 티켓에 저장되지만 UI에서 표시되지 않음 (Ticket 타입에 pr_url 필드 존재)
- 실행 취소(CANCEL) 기능 없음
- 런 히스토리 조회 없음 (티켓당 최신 run만 표시)
- 토큰 사용량 대시보드 없음
- 레포 설정 페이지 없음 (브랜치 변경, 워크스페이스 재감지 등)

## UX 개선 필요

- 칸반 보드가 서버 컴포넌트 초기 데이터만 사용, 실시간 업데이트 없음 (에이전트 실행 후 수동 새로고침 필요)
- 티켓 상세에서 run이 없으면 아무것도 표시 안 됨
- CreateTicketModal에서 워크스페이스 선택 UI 없음 (defaultWorkspace만 자동 주입)
- 티켓 생성 시 status 선택 가능한 것은 UX상 불필요 (생성 시 항상 TODO여야 함)
