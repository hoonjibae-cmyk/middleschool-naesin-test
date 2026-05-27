export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt가 없습니다.' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: '서버 환경변수 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.' });
    }

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
            maxItems: 12,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                number: { type: 'integer' },
                type: { type: 'string' },
                subtype: { type: 'string' },
                format: { type: 'string', enum: ['객관식', '서술형'] },
                difficulty: { type: 'string' },
                passage: { type: 'string' },
                stem: { type: 'string' },
                choices: { type: 'array', items: { type: 'string' } },
                answer: {
                  anyOf: [
                    { type: 'integer' },
                    { type: 'string' }
                  ]
                },
                explanation: { type: 'string' },
                points: { type: 'integer' }
              },
              required: ['number', 'type', 'format', 'difficulty', 'passage', 'stem', 'choices', 'answer', 'explanation', 'points']
            }
          }
        },
        required: ['questions']
      }
    };

    const compactPrompt = `${prompt}\n\n[서버 안정화용 추가 지시]\n- 반드시 submit_exam 도구만 사용하세요. 일반 텍스트 출력 금지.\n- 전체 8문항 기준이면 지문 묶음은 최대 3개만 사용하세요.\n- 각 passage는 설명문 70~95단어, 대화문 8~10줄 이내로 짧게 작성하세요.\n- 후속 연계 문항은 passage를 빈 문자열로 두고, stem은 발문만 작성하세요.\n- 어법 문항에서도 지문 전체를 stem에 다시 붙여넣지 마세요.\n- choices는 객관식 5개, 각 선택지는 18단어 이내로 작성하세요.\n- 정답만 너무 명확하게 보이지 않도록, 같은 품사·비슷한 길이의 그럴듯한 오답을 최소 2개 포함하세요.\n- 내용일치/불일치는 대상·범위·원인·결과 중 하나만 바꾼 함정 선택지를 최소 2개 포함하세요.\n- 제목/요지 문제는 너무 넓은 제목, 너무 좁은 제목, 소재는 맞지만 결론이 다른 제목을 섞으세요.\n- 어법 문항은 앞 지문 문장을 활용해 한두 표현만 변형하고, 독립 예문식 문법 문제로 만들지 마세요.\n- explanation은 1문장만 작성하세요.\n- 서술형이 0문항이면 서술형을 절대 생성하지 마세요.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

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
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
          max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 3200),
          temperature: 0.38,
          tools: [toolSchema],
          tool_choice: { type: 'tool', name: 'submit_exam' },
          messages: [{ role: 'user', content: compactPrompt }]
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await anthropicRes.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (jsonErr) {
      data = { raw: raw.slice(0, 1000) };
    }

    if (!anthropicRes.ok) {
      const msg = data?.error?.message || data?.message || raw || `Claude API 오류 (${anthropicRes.status})`;
      console.error('ANTHROPIC_ERROR:', anthropicRes.status, data);
      return res.status(anthropicRes.status).json({
        error: typeof msg === 'string' ? msg : JSON.stringify(msg),
        status: anthropicRes.status,
        raw: data
      });
    }

    const toolUse = Array.isArray(data?.content)
      ? data.content.find(block => block.type === 'tool_use' && block.name === 'submit_exam')
      : null;

    if (toolUse?.input?.questions && Array.isArray(toolUse.input.questions)) {
      return res.status(200).json({ questions: toolUse.input.questions });
    }

    const text = Array.isArray(data?.content)
      ? data.content.map(block => block.text || '').join('\n')
      : '';

    if (text) {
      return res.status(200).json({ text });
    }

    return res.status(500).json({
      error: 'Claude가 문항 데이터를 반환하지 않았습니다. 다시 생성해 주세요.',
      raw: data
    });
  } catch (err) {
    console.error('SERVER_ERROR:', err);
    if (err?.name === 'AbortError') {
      return res.status(504).json({
        error: '생성 시간이 길어 서버 제한에 걸렸습니다. 문항 수를 줄이거나 다시 생성해 주세요.'
      });
    }
    return res.status(500).json({
      error: err?.message || String(err) || '서버 오류',
      name: err?.name || 'Error'
    });
  }
}
