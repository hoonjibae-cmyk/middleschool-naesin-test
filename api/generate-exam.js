function compactUserPrompt(prompt, maxChars = 5200) {
  const text = String(prompt || '');
  const keepSections = [];
  const sectionNames = ['[학교 정보]', '[저장된 학교별 기출 분석 JSON 프로필]', '[교재 및 시험 범위]', '[출제 조건]', '[외부 지문]'];
  for (let i = 0; i < sectionNames.length; i++) {
    const name = sectionNames[i];
    const start = text.indexOf(name);
    if (start >= 0) {
      const nextStarts = sectionNames.map(n => text.indexOf(n, start + name.length)).filter(x => x > start);
      const end = nextStarts.length ? Math.min(...nextStarts) : text.length;
      keepSections.push(text.slice(start, end).trim());
    }
  }
  const joined = keepSections.length ? keepSections.join('\n\n') : text.slice(0, maxChars);
  return joined.length > maxChars ? joined.slice(0, maxChars) : joined;
}

function extractJsonArray(text) {
  if (!text || typeof text !== 'string') return null;
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();

  // 1) JSON object {questions:[...]} 허용
  try {
    const obj = JSON.parse(t);
    if (Array.isArray(obj)) return obj;
    if (obj && Array.isArray(obj.questions)) return obj.questions;
  } catch (_) {}

  // 2) 본문 중 첫 배열만 추출
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start >= 0 && end > start) {
    const slice = t.slice(start, end + 1);
    try { return JSON.parse(slice); } catch (_) {}
  }
  return null;
}

function normalizeQuestion(q, idx, startNumber) {
  const isObj = q?.format !== '서술형';
  const choices = Array.isArray(q?.choices) ? q.choices.map(c => String(c || '').trim()).filter(Boolean).slice(0, 5) : [];
  while (isObj && choices.length < 5) choices.push('보기 오류');
  return {
    number: Number(startNumber) + idx,
    type: String(q?.type || '내신형'),
    subtype: String(q?.subtype || ''),
    format: isObj ? '객관식' : '서술형',
    difficulty: String(q?.difficulty || '보통'),
    passage: String(q?.passage || ''),
    stem: String(q?.stem || '다음 물음에 답하시오.'),
    choices: isObj ? choices : [],
    answer: q?.answer ?? (isObj ? 1 : '모범답안'),
    explanation: String(q?.explanation || '정답 근거를 확인하세요.'),
    points: Number(q?.points || (idx % 3 === 0 ? 4 : 3))
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { prompt, fullTotal, total = 6, subjective = 0, sectionIndex = 1, sectionTotal = 1, startNumber = 1, sectionLabel = '종합' } = req.body || {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt가 없습니다.' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: '서버 환경변수 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.' });

    const requestedTotal = Math.max(1, Math.min(6, Number(total) || 6));
    const requestedSubjective = Math.max(0, Math.min(requestedTotal, Number(subjective) || 0));
    const requestedObjective = requestedTotal - requestedSubjective;
    const startNo = Number(startNumber) || 1;
    const essentialPrompt = compactUserPrompt(prompt);

    const stablePrompt = `${essentialPrompt}\n\n[분할 생성: 이번 구간만 생성]\n- 전체 시험은 ${Number(fullTotal) || requestedTotal}문항이며, 지금은 ${sectionTotal}개 구간 중 ${sectionIndex}번째 구간입니다.\n- 이번 구간의 역할: ${sectionLabel}\n- 이번 구간 번호는 ${startNo}번부터 ${startNo + requestedTotal - 1}번까지입니다.\n- 정확히 ${requestedTotal}문항만 생성하세요. 객관식 ${requestedObjective}문항, 서술형 ${requestedSubjective}문항입니다.\n- 문항 number는 반드시 ${startNo}, ${startNo + 1}, ... 순서로 부여하세요.\n- passage는 구간 안에서 최대 2개만 쓰세요. 같은 passage 연계 후속 문항은 passage를 빈 문자열로 두세요.\n- passage는 55~75단어, 대화문은 6~8줄 이내로 짧게 작성하세요.\n- 선택지는 객관식마다 정확히 5개, 각 선택지는 16단어 이내입니다.\n- 내용일치/불일치 오답은 대상·범위·원인·결과 중 하나만 바꾼 함정형을 포함하세요.\n- 제목/요지 문제는 그럴듯한 오답 2개를 포함하세요.\n- 어법 문제는 앞 지문 문장을 활용하고 ⓐ~ⓔ 또는 [u]밑줄[/u] 표시를 사용하세요.\n- explanation은 1문장만 작성하세요.\n\n[출력 규칙]\n아래 JSON 배열만 출력하세요. 코드블록, 설명문, 머리말, 꼬리말은 절대 출력하지 마세요.\n필드: number,type,subtype,format,difficulty,passage,stem,choices,answer,explanation,points\n객관식 answer는 1~5 숫자입니다.\n예시 형식:\n[{\"number\":${startNo},\"type\":\"내용일치\",\"subtype\":\"불일치\",\"format\":\"객관식\",\"difficulty\":\"보통\",\"passage\":\"...\",\"stem\":\"위 글의 내용과 일치하지 않는 것은?\",\"choices\":[\"...\",\"...\",\"...\",\"...\",\"...\"],\"answer\":1,\"explanation\":\"...\",\"points\":4}]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 43000);

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
          model: process.env.ANTHROPIC_FAST_MODEL || process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
          max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 2200),
          temperature: 0.22,
          messages: [{ role: 'user', content: stablePrompt }]
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

    const text = Array.isArray(data?.content) ? data.content.map(b => b.text || '').join('\n') : '';
    const arr = extractJsonArray(text);
    if (!Array.isArray(arr) || arr.length === 0) {
      return res.status(502).json({
        error: 'Claude 응답에서 JSON 문항 배열을 찾지 못했습니다. 다시 생성해 주세요.',
        preview: text.slice(0, 500)
      });
    }

    const questions = arr.slice(0, requestedTotal).map((q, i) => normalizeQuestion(q, i, startNo));
    return res.status(200).json({ questions });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: '생성 시간이 길어 중단했습니다. 6문항 단위 생성으로 다시 시도해 주세요.' });
    }
    return res.status(500).json({ error: err?.message || String(err) || '서버 오류' });
  }
}
