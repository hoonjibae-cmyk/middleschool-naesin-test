export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { prompt, total = 8 } = req.body || {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt가 없습니다.' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: '서버 환경변수 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.' });

    const toolSchema = {
      name: 'submit_exam',
      description: '완성된 중학교 영어 내신 모의고사 문항 배열을 제출합니다.',
      input_schema: {
        type: 'object', additionalProperties: true,
        properties: {
          questions: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'object', additionalProperties: true,
            properties: {
              number: {type:'integer'}, type:{type:'string'}, subtype:{type:'string'}, format:{type:'string'}, difficulty:{type:'string'}, passage:{type:'string'}, stem:{type:'string'}, choices:{type:'array',items:{type:'string'}}, answer:{anyOf:[{type:'integer'},{type:'string'}]}, explanation:{type:'string'}, points:{type:'integer'}
            }, required:['number','type','format','difficulty','passage','stem','choices','answer','explanation'] } }
        }, required: ['questions']
      }
    };

    const compactPrompt = `${prompt}\n\n[서버 안정화 지시]\n- 가능하면 submit_exam 도구를 사용하세요. 도구 사용이 어려우면 JSON 배열만 출력하세요.\n- 총 ${total}문항을 넘기지 마세요.\n- passage는 70~95단어, 대화문은 8~10줄 이내로 제한하세요.\n- choices는 객관식 5개, 각 선택지는 18단어 이내로 작성하세요.\n- explanation은 1문장만 작성하세요.\n- 같은 지문 연계 후속 문항의 passage는 빈 문자열로 두세요.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 54000);
    let anthropicRes;
    try {
      anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
          max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 3200),
          temperature: 0.35,
          tools: [toolSchema],
          messages: [{ role: 'user', content: compactPrompt }]
        })
      });
    } finally { clearTimeout(timeout); }

    const raw = await anthropicRes.text();
    let data = {}; try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
    if (!anthropicRes.ok) {
      const msg = data?.error?.message || data?.message || raw || `Claude API 오류 (${anthropicRes.status})`;
      return res.status(anthropicRes.status).json({ error: String(msg).slice(0,1000), raw: data });
    }
    const blocks = Array.isArray(data?.content) ? data.content : [];
    const toolUse = blocks.find(b => b.type === 'tool_use' && b.name === 'submit_exam');
    if (toolUse?.input?.questions && Array.isArray(toolUse.input.questions)) return res.status(200).json({ questions: toolUse.input.questions });
    const text = blocks.map(b => b.text || '').join('\n').trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return res.status(200).json({ text: match[0] });

    // 1회 재시도: 도구 없이 JSON 배열만 요청
    const retryRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest', max_tokens:2800, temperature:0.25, messages:[{role:'user',content:`${compactPrompt}\n\n반드시 JSON 배열만 출력하세요. 설명 문장 금지.`}]})
    });
    const retryRaw=await retryRes.text(); let retryData={}; try{retryData=JSON.parse(retryRaw)}catch{retryData={raw:retryRaw}};
    if(!retryRes.ok) return res.status(retryRes.status).json({error: retryData?.error?.message || retryRaw || 'Claude 재시도 오류'});
    const retryText=Array.isArray(retryData?.content)?retryData.content.map(b=>b.text||'').join('\n'):'';
    const retryMatch=retryText.match(/\[[\s\S]*\]/);
    if(retryMatch) return res.status(200).json({text:retryMatch[0]});
    return res.status(500).json({ error: 'Claude가 문항 데이터를 반환하지 않았습니다. 요청이 과도하게 복잡할 수 있습니다. 다시 생성해 주세요.', raw: data });
  } catch (err) {
    if (err?.name === 'AbortError') return res.status(504).json({ error: '생성 시간이 길어 서버 제한에 걸렸습니다. 문항 수를 줄이거나 다시 생성해 주세요.' });
    return res.status(500).json({ error: err?.message || String(err) || '서버 오류' });
  }
}
