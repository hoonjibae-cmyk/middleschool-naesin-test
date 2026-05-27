# 목동유쌤 중등 내신 모의고사 제조기 - JSON 프로필 기반 버전

## 핵심 변경점

기존 `index.html`은 브라우저에서 Claude API를 직접 호출하고, 기출 PDF 스타일을 텍스트 설명으로만 전달했습니다. 이 버전은 다음 구조로 변경했습니다.

1. `data/exam-profiles.json`에 학교별/학년별/학기별 기출 분석 결과를 저장합니다.
2. 프론트의 `buildPrompt()`가 선택된 학교·학년·기출 학기의 JSON 프로필을 읽어 프롬프트에 삽입합니다.
3. Claude API Key는 브라우저에 저장하지 않고, Vercel 서버 환경변수 `ANTHROPIC_API_KEY`에 저장합니다.
4. 프론트는 `/api/generate-exam`만 호출합니다.

## 폴더 구조

```txt
/index.html
/data/exam-profiles.json
/api/generate-exam.js
/package.json
/vercel.json
```

## 배포 방법, Vercel 기준

1. 이 폴더 전체를 GitHub 저장소에 업로드합니다.
2. Vercel에서 해당 GitHub 저장소를 Import합니다.
3. Vercel Project Settings → Environment Variables에 아래 값을 추가합니다.

```txt
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

4. Deploy 후 접속합니다.

## 기출 PDF를 JSON 프로필로 바꾸는 운영 방식

1. 학교별 기출 PDF를 Claude에 업로드합니다.
2. Claude에게 아래 항목을 JSON으로 분석하게 합니다.
   - 총 문항 수
   - 객관식/서술형 수
   - 자주 나오는 유형
   - 발문 스타일
   - 서술형 답안 방식
   - 지문 배치 방식
   - 난이도/선택지 특징
3. 분석 결과를 `data/exam-profiles.json`의 해당 학교/학년/학기 위치에 붙여넣습니다.
4. 프론트에서 해당 기출 학기를 선택하면 그 JSON 프로필이 자동으로 반영됩니다.

## exam-profiles.json 작성 예시

```json
{
  "misagang": {
    "1": {
      "2025_1": {
        "school": "미사강변중학교",
        "grade": 1,
        "exam": "2025_1",
        "source_pdf": "미사강변중_1학년_2025_1학기.pdf",
        "format_profile": {
          "total_questions": 25,
          "objective_questions": 22,
          "subjective_questions": 3,
          "common_types": ["어법·어휘", "내용일치", "빈칸추론", "서술형 영작"],
          "style_notes": [
            "교과서 본문 변형과 어법 확인 문항 비중이 높음",
            "서술형은 조건 제시형 영작과 핵심 문장 재구성이 중심"
          ]
        },
        "layout_rules": {
          "passage_first": true,
          "answer_space_for_subjective": true
        }
      }
    }
  }
}
```

## 주의

- `exam-profiles.json`에 들어간 샘플 데이터는 실제 기출 분석값이 아니라 구조 예시입니다. 실제 PDF 분석 결과로 교체해야 합니다.
- GitHub Pages만으로는 `/api/generate-exam`이 동작하지 않습니다. Vercel, Netlify Functions, Cloudflare Workers 중 하나가 필요합니다.


## 2026-05-27 Timeout Fix 버전

- Vercel 60초 타임아웃 방지를 위해 Claude `max_tokens` 기본값을 2500으로 낮췄습니다.
- 초기 테스트 문항 수를 총 8문항(객관식 7, 서술형 1)으로 낮췄습니다.
- 서버/API 오류가 났을 때 브라우저 콘솔과 Vercel 로그에서 원인을 더 쉽게 확인할 수 있도록 오류 로그를 보강했습니다.
- 더 많은 문항을 생성하려면 먼저 8문항 생성이 정상 작동하는지 확인한 뒤, 화면에서 문항 수를 조금씩 늘려 테스트하세요.


## 2026-05-27 업데이트
- 미강중학교(미사강변중학교) 3학년 2025년 2학기 2차 기말고사 PDF 분석 프로필을 `data/exam-profiles.json`에 추가했습니다.
- 해당 프로필은 전체 25문항 객관식 중심, 5지선다, 어법/내용일치/제목/빈칸/용법 구분 중심의 출제 성향을 반영합니다.
