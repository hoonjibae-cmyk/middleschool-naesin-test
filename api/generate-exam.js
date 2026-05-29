function compactUserPrompt(prompt, maxChars = 4200) {
  const text = String(prompt || '');
  const keepSections = [];
  const sectionNames = ['[학교 정보]', '[교재 및 시험 범위]', '[저장 교과서 자료', '[출제 조건]', '[외부 지문]'];
  for (let i = 0; i < sectionNames.length; i++) {
    const name = sectionNames[i];
    const start = text.indexOf(name);
    if (start >= 0) {
      const nextStarts = sectionNames.map(n => text.indexOf(n, start + name.length)).filter(x => x > start);
      const end = nextStarts.length ? Math.min(...nextStarts) : text.length;
      keepSections.push(text.slice(start, end).trim());
    }
  }
  const migang = text.includes('미강중3') || text.includes('미사강변중학교')
    ? `[미강중3 핵심 규칙]\n- 지문 근거 독해, 문맥 어휘, 지문 속 문법 판단을 우선한다.\n- 내용일치/불일치는 대상·범위·목적·결과 중 하나만 바꾼 함정형 오답을 포함한다.\n- 제목/요지는 너무 넓은 제목, 너무 좁은 제목, 소재는 맞지만 결론이 다른 제목을 섞는다.\n- 어법은 앞 지문의 핵심 문장을 변형하고 ⓐ~ⓔ 또는 [u]밑줄[/u]을 사용한다.\n- 같은 지문 연계 문항은 첫 문항만 passage를 넣고 후속 문항은 빈 문자열로 둔다.`
    : '';
  const joined = [migang, ...keepSections].filter(Boolean).join('\n\n') || text.slice(0, maxChars);
  return joined.length > maxChars ? joined.slice(0, maxChars) : joined;
}

function getMigangBlueprint({ fullTotal, sectionIndex, startNo, count, subjective, hasTextbookSources=false }) {
  const total = Number(fullTotal) || count;
  const s = Number(startNo) || 1;
  const e = s + Number(count || 4) - 1;

  // v24: 저장 교과서 자료가 있을 때는 전체 문항의 역할을 먼저 고정한다.
  // 목적: 30문항에서 같은 Munjado/hyo story가 반복되는 문제를 줄이고, Lesson 8 전체 범위를 고르게 훑게 한다.
  if (hasTextbookSources) {
    if (total >= 24) {
      if (s <= 4) return `[v24 30문항 Blueprint: ${s}~${e}번 · Dialogue/기능]
- 사용할 자료: L8_dialogue_01 고양이 그림 선호, L8_dialogue_02 탈 전시회/탈춤 공연.
- 목표: 의사소통 기능 prefer, It seems to me that, Which one would you like to, 현재완료 경험을 점검한다.
- 유형 배분: 대화 내용일치 1, 대화 내용불일치 1, Q&A/마지막 행동 1, 흐름상 어색한 문장 또는 표현 의미 1.
- 금지: Reading Munjado 본문을 이 구간에서 반복하지 말 것.`;
      if (s <= 8) return `[v24 30문항 Blueprint: ${s}~${e}번 · Reading 1]
- 사용할 자료: L8_reading_01 문자도 정의/여덟 한자.
- 목표: Munjado의 정의, late Joseon dynasty, Chinese character+objects, eight values, They 지칭을 점검한다.
- 유형 배분: 내용불일치 1, 제목/요지 1, 지칭어 They/it 1, 어휘/표현 의미 1.
- 주의: hyo story, bamboo/lotus 내용은 이 구간에서 묻지 않는다.`;
      if (s <= 12) return `[v24 30문항 Blueprint: ${s}~${e}번 · Reading 2]
- 사용할 자료: L8_reading_02 효와 잉어 이야기 시작/가정법.
- 목표: symbolic, because of, go as follows, became ill, It would be wonderful if I could eat fresh fish를 점검한다.
- 유형 배분: 빈칸 1, 내용추론/이유 1, 가정법 과거 어법 1, 문맥어휘 1.
- 어법 후보형 문항은 지문 안 ①~⑤ 표시를 사용하고 중복 선택지를 만들지 않는다.`;
      if (s <= 16) return `[v24 30문항 Blueprint: ${s}~${e}번 · Reading 3]
- 사용할 자료: L8_reading_03 강/잉어/to부정사의 의미상 주어.
- 목표: frozen river, impossible for him to catch, so disappointed that, ice melted, three carp, cooked fish for his mother를 점검한다.
- 유형 배분: 사건 순서/내용일치 1, 빈칸/어휘 1, to부정사의 의미상 주어 어법 1, so~that/단복수 fish 변별 1.
- 금지: reading_02의 어머니가 fresh fish를 말한 장면을 반복 출제하지 말고, 사건의 결과 부분을 중심으로 낸다.`;
      if (s <= 20) return `[v24 30문항 Blueprint: ${s}~${e}번 · Reading 4]
- 사용할 자료: L8_reading_04 대나무/연꽃/충·의.
- 목표: bamboo/chung/loyalty, lotus/ui/justice, stay green, come to symbolize, despite difficulties를 점검한다.
- 유형 배분: 내용불일치 1, 제목/요지 1, despite/전치사구 1, come to symbolize/stay 형용사 어법 1.
- 오답은 bamboo와 lotus의 상징 의미를 서로 바꾸는 함정을 포함한다.`;
      if (s <= 24) return `[v24 30문항 Blueprint: ${s}~${e}번 · Reading 5]
- 사용할 자료: L8_reading_05 문자도의 교육적 의미.
- 목표: more than a painting, reminded them of, important values that influenced behaviors and attitudes, study tool, harmony in family and society를 점검한다.
- 유형 배분: 요지 1, 내용일치/불일치 1, remind A of B 의미 1, 주격 관계대명사 that/could 어법 1.
- 금지: 앞 구간의 bamboo/lotus passage를 다시 쓰지 않는다.`;
      return `[v25 30문항 Blueprint: ${s}~${e}번 · 종합 고난도]
- 사용할 자료: Lesson 8 전체 중 앞 구간에서 직접 묻지 않은 표현과 문장 구조만 사용한다.
- 목표: 전체 내용 종합, 문장 삽입/순서, 요약문 완성, 어법 종합, 대화 완성.
- 유형 배분: ${s}~${e}번 안에서 문장삽입/순서 1, 요약문/주제 1, 어법 종합 1, 대화 완성 또는 지칭어 1 이상.
- 금지: 1~24번의 passage를 그대로 복사해 같은 내용일치/제목 문제를 반복하지 않는다.
- 긴 passage는 최대 1개만 사용하고, 나머지는 짧은 문장형 또는 대화 완성형으로 낸다.
- choices에 '보기 없음'을 넣지 않는다. 지문 안 ①~⑤ 후보형이면 choices는 []로 둔다.`;
    }

    if (total >= 12) {
      if (s <= 4) return `[v24 12~20문항 Blueprint: ${s}~${e}번]
- 사용할 자료: L8_dialogue_01/02 또는 L8_reading_01.
- 유형: 대화 내용일치/Q&A 또는 Munjado 정의 내용불일치/제목/지칭어.
- 첫 구간부터 Reading만 반복하지 말고 대화문 1문항 이상을 포함한다.`;
      if (s <= 8) return `[v24 12~20문항 Blueprint: ${s}~${e}번]
- 사용할 자료: L8_reading_02/03 hyo story와 river/carp.
- 유형: 빈칸, 이유 추론, 가정법 과거, to부정사 의미상 주어.
- 같은 사실을 내용일치로 반복하지 않는다.`;
      if (s <= 12) return `[v24 12~20문항 Blueprint: ${s}~${e}번]
- 사용할 자료: L8_reading_04 bamboo/lotus.
- 유형: 내용불일치, 제목/요지, despite, come to symbolize.
- bamboo와 lotus 상징 의미를 구분하는 함정을 포함한다.`;
      return `[v24 12~20문항 Blueprint: ${s}~${e}번]
- 사용할 자료: L8_reading_05 또는 전체 종합.
- 유형: remind A of B, 주격 관계대명사, 요약문, 문장삽입/순서.
- 앞 구간의 passage를 그대로 반복하지 않는다.`;
    }

    // 8문항 이하
    if (s <= 4) return `[v24 8문항 Blueprint: ${s}~${e}번]
- 1~2번: Munjado 정의/여덟 한자 기반 내용불일치+제목/지칭어.
- 3~4번: hyo story 또는 river/carp 기반 빈칸+어법.`;
    return `[v24 8문항 Blueprint: ${s}~${e}번]
- 5~6번: bamboo/lotus 또는 대화문 기반 내용/표현.
- 7~8번: despite/as/to부정사/가정법 중 어법 변별.`;
  }

  // 저장 교과서 자료가 없을 때의 기존 스타일 기반 설계
  if (total <= 8) {
    if (s <= 4) {
      return `[v24 미강중3 스타일 설계: ${s}~${e}번]
- Munjado 문화 설명문과 Big data 정보문을 각각 2문항씩 구성한다.
- 내용불일치, 제목/요지, 빈칸, 어법/어휘를 섞는다.`;
    }
    return `[v24 미강중3 스타일 설계: ${s}~${e}번]
- presentation advice 대화문 2문항, 연결어/전치사 1문항, as 용법 1문항으로 구성한다.`;
  }

  const pattern = (Number(sectionIndex) - 1) % 5;
  if (pattern === 0) return `[v24 스타일 설계: ${s}~${e}번] 문화/설명문. 내용불일치+제목+지칭어/어휘.`;
  if (pattern === 1) return `[v24 스타일 설계: ${s}~${e}번] 정보 설명문. 빈칸+내용일치+어법/문맥어휘.`;
  if (pattern === 2) return `[v24 스타일 설계: ${s}~${e}번] 대화문. 내용일치+Q&A+흐름상 어색한 문장.`;
  if (pattern === 3) return `[v24 스타일 설계: ${s}~${e}번] 어법/어휘. 모두 고르기, 개수 세기, 접속사/전치사.`;
  return `[v24 스타일 설계: ${s}~${e}번] 고난도 종합. 요지, 속담/요약, as 용법, 의미관계.`;
}

function stripCodeFence(t) {
  return String(t || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

function findFirstJsonArray(text) {
  const t = stripCodeFence(text);
  let start = -1, depth = 0, inStr = false, esc = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '[') { if (depth === 0) start = i; depth++; }
    else if (ch === ']') {
      depth--;
      if (depth === 0 && start >= 0) return t.slice(start, i + 1);
    }
  }
  return null;
}

function extractQuestions(text) {
  const t = stripCodeFence(text);
  try {
    const obj = JSON.parse(t);
    if (Array.isArray(obj)) return obj;
    if (obj && Array.isArray(obj.questions)) return obj.questions;
  } catch (_) {}
  const arrText = findFirstJsonArray(t);
  if (arrText) {
    try { return JSON.parse(arrText); } catch (_) {}
  }
  return null;
}

function normalizeQuestion(q, idx, startNumber) {
  const isObj = q?.format !== '서술형';
  const choices = Array.isArray(q?.choices) ? q.choices.map(c => String(c || '').trim()).filter(Boolean).slice(0, 5) : [];
  const combinedText = String(q?.passage || '') + ' ' + String(q?.stem || '');
  const hasInlineNumbers = (combinedText.match(/[①②③④⑤ⓐⓑⓒⓓⓔ]/g) || []).length >= 3;
  if (isObj && choices.length < 5 && !hasInlineNumbers) {
    while (choices.length < 5) choices.push(`선택지 보완 필요 ${choices.length + 1}`);
  }
  let answer = q?.answer ?? (isObj ? 1 : '모범답안');
  if (isObj) {
    if (typeof answer === 'string') {
      const circ = { '①':1, '②':2, '③':3, '④':4, '⑤':5 };
      const foundCirc = Object.entries(circ).find(([k]) => answer.includes(k));
      if (foundCirc) answer = foundCirc[1];
      else {
        const m = answer.match(/[1-5]/);
        answer = m ? Number(m[0]) : 1;
      }
    }
    answer = Math.max(1, Math.min(5, Number(answer) || 1));
  }
  return {
    number: Number(startNumber) + idx,
    type: String(q?.type || '내신형'),
    subtype: String(q?.subtype || ''),
    format: isObj ? '객관식' : '서술형',
    difficulty: String(q?.difficulty || '보통'),
    passage: String(q?.passage || ''),
    stem: String(q?.stem || '다음 물음에 답하시오.'),
    choices: isObj ? choices : [],
    answer,
    explanation: String(q?.explanation || '정답 근거를 확인하세요.'),
    points: Number(q?.points || (idx % 3 === 0 ? 4 : 3))
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { prompt, fullTotal, total = 4, subjective = 0, sectionIndex = 1, sectionTotal = 1, startNumber = 1, sectionLabel = '종합' } = req.body || {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt가 없습니다.' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: '서버 환경변수 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.' });

    const requestedTotal = Math.max(1, Math.min(4, Number(total) || 4));
    const requestedSubjective = Math.max(0, Math.min(requestedTotal, Number(subjective) || 0));
    const requestedObjective = requestedTotal - requestedSubjective;
    const startNo = Number(startNumber) || 1;
    const essentialPrompt = compactUserPrompt(prompt, 7600);
    const hasTextbookSources = prompt.includes('[저장 교과서 자료');
    const blueprint = getMigangBlueprint({ fullTotal, sectionIndex, startNo, count: requestedTotal, subjective: requestedSubjective, hasTextbookSources });

    const stablePrompt = `${essentialPrompt}

${blueprint}\n\n[이번 구간 생성 지시]\n전체 ${Number(fullTotal) || requestedTotal}문항 중 ${sectionIndex}/${sectionTotal}구간입니다.\n이번 구간 역할: ${sectionLabel}\n문항 번호: ${startNo}번부터 ${startNo + requestedTotal - 1}번까지\n정확히 ${requestedTotal}문항만 생성하세요. 객관식 ${requestedObjective}문항, 서술형 ${requestedSubjective}문항입니다.\n\n[품질 규칙]\n- passage는 구간당 최대 2개까지 허용합니다. 단, 같은 지문 연계 후속 문항은 passage를 빈 문자열로 두세요.\n- passage는 65~95단어, 대화문은 7~10줄 이내로 짧게 쓰세요.\n- 일반 객관식 선택지는 정확히 5개, 각 선택지는 16단어 이내입니다. choices에 '보기 없음'을 절대 넣지 마세요. 지문 안 ①~⑤ 후보를 직접 표시한 어법 문항만 choices를 빈 배열로 둘 수 있습니다.
- 저장 교과서 자료가 제공된 경우, 반드시 그 원문/대화문을 기반으로 출제하세요. 저장 원문에 없는 Big data, Kimchi, Tea Ceremony, Plastic, Social Media 등 새 소재는 외부지문 비율이 있을 때만 허용합니다.
- camouflage, plastic pollution, social media처럼 미강중3 프로필과 무관한 일반 독해 소재는 사용하지 마세요. 단, 사용자가 외부 지문으로 직접 입력한 경우는 예외입니다.
- 선택지에는 그럴듯한 함정 2개 이상을 포함하세요.
- 같은 구간 안에서 같은 발문 유형을 2회 이상 반복하지 마세요.
- 내용일치/불일치만 반복하지 말고 blueprint의 유형 배분을 우선하세요.
- 30문항 생성 시 앞 구간에서 이미 사용한 원문 소재를 뒤 구간에서 같은 방식으로 반복하지 마세요.
- 어법 후보형은 지문 안 ①~⑤ 표시 방식 또는 선택지 방식 중 하나만 사용하세요. 둘을 중복하지 마세요. 지문 안 ①~⑤ 방식이면 choices는 []로 둡니다.
- explanation은 1문장만 쓰세요.\n- 서술형 0문항이면 서술형을 절대 만들지 마세요.\n\n[출력 형식]\n반드시 순수 JSON 배열만 출력하세요. 코드블록, 설명, 한국어 머리말을 절대 붙이지 마세요.\n각 객체 필드: number,type,subtype,format,difficulty,passage,stem,choices,answer,explanation,points\n객관식 answer는 1~5 숫자입니다.\n예시: [{"number":${startNo},"type":"내용일치","subtype":"불일치","format":"객관식","difficulty":"보통","passage":"...","stem":"위 글의 내용과 일치하지 않는 것은?","choices":["...","...","...","...","..."],"answer":1,"explanation":"...","points":4}]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 38000);

    let anthropicRes;
    try {
      anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_FAST_MODEL || process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
          max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 1600),
          temperature: 0.15,
          messages: [
            { role: 'user', content: stablePrompt },
            { role: 'assistant', content: '[' }
          ]
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await anthropicRes.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

    if (!anthropicRes.ok) {
      const msg = data?.error?.message || data?.message || raw || `Claude API 오류 (${anthropicRes.status})`;
      return res.status(anthropicRes.status).json({ error: String(msg).slice(0, 1000), status: anthropicRes.status });
    }

    let text = Array.isArray(data?.content) ? data.content.map(b => b.text || '').join('\n') : '';
    // assistant prefill '['를 사용했으므로 응답이 객체부터 시작하면 여는 대괄호를 복원
    const trimmed = text.trim();
    if (trimmed && !trimmed.startsWith('[') && (trimmed.startsWith('{') || trimmed.startsWith('{\n'))) text = '[' + text;

    const arr = extractQuestions(text);
    if (!Array.isArray(arr) || arr.length === 0) {
      return res.status(502).json({
        error: 'Claude 응답에서 JSON 문항 배열을 찾지 못했습니다. 같은 구간을 다시 생성해 주세요.',
        preview: text.slice(0, 500)
      });
    }

    const questions = arr.slice(0, requestedTotal).map((q, i) => normalizeQuestion(q, i, startNo));
    return res.status(200).json({ questions });
  } catch (err) {
    if (err?.name === 'AbortError') return res.status(504).json({ error: '생성 시간이 길어 중단했습니다. 문항 수를 줄이거나 다시 생성해 주세요.' });
    return res.status(500).json({ error: err?.message || String(err) || '서버 오류' });
  }
}
