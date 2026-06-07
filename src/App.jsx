import { useState } from "react";

const SECTIONS = ["지원동기", "핵심역량 1", "핵심역량 2", "입사 후 포부"];

const SECTION_HINTS = {
  "지원동기": "이 회사/직무에 지원한 이유, 관심을 갖게 된 계기",
  "핵심역량 1": "가장 강한 역량과 그것을 증명하는 경험",
  "핵심역량 2": "두 번째 강점, 협업·소통·분석 등",
  "입사 후 포부": "입사 후 단기·장기 목표, 기여 방향",
};

const STORAGE_KEY = "cover_letter_saves_v2";

function loadSaves() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function charLen(target) {
  if (!target) return "";
  const n = parseInt(target);
  if (isNaN(n) || n <= 0) return "";
  return `${n}자 내외`;
}

function buildPrompts(d) {
  const jobContext = `주요 업무: ${d.duties || "미입력"}\n우대사항: ${d.preferred || "미입력"}`;
  return {
    "지원동기": `당신은 취업 자기소개서 전문 작성가입니다. 아래 정보를 바탕으로 [지원동기] 항목을 작성해주세요.

회사명: ${d.company || "미입력"}
직무: ${d.role || "미입력"}
${jobContext}
경험 요약: ${d.experience || "미입력"}
강조 포인트: ${d.memo || "없음"}

작성 규칙:
- ${charLen(d.charMemo) || "300~400자"} 내외
- 과장 없이 실제 경험 기반
- "~하겠습니다" 어미 사용
- 첫 문장은 인상적으로 시작
- 없는 경험 절대 추가 금지`,

    "핵심역량 1": `당신은 취업 자기소개서 전문 작성가입니다. 아래 정보를 바탕으로 [핵심역량 1] 항목을 작성해주세요.

회사명: ${d.company || "미입력"}
직무: ${d.role || "미입력"}
${jobContext}
경험 요약: ${d.experience || "미입력"}
강조 포인트: ${d.strength1 || "없음"}

작성 규칙:
- ${charLen(d.charStrength1) || "300~400자"} 내외
- STAR 구조(상황-행동-결과) 활용
- 수치 있으면 반드시 포함
- 없는 경험 절대 추가 금지`,

    "핵심역량 2": `당신은 취업 자기소개서 전문 작성가입니다. 아래 정보를 바탕으로 [핵심역량 2] 항목을 작성해주세요.

회사명: ${d.company || "미입력"}
직무: ${d.role || "미입력"}
${jobContext}
경험 요약: ${d.experience || "미입력"}
강조 포인트: ${d.strength2 || "없음"}

작성 규칙:
- ${charLen(d.charStrength2) || "300~400자"} 내외
- STAR 구조(상황-행동-결과) 활용
- 수치 있으면 반드시 포함
- 없는 경험 절대 추가 금지`,

    "입사 후 포부": null, // 별도 처리 (웹검색 포함)
  };
}

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }]
    })
  });
  const json = await res.json();
  const textBlock = json.content?.find(b => b.type === "text");
  return textBlock?.text || "오류가 발생했습니다.";
}

function buildAspirationPrompt(d) {
  const jobContext = `주요 업무: ${d.duties || "미입력"}\n우대사항: ${d.preferred || "미입력"}`;
  return `당신은 취업 자기소개서 전문 작성가입니다.

먼저 웹 검색을 통해 "${d.company || "해당 회사"}"의 공식 비전, 미션, 핵심 가치를 찾아주세요.
검색 후 아래 정보를 바탕으로 [입사 후 포부] 항목을 작성해주세요.

회사명: ${d.company || "미입력"}
직무: ${d.role || "미입력"}
${jobContext}
경험 요약: ${d.experience || "미입력"}
강조 포인트: ${d.aspiration || "없음"}

작성 규칙:
- ${charLen(d.charAspiration) || "300~400자"} 내외
- "첫째 / 둘째 / 궁극적으로" 3단계 구조
- 검색한 회사 비전/미션과 자연스럽게 연결
- 구체적이고 실현 가능한 목표
- 없는 경험 절대 추가 금지
- 자기소개서 본문만 출력 (검색 과정 설명 없이)`;
}

function Spinner({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6B7FD7", fontSize: 13 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
        </path>
      </svg>
      {label || "AI가 작성 중..."}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} style={{
      background: copied ? "#E8F5E9" : "#F0F2FF", color: copied ? "#388E3C" : "#6B7FD7",
      border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .2s"
    }}>{copied ? "✓ 복사됨" : "복사"}</button>
  );
}

function SavesList({ onBack, onLoad }) {
  const [saves, setSaves] = useState(loadSaves());
  const del = (id) => {
    const u = saves.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setSaves(u);
  };
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} style={{ background: "#F0F2FF", border: "none", borderRadius: 8, padding: "7px 14px", color: "#6B7FD7", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>← 돌아가기</button>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#1A1D2E" }}>저장된 자기소개서</span>
        <span style={{ fontSize: 13, color: "#9DA3C0" }}>{saves.length}개</span>
      </div>
      {saves.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: "48px 24px", textAlign: "center", boxShadow: "0 2px 12px rgba(107,127,215,0.08)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, color: "#9DA3C0" }}>저장된 자기소개서가 없어요</div>
        </div>
      ) : saves.map(save => (
        <div key={save.id} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 14, boxShadow: "0 2px 12px rgba(107,127,215,0.08)", border: "1.5px solid #F0F2FF" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1D2E", marginBottom: 3 }}>{save.company || "회사 미입력"} · {save.role || "직무 미입력"}</div>
              <div style={{ fontSize: 12, color: "#9DA3C0" }}>{new Date(save.savedAt).toLocaleString("ko-KR")}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onLoad(save)} style={{ background: "linear-gradient(135deg, #6B7FD7, #A78BFA)", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>불러오기</button>
              <button onClick={() => del(save.id)} style={{ background: "#FFF0F0", color: "#E57373", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>삭제</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {SECTIONS.map(s => (
              <span key={s} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: save.results?.[s] ? "#EEF0FF" : "#F5F5F5", color: save.results?.[s] ? "#6B7FD7" : "#C0C4DC", fontWeight: 600 }}>{s} {save.results?.[s] ? "✓" : "—"}</span>
            ))}
          </div>
          {save.results?.["지원동기"] && (
            <div style={{ padding: "9px 13px", background: "#FAFBFF", borderRadius: 10, fontSize: 12, color: "#4A4E6A", lineHeight: 1.7, borderLeft: "3px solid #A78BFA" }}>
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
    company: "", role: "", duties: "", preferred: "", experience: "",
    memo: "", charMemo: "",
    strength1: "", charStrength1: "",
    strength2: "", charStrength2: "",
    aspiration: "", charAspiration: "",
  });
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  const generate = async (section) => {
    setLoading(p => ({ ...p, [section]: true }));
    setActiveSection(section);
    try {
      const prompts = buildPrompts(data);
      let prompt;
      if (section === "입사 후 포부") {
        prompt = buildAspirationPrompt(data);
      } else {
        prompt = prompts[section];
      }
      const text = await callClaude(prompt);
      setResults(p => ({ ...p, [section]: text }));
    } catch {
      setResults(p => ({ ...p, [section]: "네트워크 오류가 발생했습니다." }));
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
    const saves = loadSaves();
    saves.unshift({ id: Date.now(), savedAt: new Date().toISOString(), ...data, results });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    setSaved(true);
  };

  const loadSave = (save) => {
    const { id, savedAt, results: r, ...rest } = save;
    setData({ company: "", role: "", duties: "", preferred: "", experience: "", memo: "", charMemo: "", strength1: "", charStrength1: "", strength2: "", charStrength2: "", aspiration: "", charAspiration: "", ...rest });
    setResults(r || {});
    setSaved(true);
    setView("result");
  };

  const inp = {
    width: "100%", padding: "8px 11px", fontSize: 13,
    border: "1.5px solid #E2E4F0", borderRadius: 9,
    fontFamily: "inherit", background: "#FAFBFF", outline: "none",
    color: "#1A1D2E", boxSizing: "border-box", resize: "vertical"
  };
  const lbl = { fontSize: 12, fontWeight: 600, color: "#4A4E6A", marginBottom: 3, display: "block" };
  const hint = { fontSize: 11, color: "#9DA3C0", marginBottom: 4 };
  const card = { background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 12px rgba(107,127,215,0.08)" };

  const Header = () => (
    <div style={{ background: "#fff", borderBottom: "1px solid #E8EAF6", padding: "0 24px" }}>
      <div style={{ maxWidth: 1150, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, #6B7FD7, #A78BFA)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1D2E" }}>자기소개서 생성기</span>
        </div>
        {view === "result" && (
          <button onClick={() => { setView("input"); setResults({}); setSaved(false); }} style={{ background: "none", border: "1.5px solid #E2E4F0", borderRadius: 8, padding: "5px 13px", fontSize: 13, color: "#6B7FD7", fontWeight: 600, cursor: "pointer" }}>← 다시 입력</button>
        )}
      </div>
    </div>
  );

  // 글자수 입력 + 메모 한 행
  const MemoRow = ({ memoKey, charKey, label, hintText }) => (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
        <label style={{ ...lbl, marginBottom: 0 }}>{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 11, color: "#9DA3C0" }}>목표 글자수</span>
          <input
            type="number"
            min="100" max="2000" step="50"
            value={data[charKey]}
            onChange={e => set(charKey, e.target.value)}
            placeholder="예: 400"
            style={{ ...inp, width: 72, height: 28, padding: "3px 7px", fontSize: 12, resize: "none" }}
          />
          <span style={{ fontSize: 11, color: "#9DA3C0" }}>자</span>
        </div>
      </div>
      <div style={hint}>{hintText}</div>
      <textarea
        value={data[memoKey]}
        onChange={e => set(memoKey, e.target.value)}
        placeholder="비워두면 경험 요약 기반으로 자동 작성"
        style={{ ...inp, minHeight: 46 }}
      />
    </div>
  );

  if (view === "list") return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #F0F2FF 0%, #F8F0FF 100%)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Header />
      <SavesList onBack={() => setView(Object.keys(results).length > 0 ? "result" : "input")} onLoad={loadSave} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #F0F2FF 0%, #F8F0FF 100%)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Header />

      <div style={{ maxWidth: 1150, margin: "0 auto", padding: "20px 20px 60px" }}>

        {/* 입력 화면 */}
        {view === "input" && (
          <>
            <div style={{ background: "linear-gradient(135deg, #6B7FD7, #A78BFA)", borderRadius: 14, padding: "18px 22px", marginBottom: 18, color: "white" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>경험을 입력하면 AI가 자기소개서를 써드려요</div>
              <div style={{ fontSize: 12, opacity: 0.88 }}>지원동기 · 핵심역량 1·2 · 입사 후 포부 — 4개 항목 자동 생성 · 입사 후 포부는 회사 비전 검색 후 작성</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

              {/* 왼쪽 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7FD7", marginBottom: 13 }}>📋 기본 정보</div>

                  <div style={{ marginBottom: 11 }}>
                    <label style={lbl}>회사명</label>
                    <input value={data.company} onChange={e => set("company", e.target.value)}
                      placeholder="예: 구름" style={{ ...inp, height: 36, resize: "none" }} />
                  </div>

                  <div style={{ marginBottom: 11 }}>
                    <label style={lbl}>지원 직무</label>
                    <input value={data.role} onChange={e => set("role", e.target.value)}
                      placeholder="예: 교육 운영 매니저" style={{ ...inp, height: 36, resize: "none" }} />
                  </div>

                  <div style={{ marginBottom: 11 }}>
                    <label style={lbl}>주요 업무</label>
                    <div style={hint}>채용공고의 주요 업무 내용을 붙여넣어 주세요</div>
                    <textarea value={data.duties} onChange={e => set("duties", e.target.value)}
                      placeholder="예: 온라인 강의 운영 관리, 수강생 학습 지원, 커리큘럼 기획 등"
                      style={{ ...inp, minHeight: 72 }} />
                  </div>

                  <div>
                    <label style={lbl}>우대사항</label>
                    <div style={hint}>채용공고의 우대사항을 붙여넣어 주세요</div>
                    <textarea value={data.preferred} onChange={e => set("preferred", e.target.value)}
                      placeholder="예: 에듀테크 경험자, Notion 활용 능숙자, 데이터 기반 분석 경험 등"
                      style={{ ...inp, minHeight: 72 }} />
                  </div>
                </div>

                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7FD7", marginBottom: 4 }}>💼 전체 경험 요약</div>
                  <div style={hint}>지금까지의 경력, 프로젝트, 역할을 자유롭게 적어주세요</div>
                  <textarea value={data.experience} onChange={e => set("experience", e.target.value)}
                    placeholder="지금까지의 경력, 프로젝트, 주요 성과를 자유롭게 적어주세요"
                    style={{ ...inp, minHeight: 140 }} />
                </div>

                <button onClick={generateAll} disabled={!data.experience.trim()} style={{
                  width: "100%", padding: "13px", fontSize: 14, fontWeight: 700,
                  background: data.experience.trim() ? "linear-gradient(135deg, #6B7FD7, #A78BFA)" : "#E2E4F0",
                  color: data.experience.trim() ? "white" : "#9DA3C0",
                  border: "none", borderRadius: 11, cursor: data.experience.trim() ? "pointer" : "not-allowed",
                  boxShadow: data.experience.trim() ? "0 4px 18px rgba(107,127,215,0.3)" : "none", transition: "all .2s"
                }}>✨ 자기소개서 4항목 전체 생성</button>
                {!data.experience.trim() && <div style={{ textAlign: "center", fontSize: 11, color: "#9DA3C0", marginTop: -8 }}>경험 요약을 입력해야 생성할 수 있어요</div>}
              </div>

              {/* 오른쪽 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7FD7", marginBottom: 3 }}>✏️ 항목별 핵심 메모 <span style={{ fontSize: 11, fontWeight: 400, color: "#9DA3C0" }}>(선택)</span></div>
                  <div style={{ fontSize: 11, color: "#9DA3C0", marginBottom: 13 }}>강조할 포인트와 목표 글자수를 함께 입력해주세요 · 입사 후 포부는 회사 비전 자동 검색</div>

                  <MemoRow memoKey="memo" charKey="charMemo" label="지원동기" hintText={SECTION_HINTS["지원동기"]} />
                  <MemoRow memoKey="strength1" charKey="charStrength1" label="핵심역량 1" hintText={SECTION_HINTS["핵심역량 1"]} />
                  <MemoRow memoKey="strength2" charKey="charStrength2" label="핵심역량 2" hintText={SECTION_HINTS["핵심역량 2"]} />
                  <MemoRow memoKey="aspiration" charKey="charAspiration" label="입사 후 포부" hintText={SECTION_HINTS["입사 후 포부"]} />

                  <div style={{ marginTop: 4, padding: "8px 11px", background: "#F8F0FF", borderRadius: 9, fontSize: 11, color: "#7C5FBF", display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span>🔍</span>
                    <span>입사 후 포부 생성 시 <strong>{data.company || "입력한 회사명"}</strong>의 비전·미션을 웹에서 검색한 후 자동 반영합니다</span>
                  </div>
                </div>

                {/* 저장/목록 버튼 */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveResult} disabled={Object.keys(results).length === 0} style={{
                    flex: 1, padding: "11px", fontSize: 13, fontWeight: 700,
                    background: Object.keys(results).length > 0 ? (saved ? "#E8F5E9" : "#fff") : "#F5F5F5",
                    color: Object.keys(results).length > 0 ? (saved ? "#388E3C" : "#6B7FD7") : "#C0C4DC",
                    border: `1.5px solid ${Object.keys(results).length > 0 ? (saved ? "#A5D6A7" : "#6B7FD7") : "#E0E0E0"}`,
                    borderRadius: 10, cursor: Object.keys(results).length > 0 ? "pointer" : "not-allowed", transition: "all .2s"
                  }}>{saved ? "✓ 저장됨" : "💾 저장하기"}</button>
                  <button onClick={() => setView("list")} style={{
                    flex: 1, padding: "11px", fontSize: 13, fontWeight: 700,
                    background: "#F0F2FF", color: "#6B7FD7", border: "1.5px solid #D4D8F5", borderRadius: 10, cursor: "pointer"
                  }}>📋 저장 목록</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 결과 화면 */}
        {view === "result" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #6B7FD7, #A78BFA)", borderRadius: 13, padding: "14px 18px", marginBottom: 18, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{data.company || "회사명 미입력"} · {data.role || "직무 미입력"}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>4개 항목 생성 중 · 입사 후 포부는 회사 비전 검색 후 작성</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveResult} disabled={Object.keys(results).length === 0} style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 700,
                  background: saved ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.2)",
                  color: "white", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: 8,
                  cursor: Object.keys(results).length > 0 ? "pointer" : "not-allowed"
                }}>{saved ? "✓ 저장됨" : "💾 저장"}</button>
                <button onClick={() => setView("list")} style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 700,
                  background: "rgba(255,255,255,0.15)", color: "white",
                  border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8, cursor: "pointer"
                }}>📋 목록</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {SECTIONS.map((section) => (
                <div key={section} style={{
                  background: "#fff", borderRadius: 13,
                  boxShadow: "0 2px 12px rgba(107,127,215,0.08)",
                  border: activeSection === section && loading[section] ? "1.5px solid #A78BFA" : "1.5px solid transparent",
                  transition: "border .3s"
                }}>
                  <div style={{ padding: "12px 16px 9px", borderBottom: "1px solid #F0F2FF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ background: "linear-gradient(135deg, #6B7FD7, #A78BFA)", color: "white", borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                      {section}
                      {section === "입사 후 포부" && <span style={{ fontSize: 10, opacity: 0.85, marginLeft: 4 }}>🔍</span>}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {results[section] && <CopyButton text={results[section]} />}
                      <button onClick={() => generate(section)} disabled={!!loading[section]} style={{
                        background: "#F0F2FF", color: "#6B7FD7", border: "none", borderRadius: 8,
                        padding: "3px 9px", fontSize: 11, fontWeight: 600,
                        cursor: loading[section] ? "not-allowed" : "pointer", opacity: loading[section] ? 0.5 : 1
                      }}>재생성</button>
                    </div>
                  </div>
                  <div style={{ padding: "13px 16px", minHeight: 90 }}>
                    {loading[section]
                      ? <Spinner label={section === "입사 후 포부" ? `${data.company || "회사"} 비전 검색 후 작성 중...` : "AI가 작성 중..."} />
                      : results[section]
                        ? <div style={{ fontSize: 13, lineHeight: 1.85, color: "#2A2D3E", whiteSpace: "pre-wrap" }}>{results[section]}</div>
                        : <div style={{ color: "#C0C4DC", fontSize: 13, fontStyle: "italic" }}>생성 대기 중...</div>
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
