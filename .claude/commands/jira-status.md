---
description: Jira 프로젝트의 특정 상태 티켓들을 조회하고 선택적으로 상태를 변경합니다.
argument-hint: "[프로젝트] [현재상태] → [변경할상태] (예: GAD todo → inprogress)"
---

# Jira 티켓 상태 변경

## 인자 파싱 규칙

인자에서 프로젝트 키, (선택) 담당자, 현재 상태, 변경할 상태를 파싱합니다.
- 형식: `[프로젝트] [담당자?] [현재상태] → [변경할상태]`
- 담당자 생략 시 나에게 할당된 티켓만 조회
- 담당자에 `all` 입력 시 전체 티켓 조회
- 예시:
  - `GAD todo → inprogress` (내 티켓만)
  - `GAD all todo → inprogress` (전체)
  - `GAD luna todo → inprogress` (luna 담당 티켓)

인자가 없거나 불완전한 경우 사용자에게 질문합니다.

## 상태 키워드 매핑

아래 키워드로 Jira 상태를 유연하게 입력할 수 있습니다:

| 입력 키워드 | Jira 상태 |
|------------|-----------|
| `todo`, `할일`, `to do` | To Do |
| `inprogress`, `진행`, `진행중`, `in progress` | In Progress |
| `done`, `완료`, `finished` | Done |
| `review`, `리뷰`, `in review` | In Review |

## 절차

1. 인자에서 프로젝트 키, 현재 상태, 변경할 상태 파싱
2. 담당자 처리:
   - 생략: `assignee = "70121:85c7979f-3cc3-4d37-865b-13dd78c8c685"` (최정은 고정)
   - `all`: assignee 조건 없이 전체 조회
   - 이름/닉네임 입력 시: `lookupJiraAccountId`로 account ID 조회 후 사용
     - cloudId: `5cb4cb5b-d580-4515-8816-d95e15faafe5`
     - 조회 실패 시 사용자에게 정확한 이름이나 이메일 재입력 요청
3. `searchJiraIssuesUsingJql`로 해당 상태의 티켓 목록 조회
   - cloudId: `5cb4cb5b-d580-4515-8816-d95e15faafe5`
   - JQL 예시: `project = GAD AND status = "To Do" AND assignee = "[account_id]" ORDER BY created DESC`
3. 조회된 티켓 목록을 번호와 함께 보여주고 선택 요청:
   ```
   "To Do" 상태의 티켓 목록입니다. 변경할 티켓 번호를 선택하세요:
   1. GAD-1: 티켓 제목
   2. GAD-2: 티켓 제목
   3. GAD-3: 티켓 제목

   전체 선택: all / 개별 선택: 1,3 / 범위 선택: 1-3
   ```
4. 사용자 선택 파싱:
   - `all` → 전체 티켓
   - `1,3` → 1번, 3번 티켓
   - `1-3` → 1번~3번 티켓
5. 변경 대상 티켓 목록과 함께 최종 확인 요청:
   ```
   다음 N개 티켓을 "To Do" → "In Progress"로 변경합니다:
   - GAD-1: 티켓 제목
   - GAD-3: 티켓 제목

   진행할까요?
   ```
6. 확인 후 첫 번째 티켓에 `getTransitionsForJiraIssue`로 유효한 transition ID 조회
7. 변경할 상태와 매칭되는 transition ID로 모든 대상 티켓에 `transitionJiraIssue` 순차 적용
8. 완료 결과 반환:
   ```
   ✓ GAD-1: In Progress로 변경 완료
   ✓ GAD-3: In Progress로 변경 완료
   총 2개 티켓 상태 변경 완료
   ```

## 주의사항

- 프로젝트에 따라 사용 가능한 transition이 다를 수 있으므로 항상 `getTransitionsForJiraIssue`로 먼저 조회합니다
- 조회된 티켓이 없는 경우 해당 상태에 티켓이 없음을 안내합니다
- Atlassian MCP가 연결되지 않은 경우 사용자에게 `claude mcp list` 실행을 안내합니다
