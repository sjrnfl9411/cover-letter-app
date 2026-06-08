import { useState } from "react";

const SECTIONS = ["지원동기", "핵심역량 1", "핵심역량 2", "입사 후 포부"];
const STORAGE_KEY = "cover_letter_v3";

const SECTION_HINTS = {
  "지원동기": "이 회사/직무에 지원한 이유, 관심을 갖게 된 계기",
  "핵심역량 1": "가장 강한 역량과 그것을 증명하는 경험 (수치 포함)",
  "핵심역량 2": "두 번째 강점 — 협업·소통·분석 등",
  "입사 후 포부": "첫째/둘째/궁극적으로 구조로 단기·장기 목표",
};

function loadSaves() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function buildPrompt(section, d) {
  const targetChar = parseInt(d[`char_${section}`]) || 400;
  const jobCtx = `주요 업무: ${d.duties || "미입력"}\n자격 요건: ${d.qualification || "미입력"}\n우대사항: ${d.preferred || "미입력"}`;

  const rules = {
    "지원동기": `[작성 구조]
1. 첫 문장: 지원 동기를 압축한 인상적인 한 문장으로 시작
2. 본문: 실제 경험/배경을 근거로 이 회사·직무에 지원한 이유 서술
3. 마무리: 입사 후 기여 방향으로 자연스럽게 마무리

[작성 원칙]
- 반드시 ${targetChar}자(±20자)에 맞출 것 — 글자수가 가장 중요
- 실제 입력된 경험만 사용, 없는 경험 절대 추가 금지
- 과장·미사여구 금지 ("열정", "최선", "반드시" 등 사용 금지)
- "~하겠습니다" 어미 사용`,

    "핵심역량 1": `[작성 구조 — STAR]
1. 상황(S): 어떤 문제 또는 과제가 있었는지
2. 행동(T/A): 내가 구체적으로 한 행동
3. 결과(R): 수치 포함한 성과

[작성 원칙]
- 반드시 ${targetChar}자(±20자)에 맞출 것 — 글자수가 가장 중요
- 실제 입력된 경험만 사용, 없는 경험 절대 추가 금지
- 수치가 있으면 반드시 포함
- 과장·미사여구 금지`,

    "핵심역량 2": `[작성 구조 — STAR]
1. 상황(S): 어떤 문제 또는 과제가 있었는지
2. 행동(T/A): 내가 구체적으로 한 행동
3. 결과(R): 수치 포함한 성과

[작성 원칙]
- 반드시 ${targetChar}자(±20자)에 맞출 것 — 글자수가 가장 중요
- 실제 입력된 경험만 사용, 없는 경험 절대 추가 금지
- 수치가 있으면 반드시 포함
- 과장·미사여구 금지`,

    "입사 후 포부": `[작성 구조]
1. 첫째: 입사 초반(3~6개월) 적응 및 기여 계획
2. 둘째: 중기(1~2년) 전문성 발휘 방향
3. 궁극적으로: 장기적으로 회사와 함께 이루고 싶은 목표

[작성 원칙]
- 반드시 ${targetChar}자(±20자)에 맞출 것 — 글자수가 가장 중요
- 실제 입력된 경험 기반의 현실적인 목표만 작성
- 없는 경험 절대 추가 금지
- 과장·미사여구 금지`
  };

  return `당신은 취업 자기소개서 전문 작성가입니다.
아래 정보를 바탕으로 [${section}] 항목을 작성해주세요.

회사명: ${d.company || "미입력"}
직무: ${d.role || "미입력"}
${jobCtx}
전체 경험 요약: ${d.experience || "미입력"}
이 항목 강조 포인트: ${d[`memo_${section}`] || "없음"}
목표 글자수: 정확히 ${targetChar}자(±20자)

${rules[section]}

⚠️ 마지막으로 작성 후 글자수를 직접 세어보고, ${targetChar}자(±20자) 범위를 벗어나면 반드시 조정하세요.
자기소개서 본문만 출력하세요. 글자수 안내나 설명 문구는 절대 포함하지 마세요.`;
}

async function callClaude(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  const textBlock = json.content?.find(b => b.type === "text");
  return textBlock?.text || "오류가 발생했습니다.";
}

// ── 색상 팔레트 ──
const C = {
  primary: "#1D4ED8",
  primary2: "#2563EB",
  primaryLight: "#DBEAFE",
  primaryXLight: "#EFF6FF",
  primaryDark: "#1E3A8A",
  accent: "#3B82F6",
  text: "#1E293B",
  textSub: "#475569",
  textMuted: "#94A3B8",
  border: "#BFDBFE",
  borderLight: "#DBEAFE",
  white: "#FFFFFF",
  bg: "#F0F7FF",
  success: "#16A34A",
  successBg: "#DCFCE7",
  danger: "#DC2626",
  dangerBg: "#FEE2E2",
};

function Spinner({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.primary, fontSize: 13 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
        </path>
      </svg>
      {label || "AI가 작성 중..."}
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: copied ? C.successBg : C.primaryLight, color: copied ? C.success : C.primary, border: "none", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
      {copied ? "✓ 복사됨" : "복사"}
    </button>
  );
}

function CharCount({ text, target }) {
  if (!text) return null;
  const len = text.length;
  const t = parseInt(target) || 400;
  const ok = Math.abs(len - t) <= 20;
  return (
    <span style={{ fontSize: 11, color: ok ? C.success : C.danger, fontWeight: 600, marginLeft: 6 }}>
      {len}자 {ok ? "✓" : `(목표 ${t}자)`}
    </span>
  );
}

function SavesList({ onBack, onLoad }) {
  const [saves, setSaves] = useState(loadSaves());
  const del = (id) => { const u = saves.filter(s => s.id !== id); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); setSaves(u); };
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} style={{ background: C.primaryLight, border: "none", borderRadius: 8, padding: "7px 14px", color: C.primary, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>← 돌아가기</button>
        <span style={{ fontSize: 17, fontWeight: 700, color: C.text }}>저장된 자기소개서</span>
        <span style={{ fontSize: 13, color: C.textMuted }}>{saves.length}개</span>
      </div>
      {saves.length === 0 ? (
        <div style={{ background: C.white, borderRadius: 14, padding: "48px 24px", textAlign: "center", boxShadow: "0 2px 12px rgba(29,78,216,0.08)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, color: C.textMuted }}>저장된 자기소개서가 없어요</div>
        </div>
      ) : saves.map(save => (
        <div key={save.id} style={{ background: C.white, borderRadius: 14, padding: "18px 20px", marginBottom: 14, boxShadow: "0 2px 12px rgba(29,78,216,0.08)", border: `1.5px solid ${C.borderLight}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 3 }}>{save.company || "회사 미입력"} · {save.role || "직무 미입력"}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{new Date(save.savedAt).toLocaleString("ko-KR")}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onLoad(save)} style={{ background: C.primary, color: C.white, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>불러오기</button>
              <button onClick={() => del(save.id)} style={{ background: C.dangerBg, color: C.danger, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>삭제</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {SECTIONS.map(s => (
              <span key={s} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: save.results?.[s] ? C.primaryLight : "#F1F5F9", color: save.results?.[s] ? C.primary : C.textMuted, fontWeight: 700 }}>{s} {save.results?.[s] ? "✓" : "—"}</span>
            ))}
          </div>
          {save.results?.["지원동기"] && (
            <div style={{ padding: "9px 13px", background: C.primaryXLight, borderRadius: 10, fontSize: 12, color: C.textSub, lineHeight: 1.7, borderLeft: `3px solid ${C.accent}` }}>
              {save.results["지원동기"].slice(0, 120)}...
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("input");
  const [data, setData] = useState({
    company: "", role: "", duties: "", qualification: "", preferred: "", experience: "",
    "memo_지원동기": "", "char_지원동기": "400",
    "memo_핵심역량 1": "", "char_핵심역량 1": "400",
    "memo_핵심역량 2": "", "char_핵심역량 2": "400",
    "memo_입사 후 포부": "", "char_입사 후 포부": "400",
  });
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  const generate = async (section) => {
    setLoading(p => ({ ...p, [section]: true }));
    try {
      const text = await callClaude(buildPrompt(section, data));
      setResults(p => ({ ...p, [section]: text }));
    } catch(e) {
      setResults(p => ({ ...p, [section]: `오류: ${e.message}` }));
    }
    setLoading(p => ({ ...p, [section]: false }));
  };

  const generateAll = async () => {
    setView("result");
    setSaved(false);
    setResults({});
    for (const s of SECTIONS) await generate(s);
  };

  const saveResult = () => {
    if (Object.keys(results).length === 0) return;
    const saves = loadSaves();
    saves.unshift({ id: Date.now(), savedAt: new Date().toISOString(), ...data, results });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    setSaved(true);
  };

  const loadSave = (save) => {
    const { id, savedAt, results: r, ...rest } = save;
    setData(prev => ({ ...prev, ...rest }));
    setResults(r || {});
    setSaved(true);
    setView("result");
  };

  // 스타일 공통
  const inp = {
    width: "100%", padding: "9px 12px", fontSize: 13,
    border: `1.5px solid ${C.border}`, borderRadius: 9,
    fontFamily: "inherit", background: C.white, outline: "none",
    color: C.text, boxSizing: "border-box", resize: "vertical",
    transition: "border .2s"
  };
  const lbl = { fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 4, display: "block" };
  const hint = { fontSize: 11, color: C.textMuted, marginBottom: 5 };
  const card = { background: C.white, borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 16px rgba(29,78,216,0.08)", border: `1px solid ${C.borderLight}` };

  const Header = () => (
    <div style={{ background: C.primary, padding: "0 24px", boxShadow: "0 2px 12px rgba(29,78,216,0.3)" }}>
      <div style={{ maxWidth: 1150, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.white }}>자기소개서 생성기</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {view === "result" && (
            <button onClick={() => { setView("input"); setResults({}); setSaved(false); }}
              style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "5px 13px", fontSize: 13, color: C.white, fontWeight: 600, cursor: "pointer" }}>
              ← 다시 입력
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const MemoRow = ({ section }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
        <label style={{ ...lbl, marginBottom: 0, color: C.primary }}>{section}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>목표 글자수</span>
          <input type="number" min="100" max="2000" step="50"
            value={data[`char_${section}`]}
            onChange={e => set(`char_${section}`, e.target.value)}
            style={{ ...inp, width: 68, height: 28, padding: "3px 7px", fontSize: 12, resize: "none" }} />
          <span style={{ fontSize: 11, color: C.textMuted }}>자</span>
        </div>
      </div>
      <div style={hint}>{SECTION_HINTS[section]}</div>
      <textarea value={data[`memo_${section}`]} onChange={e => set(`memo_${section}`, e.target.value)}
        placeholder="비워두면 경험 요약 기반으로 자동 작성"
        style={{ ...inp, minHeight: 48 }} />
    </div>
  );

  if (view === "list") return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", minHeight: "100vh", background: C.bg }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Header />
      <SavesList onBack={() => setView(Object.keys(results).length > 0 ? "result" : "input")} onLoad={loadSave} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", minHeight: "100vh", background: C.bg }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Header />

      <div style={{ maxWidth: 1150, margin: "0 auto", padding: "22px 20px 60px" }}>

        {/* 입력 화면 */}
        {view === "input" && (
          <>
            <div style={{ background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary2})`, borderRadius: 14, padding: "20px 24px", marginBottom: 20, color: C.white }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 5 }}>경험을 입력하면 AI가 자기소개서를 써드려요</div>
              <div style={{ fontSize: 12, opacity: 0.88 }}>지원동기 · 핵심역량 1·2 · 입사 후 포부 — 실제 경험 기반, 과장 없이 정확한 글자수로 작성</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

              {/* 왼쪽 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 14 }}>📋 기본 정보</div>
                  <div style={{ marginBottom: 11 }}>
                    <label style={lbl}>회사명</label>
                    <input value={data.company} onChange={e => set("company", e.target.value)} style={{ ...inp, height: 38, resize: "none" }} />
                  </div>
                  <div style={{ marginBottom: 11 }}>
                    <label style={lbl}>지원 직무</label>
                    <input value={data.role} onChange={e => set("role", e.target.value)} style={{ ...inp, height: 38, resize: "none" }} />
                  </div>
                  <div style={{ marginBottom: 11 }}>
                    <label style={lbl}>주요 업무</label>
                    <div style={hint}>채용공고의 주요 업무를 붙여넣어 주세요</div>
                    <textarea value={data.duties} onChange={e => set("duties", e.target.value)} style={{ ...inp, minHeight: 72 }} />
                  </div>
                  <div style={{ marginBottom: 11 }}>
                    <label style={lbl}>자격 요건</label>
                    <div style={hint}>채용공고의 자격 요건을 붙여넣어 주세요</div>
                    <textarea value={data.qualification} onChange={e => set("qualification", e.target.value)} style={{ ...inp, minHeight: 72 }} />
                  </div>
                  <div>
                    <label style={lbl}>우대사항</label>
                    <div style={hint}>채용공고의 우대사항을 붙여넣어 주세요</div>
                    <textarea value={data.preferred} onChange={e => set("preferred", e.target.value)} style={{ ...inp, minHeight: 72 }} />
                  </div>
                </div>

                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4 }}>💼 전체 경험 요약</div>
                  <div style={hint}>지금까지의 경력, 프로젝트, 주요 성과를 자유롭게 적어주세요</div>
                  <textarea value={data.experience} onChange={e => set("experience", e.target.value)}
                    placeholder="지금까지의 경력, 프로젝트, 주요 성과를 자유롭게 적어주세요"
                    style={{ ...inp, minHeight: 140 }} />
                </div>

                <button onClick={generateAll} disabled={!data.experience.trim()} style={{
                  width: "100%", padding: "14px", fontSize: 14, fontWeight: 700,
                  background: data.experience.trim() ? `linear-gradient(135deg, ${C.primaryDark}, ${C.primary2})` : "#E2E8F0",
                  color: data.experience.trim() ? C.white : "#94A3B8",
                  border: "none", borderRadius: 11, cursor: data.experience.trim() ? "pointer" : "not-allowed",
                  boxShadow: data.experience.trim() ? `0 4px 18px rgba(29,78,216,0.35)` : "none", transition: "all .2s"
                }}>✨ 자기소개서 4항목 전체 생성</button>
                {!data.experience.trim() && <div style={{ textAlign: "center", fontSize: 11, color: C.textMuted, marginTop: -8 }}>경험 요약을 입력해야 생성할 수 있어요</div>}
              </div>

              {/* 오른쪽 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 3 }}>✏️ 항목별 핵심 메모 <span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>(선택)</span></div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>강조할 포인트와 목표 글자수를 함께 입력해주세요</div>
                  {SECTIONS.map(s => <MemoRow key={s} section={s} />)}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveResult} disabled={Object.keys(results).length === 0} style={{
                    flex: 1, padding: "12px", fontSize: 13, fontWeight: 700,
                    background: Object.keys(results).length > 0 ? (saved ? C.successBg : C.white) : "#F8FAFC",
                    color: Object.keys(results).length > 0 ? (saved ? C.success : C.primary) : "#CBD5E1",
                    border: `1.5px solid ${Object.keys(results).length > 0 ? (saved ? "#86EFAC" : C.primary) : "#E2E8F0"}`,
                    borderRadius: 10, cursor: Object.keys(results).length > 0 ? "pointer" : "not-allowed", transition: "all .2s"
                  }}>{saved ? "✓ 저장됨" : "💾 저장하기"}</button>
                  <button onClick={() => setView("list")} style={{
                    flex: 1, padding: "12px", fontSize: 13, fontWeight: 700,
                    background: C.primaryLight, color: C.primary, border: `1.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer"
                  }}>📋 저장 목록</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 결과 화면 */}
        {view === "result" && (
          <div>
            <div style={{ background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary2})`, borderRadius: 13, padding: "15px 20px", marginBottom: 20, color: C.white, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{data.company || "회사명 미입력"} · {data.role || "직무 미입력"}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>실제 경험 기반 · 과장 없이 · 목표 글자수 엄수</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveResult} disabled={Object.keys(results).length === 0} style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 700,
                  background: saved ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
                  color: C.white, border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 8,
                  cursor: Object.keys(results).length > 0 ? "pointer" : "not-allowed"
                }}>{saved ? "✓ 저장됨" : "💾 저장"}</button>
                <button onClick={() => setView("list")} style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 700,
                  background: "rgba(255,255,255,0.12)", color: C.white,
                  border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8, cursor: "pointer"
                }}>📋 목록</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {SECTIONS.map((section) => (
                <div key={section} style={{
                  background: C.white, borderRadius: 13,
                  boxShadow: "0 2px 16px rgba(29,78,216,0.08)",
                  border: loading[section] ? `1.5px solid ${C.accent}` : `1px solid ${C.borderLight}`,
                  transition: "border .3s"
                }}>
                  <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${C.primaryXLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ background: C.primary, color: C.white, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{section}</span>
                      {results[section] && <CharCount text={results[section]} target={data[`char_${section}`]} />}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {results[section] && <CopyBtn text={results[section]} />}
                      <button onClick={() => generate(section)} disabled={!!loading[section]} style={{
                        background: C.primaryLight, color: C.primary, border: "none", borderRadius: 8,
                        padding: "3px 9px", fontSize: 11, fontWeight: 700,
                        cursor: loading[section] ? "not-allowed" : "pointer", opacity: loading[section] ? 0.5 : 1
                      }}>재생성</button>
                    </div>
                  </div>
                  <div style={{ padding: "13px 16px", minHeight: 100 }}>
                    {loading[section]
                      ? <Spinner label="AI가 작성 중..." />
                      : results[section]
                        ? <div style={{ fontSize: 13, lineHeight: 1.9, color: C.text, whiteSpace: "pre-wrap" }}>{results[section]}</div>
                        : <div style={{ color: C.textMuted, fontSize: 13, fontStyle: "italic" }}>생성 대기 중...</div>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
