function compactUserPrompt(prompt, maxChars = 7600) {
  const text = String(prompt || '');
  const keepSections = [];
  const sectionNames = ['[학교 정보]', '[저장된 학교별 기출 분석 JSON 프로필]', '[교재 및 시험 범위]', '[출제 비율]', '[출제 조건]', '[외부 지문]'];
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { prompt, fullTotal = total, total = 6, objective = 6, subjective = 0, sectionIndex = 1, sectionTotal = 1, startNumber = 1, sectionLabel = '종합' } = req.body || {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt가 없습니다.' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: '서버 환경변수 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.' });

    const requestedTotal = Math.max(1, Math.min(6, Number(total) || 6));
    const requestedSubjective = Math.max(0, Math.min(requestedTotal, Number(subjective) || 0));
    const requestedObjective = requestedTotal - requestedSubjective;

    const toolSchema = {
      name: 'submit_exam',
      description: '완성된 중학교 영어 내신 모의고사 문항 배열을 제출합니다.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          questions: {
            type: 'array',
            minItems: 1,
            maxItems: 6,
            items: {
              type: 'object',
              additionalProperties: true,
              properties: {
                number: { type: 'integer' },
                type: { type: 'string' },
                subtype: { type: 'string' },
                format: { type: 'string' },
                difficulty: { type: 'string' },
                passage: { type: 'string' },
                stem: { type: 'string' },
                choices: { type: 'array', items: { type: 'string' } },
                answer: { anyOf: [{ type: 'integer' }, { type: 'string' }] },
                explanation: { type: 'string' },
                points: { type: 'integer' }
              },
              required: ['number', 'type', 'format', 'difficulty', 'passage', 'stem', 'choices', 'answer', 'explanation']
            }
          }
        },
        required: ['questions']
      }
    };

    const essentialPrompt = compactUserPrompt(prompt);
    const stablePrompt = `${essentialPrompt}

[30문항 분할 생성 지시]
- 전체 시험은 ${Number(fullTotal)||requestedTotal}문항이지만, 지금은 ${sectionTotal}개 구간 중 ${sectionIndex}번째 구간만 생성합니다.
- 이번 구간 번호는 ${Number(startNumber)||1}번부터 ${Number(startNumber)+requestedTotal-1}번까지입니다.
- 이번 구간의 역할: ${sectionLabel}
- 이번 구간에서 정확히 ${requestedTotal}문항만 생성하세요. 객관식 ${requestedObjective}문항, 서술형 ${requestedSubjective}문항입니다.
- 각 문항 number는 반드시 ${Number(startNumber)||1}부터 시작해 순서대로 부여하세요.
- 이번 구간 안에서 지문 묶음은 최대 2개만 사용하세요. 한 묶음에서 2~3문항 연계 가능합니다.
- 설명문 passage는 55~80단어, 대화문은 6~8줄 이내로 제한하세요.
- 같은 지문 연계 문항은 연속 배치하고, 첫 문항에만 passage를 넣으세요. 후속 문항 passage는 빈 문자열입니다.
- 선택지는 5개, 각 선택지는 12~16단어 이내입니다.
- 오답은 너무 명백하게 만들지 말고 대상·범위·원인·결과 중 하나만 바꾼 함정형을 최소 2개 포함하세요.
- 제목/요지 문항은 그럴듯한 오답 2개를 포함하세요.
- 어법 문항은 앞 지문의 문장을 활용하고 ⓐ~ⓔ 또는 [u]밑줄[/u] 표시를 사용하세요.
- explanation은 1문장으로만 쓰세요.
- 반드시 submit_exam 도구로만 제출하세요.`;

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
          max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 1900),
          temperature: 0.28,
          tools: [toolSchema],
          tool_choice: { type: 'tool', name: 'submit_exam' },
          messages: [{ role: 'user', content: stablePrompt }]
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await anthropicRes.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw: raw.slice(0, 1000) }; }

    if (!anthropicRes.ok) {
      const msg = data?.error?.message || data?.message || raw || `Claude API 오류 (${anthropicRes.status})`;
      return res.status(anthropicRes.status).json({ error: String(msg).slice(0, 1000), status: anthropicRes.status });
    }

    const blocks = Array.isArray(data?.content) ? data.content : [];
    const toolUse = blocks.find(b => b.type === 'tool_use' && b.name === 'submit_exam');
    const questions = toolUse?.input?.questions;

    if (Array.isArray(questions) && questions.length > 0) {
      return res.status(200).json({ questions: questions.slice(0, requestedTotal) });
    }

    return res.status(502).json({
      error: 'Claude가 구조화된 문항을 반환하지 않았습니다. 한 번 더 생성해 주세요.',
      hint: 'v9는 타임아웃 방지를 위해 재시도를 제거했습니다.'
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: '생성 시간이 길어 중단했습니다. 기본 8문항으로 다시 시도하거나 문항 수를 6문항으로 줄여 주세요.' });
    }
    return res.status(500).json({ error: err?.message || String(err) || '서버 오류' });
  }
}
