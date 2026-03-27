---
description: Jira 티켓을 자동 생성합니다. ghostdev/GhostDev 관련이면 GAD 프로젝트, pin-plate/지도/마커 관련이면 KAN 프로젝트에 생성됩니다. 기본 이슈 타입은 Task입니다.
argument-hint: 티켓 내용을 간략히 설명해주세요 (예: 로그인 API 500 에러 수정)
---

# Jira 티켓 자동 생성

사용자의 요청과 현재 작업 컨텍스트(열린 파일 경로, 대화 내용)를 분석해 Atlassian MCP를 통해 Jira 티켓을 생성합니다.

## 프로젝트 판별 규칙

다음 기준으로 Jira 프로젝트 키를 결정합니다:

**GAD 프로젝트** (ghostdev 관련):
- 키워드: `ghostdev`, `ghost`, `ghost-dev`, `agent`, `github action`, `ticket run`, `agent run`, `claude agent`, `workflow dispatch`
- 파일 경로에 `apps/ghostdev` 또는 `packages/ghostdev-agent` 포함

**KAN 프로젝트** (pin-plate 관련):
- 키워드: `pin-plate`, `pinplate`, `지도`, `map`, `marker`, `마커`, `kakao`, `naver`, `위치`, `핀`
- 파일 경로에 `apps/pin-plate` 포함

판별이 불가능한 경우 사용자에게 어느 프로젝트인지 질문합니다.

## 이슈 타입 판별 규칙

- 기본값: `Task`
- 다음 키워드가 포함된 경우: `bug`, `버그`, `에러`, `error`, `fix`, `수정`, `crash`, `오류` → `Bug`
- 다음 키워드가 포함된 경우: `개선`, `refactor`, `리팩`, `cleanup`, `정리` → `Task`

## 티켓 생성 절차

1. 사용자 입력과 컨텍스트를 분석해 프로젝트 키와 이슈 타입 결정
2. 입력을 바탕으로 아래 항목을 작성:
   - **Summary (제목)**: 명확하고 간결하게 (50자 이내)
   - **Description (설명)**: 배경, 작업 범위, 완료 조건을 포함한 상세 내용 (ADF 형식으로 구성)
3. 생성 전 아래 내용을 사용자에게 보여주고 확인 요청:
   ```
   프로젝트: [GAD/KAN]
   이슈 타입: [Task/Bug/Epic]
   제목: [생성할 제목]
   설명: [생성할 설명 (마크다운 미리보기)]
   ```
4. 확인 후 Atlassian MCP의 `createJiraIssue` 도구로 티켓 생성
   - `assignee_account_id: "70121:85c7979f-3cc3-4d37-865b-13dd78c8c685"` (최정은) 기본 할당
   - `contentFormat: "adf"` 사용
   - description은 아래 ADF JSON 구조로 작성:
     ```json
     {
       "version": 1,
       "type": "doc",
       "content": [
         {
           "type": "heading",
           "attrs": { "level": 2 },
           "content": [{ "type": "text", "text": "섹션 제목" }]
         },
         {
           "type": "paragraph",
           "content": [{ "type": "text", "text": "내용" }]
         },
         {
           "type": "bulletList",
           "content": [
             {
               "type": "listItem",
               "content": [
                 { "type": "paragraph", "content": [{ "type": "text", "text": "항목" }] }
               ]
             }
           ]
         }
       ]
     }
     ```
   - 배경, 작업 범위(bulletList), 완료 조건(bulletList) 섹션을 heading으로 구분
5. 생성된 티켓 URL을 반환
6. 티켓 키와 Summary를 기반으로 브랜치명을 생성해 아래 형식으로 출력:

   **브랜치명 생성 규칙:**
   - KAN 프로젝트 → `feature/pin-plate/KAN-{번호}-{슬러그}` (base: `pin-plate`)
   - GAD 프로젝트 → `feature/ghost-dev/GAD-{번호}-{슬러그}` (base: `ghost-dev`)
   - 슬러그: Summary에서 핵심 단어 2~4개 추출, 영어 소문자, 단어 구분은 `-`
     - 예) "마커 클릭 이벤트 중복 등록 수정" → `fix-marker-click-duplicate`
     - 예) "워크스페이스 보드 필터 개선" → `improve-workspace-board-filter`

   **출력 형식:**
   ```
   티켓이 생성되었습니다!
   🔗 https://...atlassian.net/browse/{티켓-키}

   📌 추천 브랜치명:
   feature/{앱}/{티켓-키}-{슬러그}

   git checkout -b feature/{앱}/{티켓-키}-{슬러그} {베이스-브랜치}
   ```

## 주의사항

- Atlassian MCP가 연결되지 않은 경우 사용자에게 `claude mcp list` 실행을 안내합니다
- 이슈 타입 이름은 Jira 프로젝트 설정에 따라 다를 수 있으므로, 생성 실패 시 `getJiraProjectIssueTypesMetadata`로 유효한 타입을 조회 후 재시도합니다
