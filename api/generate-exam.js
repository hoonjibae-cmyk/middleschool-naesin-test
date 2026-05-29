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
  const idx = Number(sectionIndex) || 1;
  const endNo = startNo + count - 1;

  if (hasTextbookSources) {
    const pattern = (idx - 1) % 6;
    if (pattern === 0) return `[v17 교과서 원문 기반 설계: ${startNo}~${endNo}번]
- 저장 교과서 자료의 Munjado 정의/여덟 한자/상징 의미 원문을 기반으로 출제한다.
- 유형: 내용 불일치, 제목/요지, 지칭어/어휘 중 조합.
- 원문에 없는 Big data, Kimchi, Tea Ceremony, Plastic, Social Media 등 새 소재 금지.`;
    if (pattern === 1) return `[v17 교과서 원문 기반 설계: ${startNo}~${endNo}번]
- 저장 교과서 자료의 hyo/잉어/어머니 이야기, 가정법 과거, to부정사의 의미상 주어를 기반으로 출제한다.
- 유형: 내용일치/불일치, 빈칸, 어법상 어색한 것, 문맥어휘 중 조합.`;
    if (pattern === 2) return `[v17 교과서 원문 기반 설계: ${startNo}~${endNo}번]
- 저장 교과서 자료의 bamboo/chung, lotus/ui, loyalty/justice/despite difficulties 원문을 기반으로 출제한다.
- 유형: 내용 불일치, 제목/요지, 연결어/전치사, 어휘 의미관계 중 조합.`;
    if (pattern === 3) return `[v17 교과서 원문 기반 설계: ${startNo}~${endNo}번]
- 저장 교과서 자료의 Munjado as a study tool, remind A of B, harmony in family and society 원문을 기반으로 출제한다.
- 유형: 요지, 내용일치, 어법, 지칭어 중 조합.`;
    if (pattern === 4) return `[v17 교과서 원문 기반 설계: ${startNo}~${endNo}번]
- 저장 교과서 대화문의 선호 표현, 의견 표현, 전시회/탈춤 공연 대화 기반으로 출제한다.
- 유형: 내용일치, Q&A 짝짓기, 마지막 행동, 흐름상 어색한 문장 중 조합.`;
    return `[v17 교과서 원문 기반 설계: ${startNo}~${endNo}번]
- 저장 교과서 문법 포인트 집중: 가정법 과거, to부정사의 의미상 주어, 주격 관계대명사, despite, remind A of B, 현재완료 경험.
- 유형: ⓐ~ⓔ 어법상 어색한 것, 모두 고르기, 개수 세기, 용법 구분 중 조합.`;
  }

  if (total <= 8) {
    if (idx === 1) {
      return `[v15 미강중3 강제 설계: ${startNo}~${endNo}번]
- 1번: Munjado/문자도 문화 설명문. 내용 불일치. 주제어: Chinese characters, Confucian virtues, filial piety, loyalty, trust, Joseon ordinary people. 왕실 전용/자연 풍경 전용 같은 명백한 소재 이탈은 1개 이하만 사용하고, 나머지는 대상·범위·목적을 살짝 바꾼 함정으로 구성.
- 2번: 같은 Munjado 지문 기반 제목/요지. passage는 빈 문자열. 너무 넓은 제목, 너무 좁은 제목, 소재는 맞지만 결론이 다른 제목을 섞기.
- 3번: Big data 정보 설명문. 빈칸 또는 내용일치. 주제어: collect, analyze, patterns, predict, recommend, decisions. 단순 IT 상식이 아니라 지문 흐름 근거로 풀리게 만들기.
- 4번: 같은 Big data 지문 기반 어법/문맥어휘. passage는 빈 문자열. 앞 지문 핵심 문장에 ⓐ~ⓔ 또는 [u]밑줄[/u] 표시를 사용.`;
    }
    return `[v15 미강중3 강제 설계: ${startNo}~${endNo}번]
- 5번: presentation을 앞둔 학생에게 조언하는 대화문. 내용일치. outline, practice from notes, deep breath, record/listen, main topic 중 2~3개를 포함.
- 6번: 같은 대화문 기반 Q&A 짝짓기 또는 마지막 조언. passage는 빈 문자열. 단순 내용일치 반복 금지.
- 7번: 연결어/전치사/문맥어휘 변별. though/despite/because of/if/unless/when 중 실제 문장 구조로 판단하게 만들기. 앞선 소재와 연결.
- 8번: as 용법 또는 밑줄 어법 변별. '~할 때', '~로서', '~처럼', 'as...as'를 구분하게 하되 예문은 짧게.`;
  }

  const pattern = (idx - 1) % 5;
  if (pattern === 0) return `[v15 미강중3 강제 설계: ${startNo}~${endNo}번]
- 문화/설명문 묶음. Munjado, Korean folk painting, Confucian virtues, symbols in letters 중 하나의 지문으로 2문항 이상 연계.
- 유형: 내용 불일치 + 제목/요지 + 지칭어/어휘 중 조합.
- passage는 첫 문항에만, 후속 문항은 빈 문자열.`;
  if (pattern === 1) return `[v15 미강중3 강제 설계: ${startNo}~${endNo}번]
- 정보 설명문 묶음. Big data, technology, robot/library, recommendation/prediction 중 하나.
- 유형: 빈칸 + 내용일치/불일치 + 어법/문맥어휘 중 조합.
- 단순 일반상식 문제 금지. 지문 근거가 있어야 함.`;
  if (pattern === 2) return `[v15 미강중3 강제 설계: ${startNo}~${endNo}번]
- 대화문 묶음. presentation advice, exhibition choice, library robot instructions, transportation card procedure 중 하나.
- 유형: 내용일치 + Q&A 짝짓기 + 흐름상 어색한 문장/마지막 조언 중 조합.
- 대화문은 8~10줄 이내.`;
  if (pattern === 3) return `[v15 미강중3 강제 설계: ${startNo}~${endNo}번]
- 어법/어휘 변별 묶음. 앞선 소재와 연결된 짧은 지문 또는 대화문 활용.
- 유형: ⓐ~ⓔ 어법상 어색한 것, 모두 고르기, 개수 세기, 접속사/전치사 구분.
- 가정법, 형용사/부사, 동명사, though/despite, as 용법 중 1~2개 반영.`;
  return `[v15 미강중3 강제 설계: ${startNo}~${endNo}번]
- 고난도 종합 묶음. 일기/편지/설명문 중 하나.
- 유형: 내용 불일치, 요지/속담, as 용법, 문맥어휘 의미관계 중 조합.
- 함정 선택지는 지문 표현을 한 요소만 바꾼 형태로 구성.`;
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
  while (isObj && choices.length < 5) choices.push('보기 없음');
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

${blueprint}\n\n[이번 구간 생성 지시]\n전체 ${Number(fullTotal) || requestedTotal}문항 중 ${sectionIndex}/${sectionTotal}구간입니다.\n이번 구간 역할: ${sectionLabel}\n문항 번호: ${startNo}번부터 ${startNo + requestedTotal - 1}번까지\n정확히 ${requestedTotal}문항만 생성하세요. 객관식 ${requestedObjective}문항, 서술형 ${requestedSubjective}문항입니다.\n\n[품질 규칙]\n- passage는 구간당 최대 2개까지 허용합니다. 단, 같은 지문 연계 후속 문항은 passage를 빈 문자열로 두세요.\n- passage는 65~95단어, 대화문은 7~10줄 이내로 짧게 쓰세요.\n- 선택지는 객관식마다 정확히 5개, 각 선택지는 16단어 이내입니다.
- 저장 교과서 자료가 제공된 경우, 반드시 그 원문/대화문을 기반으로 출제하세요. 저장 원문에 없는 Big data, Kimchi, Tea Ceremony, Plastic, Social Media 등 새 소재는 외부지문 비율이 있을 때만 허용합니다.
- camouflage, plastic pollution, social media처럼 미강중3 프로필과 무관한 일반 독해 소재는 사용하지 마세요. 단, 사용자가 외부 지문으로 직접 입력한 경우는 예외입니다.
- 선택지에는 그럴듯한 함정 2개 이상을 포함하세요.\n- explanation은 1문장만 쓰세요.\n- 서술형 0문항이면 서술형을 절대 만들지 마세요.\n\n[출력 형식]\n반드시 순수 JSON 배열만 출력하세요. 코드블록, 설명, 한국어 머리말을 절대 붙이지 마세요.\n각 객체 필드: number,type,subtype,format,difficulty,passage,stem,choices,answer,explanation,points\n객관식 answer는 1~5 숫자입니다.\n예시: [{"number":${startNo},"type":"내용일치","subtype":"불일치","format":"객관식","difficulty":"보통","passage":"...","stem":"위 글의 내용과 일치하지 않는 것은?","choices":["...","...","...","...","..."],"answer":1,"explanation":"...","points":4}]`;

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
