# 2026-03-27 트러블슈팅 & 작업 정리

---

## 1. Anthropic 프롬프트 캐싱 적용

### 배경

ghostdev-agent는 매 실행마다 긴 시스템 프롬프트를 Anthropic API로 전송한다.
시스템 프롬프트 내용은 변하지 않으므로, 반복 전송 시 불필요한 input token 비용이 발생한다.

### 해결

`generateText`의 `system` / `prompt` 단순 인자 방식에서 `messages` 배열로 전환하고,
시스템 메시지에 `experimental_providerMetadata`를 추가해 캐싱을 활성화했다.

```ts
// Before
const result = await generateText({
  model: anthropic("claude-sonnet-4-6"),
  system: buildSystemPrompt(...),
  prompt: buildTicketPrompt(...),
  ...
});

// After
const messages: CoreMessage[] = [
  {
    role: "system",
    content: buildSystemPrompt({ repoPath: process.cwd(), targetWorkspace }),
    experimental_providerMetadata: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  },
  {
    role: "user",
    content: buildTicketPrompt({ title, description, baseBranch, branchPrefix }),
  },
];

const result = await generateText({ model, messages, tools, maxSteps: 50, ... });
```

### 효과

- 동일 시스템 프롬프트 재사용 시 캐시 히트 → input token 비용 절감
- `ephemeral` 캐시는 5분간 유지됨

---

## 2. Rate Limit (429) 대응 — outer retry + step delay

### 문제

```
RetryError: Failed after 3 attempts.
```

에이전트가 스텝을 반복할수록 누적 대화 히스토리가 증가하고, input token이 Anthropic의
30,000 tokens/min 한도를 초과해 API가 429를 반환했다.
AI SDK 내부 retry 3회가 모두 실패하면 `RetryError`를 throw하는데, 이를 잡는 코드가 없어
프로세스가 바로 종료(exit 1)되었다.

### 해결

**① step 사이 딜레이 추가 (30초)**

스텝이 끝날 때마다 30초 대기해 분당 token 소모 속도를 낮췄다.

```ts
onStepFinish: async (step) => {
  for (const toolCall of step.toolCalls ?? []) {
    await logger.toolCall(toolCall.toolName, toolCall.args);
  }
  await new Promise((r) => setTimeout(r, STEP_DELAY_MS)); // 30,000ms
},
```

**② outer retry 루프 추가 (최대 3회)**

`RetryError`를 잡아서 rate limit 윈도우 리셋을 기다린 뒤 재시도한다.

```ts
const MAX_OUTER_RETRIES = 3;
const RATE_LIMIT_RESET_BUFFER_MS = 65_000; // fallback

for (let attempt = 1; attempt <= MAX_OUTER_RETRIES; attempt++) {
  try {
    result = await generateText({ ... });
    break;
  } catch (err) {
    if (RetryError.isInstance(err) && attempt < MAX_OUTER_RETRIES) {
      await logger.info(`Rate limit exhausted (attempt ${attempt}/${MAX_OUTER_RETRIES}). Waiting...`);
      await new Promise((r) => setTimeout(r, RATE_LIMIT_RESET_BUFFER_MS));
    } else {
      throw err;
    }
  }
}
```

---

## 3. retry-after 헤더 기반 대기 시간 동적 계산

### 문제

위 outer retry 로직에서 대기 시간을 고정값 65초로 하드코딩했다.
실제로 API 응답의 `retry-after` 헤더에 남은 윈도우 시간이 명시되므로, 이 값을 활용하면
불필요하게 긴 대기를 피할 수 있다.

### 해결

`RetryError`에서 마지막 에러의 `responseHeaders`를 읽어 `retry-after` 값을 파싱한다.
헤더가 없으면 65초 fallback을 사용한다.

```ts
function getRetryAfterMs(err: RetryError): number {
  const lastError = (
    err as RetryError & {
      lastError?: { responseHeaders?: Record<string, string> };
    }
  ).lastError;
  const retryAfter = lastError?.responseHeaders?.["retry-after"];
  if (retryAfter) {
    return (parseInt(retryAfter, 10) + 5) * 1000; // 헤더값 + 5초 버퍼
  }
  return RATE_LIMIT_RESET_BUFFER_MS; // 65,000ms
}

// 사용
await new Promise((r) => setTimeout(r, getRetryAfterMs(err)));
```

---

## 4. npm publish 실패 — 버전 미범프 문제

### 문제

위 수정 사항들이 포함된 커밋을 main에 push했는데, CI의 `publish-agent.yml`이 계속 실패했다.

```
npm error 403 403 Forbidden - PUT ... - You cannot publish over the previously published versions
```

### 근본 원인

`publish-agent.yml`은 `packages/ghostdev-agent/**` 변경 시 자동으로 npm 패키지를 발행한다.
그런데 `package.json`의 버전이 `0.1.0`으로 고정된 채 코드만 변경되었고,
**npm은 동일 버전을 재발행할 수 없기** 때문에 409/403 에러가 발생했다.

결과적으로 `@latest`는 구버전 `0.1.0`을 계속 가리키고 있었고,
outer retry 로직이 실제 실행 환경에 반영되지 않은 상태였다.

### 해결

`package.json`의 버전을 `0.1.0` → `0.1.1`로 범프해 publish를 성공시켰다.

### 재발 방지

> `packages/ghostdev-agent/` 코드를 변경할 때는 반드시 `package.json`의 `version`도 함께 올려야 한다.

---

## 커밋 요약

| 커밋      | 내용                                                               |
| --------- | ------------------------------------------------------------------ |
| `791988b` | Anthropic 프롬프트 캐싱 + 시스템 프롬프트 업데이트                 |
| `56cec7a` | rate limit 대응 — step delay 30초 + outer retry 로직 추가          |
| `82f3a65` | 버전 범프(0.1.0→0.1.1) + retry-after 헤더 기반 대기 시간 동적 계산 |
