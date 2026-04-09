# ghostdev-agent Rate Limit 에러 원인 및 수정

## 문제

```
RetryError: Failed after 3 attempts.
```

ghostdev 에이전트가 rate limit(429)에 걸렸을 때 outer retry 없이 바로 종료되는 문제.

## 근본 원인

`publish-agent.yml`은 `packages/ghostdev-agent/**` 변경 시 자동으로 npm 패키지를 발행한다.
그런데 `package.json`의 버전이 `0.1.0`으로 고정된 채 코드만 변경되어 main에 푸시되었고,
npm은 **동일 버전을 재발행할 수 없기 때문에** CI가 409 에러로 실패했다.

결과적으로 `@latest`는 구버전 `0.1.0`을 계속 가리키고 있었고,
`56cec7a` 커밋에서 추가한 outer retry 로직(`MAX_OUTER_RETRIES`, `RATE_LIMIT_RESET_BUFFER_MS`)이
실제 실행 환경에 반영되지 않았다.

## 에러 흐름

1. 에이전트 실행 → 스텝이 쌓일수록 대화 히스토리 증가
2. 누적 input token이 30,000/min 한도 초과 → API 429 반환
3. AI SDK 내부 retry 3회 모두 실패 → `RetryError` throw
4. 구버전에는 outer retry 코드 없음 → 프로세스 exit 1

## 수정 내용

| 파일 | 변경 내용 |
|------|-----------|
| `packages/ghostdev-agent/package.json` | `version` `0.1.0` → `0.1.1` |
| `packages/ghostdev-agent/src/agent/index.ts` | `retry-after` 헤더 파싱 함수 추가 |

버전을 올려 publish가 성공하게 하고, outer retry 대기 시 고정 65초 대신 API 응답의 `retry-after` 헤더 값(+ 5초 버퍼)을 사용하도록 개선.

## 재발 방지

코드 변경 후 `packages/ghostdev-agent/package.json`의 버전을 함께 올려야 패키지가 정상 발행된다.
