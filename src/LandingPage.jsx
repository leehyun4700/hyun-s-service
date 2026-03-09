import { useState, useEffect, useRef } from "react";

// ─── 스크롤 애니메이션 훅 ─────────────────────────────────────────
function useInView(threshold = 0.15) {
    const ref = useRef(null);
    const [isVisible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, isVisible];
}

// ─── 카운트업 애니메이션 ──────────────────────────────────────────
function CountUp({ end, suffix = "", duration = 2000 }) {
    const [count, setCount] = useState(0);
    const [ref, isVisible] = useInView();
    useEffect(() => {
        if (!isVisible) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [isVisible, end, duration]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── 메인 랜딩 페이지 ────────────────────────────────────────────
export default function LandingPage({ onStart }) {
    const [selectedPlan, setSelectedPlan] = useState("pro");
    const [mobileMenu, setMobileMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", overflowX: "hidden" }}>
            {/* ─── 네비게이션 ─── */}
            <nav style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
                background: scrolled ? "rgba(10,10,10,0.95)" : "transparent",
                backdropFilter: scrolled ? "blur(20px)" : "none",
                borderBottom: scrolled ? "1px solid rgba(196,30,58,0.2)" : "1px solid transparent",
                transition: "all 0.3s ease",
                padding: "0 24px",
            }}>
                <div style={{
                    maxWidth: 1200, margin: "0 auto",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    height: 72,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 32 }}>🥋</span>
                        <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 2, color: "#fff" }}>도장알림</span>
                    </div>

                    {/* 데스크탑 메뉴 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 32 }}
                        className="landing-desktop-nav">
                        {["기능", "요금제", "후기"].map(item => (
                            <a key={item} href={`#${item}`} style={{
                                color: "#999", fontSize: 14, textDecoration: "none",
                                transition: "color 0.2s", cursor: "pointer",
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                                onMouseLeave={e => e.currentTarget.style.color = "#999"}
                            >{item}</a>
                        ))}
                        <button onClick={onStart} style={{
                            background: "linear-gradient(135deg, #C41E3A, #8B0000)",
                            border: "none", borderRadius: 10, padding: "10px 24px",
                            color: "#fff", fontSize: 14, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "all 0.2s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(196,30,58,0.4)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                        >무료로 시작</button>
                    </div>

                    {/* 모바일 햄버거 */}
                    <button className="landing-mobile-menu-btn" onClick={() => setMobileMenu(!mobileMenu)} style={{
                        display: "none", background: "none", border: "none",
                        color: "#fff", fontSize: 24, cursor: "pointer",
                    }}>☰</button>
                </div>

                {/* 모바일 메뉴 */}
                {mobileMenu && (
                    <div style={{
                        background: "rgba(10,10,10,0.98)", padding: 24,
                        display: "flex", flexDirection: "column", gap: 16,
                    }}>
                        {["기능", "요금제", "후기"].map(item => (
                            <a key={item} href={`#${item}`} onClick={() => setMobileMenu(false)} style={{
                                color: "#ccc", fontSize: 16, textDecoration: "none", padding: "8px 0",
                            }}>{item}</a>
                        ))}
                        <button onClick={onStart} style={{
                            background: "linear-gradient(135deg, #C41E3A, #8B0000)",
                            border: "none", borderRadius: 10, padding: "14px",
                            color: "#fff", fontSize: 15, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                        }}>무료로 시작</button>
                    </div>
                )}
            </nav>

            {/* ─── Hero 섹션 ─── */}
            <HeroSection onStart={onStart} />

            {/* ─── 신뢰 지표 ─── */}
            <TrustBar />

            {/* ─── 문제 제기 ─── */}
            <ProblemSection />

            {/* ─── 기능 소개 ─── */}
            <FeaturesSection />

            {/* ─── 데모 미리보기 ─── */}
            <DemoSection />

            {/* ─── 요금제 ─── */}
            <PricingSection selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} onStart={onStart} />

            {/* ─── 후기 ─── */}
            <TestimonialsSection />

            {/* ─── FAQ ─── */}
            <FAQSection />

            {/* ─── 최종 CTA ─── */}
            <FinalCTA onStart={onStart} />

            {/* ─── 푸터 ─── */}
            <Footer />
        </div>
    );
}

// ─── Hero 섹션 ───────────────────────────────────────────────────
function HeroSection({ onStart }) {
    return (
        <section style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse at 50% 0%, #2a0a0a 0%, #0a0a0a 60%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            padding: "120px 24px 80px",
        }}>
            {/* 배경 장식 */}
            <div style={{
                position: "absolute", width: 800, height: 800, borderRadius: "50%",
                border: "1px solid rgba(196,30,58,0.08)",
                top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            }} />
            <div style={{
                position: "absolute", width: 500, height: 500, borderRadius: "50%",
                border: "1px solid rgba(196,30,58,0.12)",
                top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            }} />
            <div style={{
                position: "absolute", width: 200, height: 200, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(196,30,58,0.15) 0%, transparent 70%)",
                top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            }} />

            <div style={{ maxWidth: 800, textAlign: "center", position: "relative", zIndex: 1 }}>
                {/* 뱃지 */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "rgba(196,30,58,0.1)", border: "1px solid rgba(196,30,58,0.3)",
                    borderRadius: 100, padding: "8px 20px", marginBottom: 32,
                    animation: "fadeIn 0.6s ease",
                }}>
                    <span style={{
                        background: "#C41E3A", borderRadius: 100, padding: "2px 10px",
                        fontSize: 11, fontWeight: 700, color: "#fff",
                    }}>NEW</span>
                    <span style={{ color: "#ccc", fontSize: 13 }}>실시간 푸시 알림 기능 출시</span>
                </div>

                {/* 메인 타이틀 */}
                <h1 style={{
                    fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900,
                    lineHeight: 1.15, letterSpacing: -1,
                    marginBottom: 24,
                    animation: "fadeIn 0.8s ease 0.1s both",
                }}>
                    <span style={{ color: "#fff" }}>학부모가 </span>
                    <span style={{
                        background: "linear-gradient(135deg, #C41E3A, #FF6B35)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>안심</span>
                    <span style={{ color: "#fff" }}>하는</span>
                    <br />
                    <span style={{ color: "#fff" }}>태권도장 관리 시스템</span>
                </h1>

                {/* 서브 타이틀 */}
                <p style={{
                    fontSize: "clamp(16px, 2.5vw, 20px)", color: "#888",
                    lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px",
                    animation: "fadeIn 0.8s ease 0.2s both",
                }}>
                    학생 등하원 알림을 <strong style={{ color: "#ccc" }}>자동으로</strong> 학부모에게 전송.<br />
                    출석 관리부터 학부모 소통까지, 한 곳에서 해결하세요.
                </p>

                {/* CTA 버튼 */}
                <div style={{
                    display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
                    animation: "fadeIn 0.8s ease 0.3s both",
                }}>
                    <button onClick={onStart} style={{
                        background: "linear-gradient(135deg, #C41E3A, #8B0000)",
                        border: "none", borderRadius: 14, padding: "18px 40px",
                        color: "#fff", fontSize: 18, fontWeight: 900,
                        cursor: "pointer", fontFamily: "inherit",
                        boxShadow: "0 8px 32px rgba(196,30,58,0.4)",
                        transition: "all 0.3s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(196,30,58,0.5)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(196,30,58,0.4)"; }}
                    >
                        14일 무료 체험 시작
                    </button>
                    <button onClick={() => document.getElementById("기능")?.scrollIntoView({ behavior: "smooth" })} style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 14, padding: "18px 40px",
                        color: "#ccc", fontSize: 18, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.3s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                    >
                        더 알아보기
                    </button>
                </div>

                {/* 부가 정보 */}
                <div style={{
                    display: "flex", gap: 24, justifyContent: "center", marginTop: 32,
                    animation: "fadeIn 0.8s ease 0.4s both",
                }}>
                    {["신용카드 불필요", "5분 만에 설정 완료", "언제든 해지 가능"].map(text => (
                        <span key={text} style={{ color: "#555", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "#4CAF50" }}>&#10003;</span> {text}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── 신뢰 지표 바 ────────────────────────────────────────────────
function TrustBar() {
    const [ref, isVisible] = useInView();
    return (
        <section ref={ref} style={{
            borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a",
            background: "rgba(255,255,255,0.02)",
            padding: "48px 24px",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease",
        }}>
            <div style={{
                maxWidth: 1000, margin: "0 auto",
                display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap",
                textAlign: "center",
            }}>
                {[
                    { num: 150, suffix: "+", label: "등록 도장" },
                    { num: 3200, suffix: "+", label: "관리 학생 수" },
                    { num: 98, suffix: "%", label: "학부모 만족도" },
                    { num: 50000, suffix: "+", label: "월간 알림 발송" },
                ].map(item => (
                    <div key={item.label}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: "#C41E3A", marginBottom: 4 }}>
                            <CountUp end={item.num} suffix={item.suffix} />
                        </div>
                        <div style={{ color: "#666", fontSize: 13 }}>{item.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── 문제 제기 섹션 ──────────────────────────────────────────────
function ProblemSection() {
    const [ref, isVisible] = useInView();
    return (
        <section ref={ref} style={{
            padding: "100px 24px", maxWidth: 1000, margin: "0 auto",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s ease",
        }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, color: "#fff" }}>
                    이런 고민, 있지 않으셨나요?
                </h2>
                <div style={{ width: 60, height: 3, background: "#C41E3A", margin: "0 auto" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                {[
                    { icon: "📞", title: "학부모 전화 폭주", desc: "\"우리 아이 도착했나요?\" 매일 반복되는 전화에 수업에 집중할 수 없습니다." },
                    { icon: "📋", title: "수기 출석 체크", desc: "종이 출석부로 관리하다 보니 빠지는 학생이 생기고 기록이 부정확합니다." },
                    { icon: "😰", title: "안전 불안감", desc: "학부모는 아이가 제 시간에 도장에 잘 도착했는지 항상 걱정됩니다." },
                ].map(item => (
                    <div key={item.title} style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid #1a1a1a",
                        borderRadius: 16, padding: 32,
                        transition: "all 0.3s",
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icon}</div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{item.title}</h3>
                        <p style={{ color: "#888", fontSize: 14, lineHeight: 1.7 }}>{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── 기능 소개 섹션 ──────────────────────────────────────────────
function FeaturesSection() {
    const [ref, isVisible] = useInView();
    const features = [
        {
            icon: "🔔", title: "실시간 푸시 알림",
            desc: "학생이 등원/하원 체크인하면 학부모 스마트폰에 즉시 알림이 발송됩니다.",
            color: "#C41E3A",
            details: ["FCM 기반 즉시 알림", "등원/하원 자동 구분", "알림 이력 영구 보관"]
        },
        {
            icon: "📱", title: "키오스크 체크인",
            desc: "태블릿이나 PC를 키오스크로 활용. 학생이 번호만 입력하면 자동 체크인됩니다.",
            color: "#FF6B35",
            details: ["번호 입력 방식 (간편)", "학생 사진 확인", "터치 친화적 UI"]
        },
        {
            icon: "📊", title: "출석 통계 대시보드",
            desc: "일별/주별/월별 출석률을 한눈에 파악. 데이터 기반 도장 운영이 가능합니다.",
            color: "#4CAF50",
            details: ["실시간 출석 현황", "학생별 출석률 분석", "월간 리포트 자동 생성"]
        },
        {
            icon: "👨‍👩‍👧", title: "학부모 전용 화면",
            desc: "학부모가 직접 자녀의 출석 기록과 알림 이력을 확인할 수 있습니다.",
            color: "#2196F3",
            details: ["자녀 출석 기록 조회", "알림 이력 확인", "모바일 최적화"]
        },
        {
            icon: "🏫", title: "다중 도장 관리",
            desc: "여러 지점을 운영 중이라면 하나의 계정에서 모두 관리할 수 있습니다.",
            color: "#9C27B0",
            details: ["지점별 분리 관리", "통합 대시보드", "지점장 권한 부여"]
        },
        {
            icon: "🔒", title: "보안 & 데이터 보호",
            desc: "Firebase 인증과 Supabase를 활용한 안전한 데이터 관리 체계를 제공합니다.",
            color: "#607D8B",
            details: ["Firebase 인증", "SSL 암호화", "개인정보 보호법 준수"]
        },
    ];

    return (
        <section id="기능" ref={ref} style={{
            padding: "100px 24px", maxWidth: 1200, margin: "0 auto",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s ease",
        }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
                <span style={{
                    color: "#C41E3A", fontSize: 13, fontWeight: 700, letterSpacing: 2,
                    textTransform: "uppercase",
                }}>Features</span>
                <h2 style={{ fontSize: 36, fontWeight: 900, marginTop: 12, marginBottom: 16, color: "#fff" }}>
                    도장 운영의 모든 것을 자동화
                </h2>
                <p style={{ color: "#666", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
                    복잡한 설정 없이, 가입 후 바로 사용할 수 있습니다.
                </p>
                <div style={{ width: 60, height: 3, background: "#C41E3A", margin: "20px auto 0" }} />
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 24,
            }}>
                {features.map((f, i) => (
                    <FeatureCard key={f.title} feature={f} delay={i * 0.1} />
                ))}
            </div>
        </section>
    );
}

function FeatureCard({ feature, delay }) {
    const [hover, setHover] = useState(false);
    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                background: hover ? `rgba(${feature.color === "#C41E3A" ? "196,30,58" : feature.color === "#FF6B35" ? "255,107,53" : feature.color === "#4CAF50" ? "76,175,80" : feature.color === "#2196F3" ? "33,150,243" : feature.color === "#9C27B0" ? "156,39,176" : "96,125,139"},0.08)` : "rgba(255,255,255,0.02)",
                border: `1px solid ${hover ? feature.color + "44" : "#1a1a1a"}`,
                borderRadius: 20, padding: 32,
                transition: "all 0.3s ease",
                transform: hover ? "translateY(-4px)" : "translateY(0)",
                cursor: "default",
            }}
        >
            <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${feature.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, marginBottom: 20,
            }}>{feature.icon}</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 10 }}>{feature.title}</h3>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{feature.desc}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {feature.details.map(d => (
                    <div key={d} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: feature.color, fontSize: 14 }}>&#10003;</span>
                        <span style={{ color: "#aaa", fontSize: 13 }}>{d}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── 데모 미리보기 섹션 ──────────────────────────────────────────
function DemoSection() {
    const [ref, isVisible] = useInView();
    const [activeTab, setActiveTab] = useState("admin");

    const screens = {
        admin: {
            title: "관장님 대시보드",
            items: [
                { label: "오늘의 출석", value: "24 / 30명", color: "#4CAF50" },
                { label: "미출석 학생", value: "6명", color: "#FF6B35" },
                { label: "이번 달 출석률", value: "94%", color: "#C41E3A" },
                { label: "전송된 알림", value: "48건", color: "#2196F3" },
            ]
        },
        kiosk: {
            title: "키오스크 체크인",
            items: [
                { label: "김태권 (1번)", value: "등원 15:02", color: "#4CAF50" },
                { label: "이준호 (2번)", value: "등원 15:05", color: "#4CAF50" },
                { label: "박서연 (3번)", value: "등원 15:08", color: "#4CAF50" },
                { label: "최민서 (4번)", value: "대기 중", color: "#555" },
            ]
        },
        parent: {
            title: "학부모 알림",
            items: [
                { label: "김태권 등원 알림", value: "15:02 도착", color: "#4CAF50" },
                { label: "이번 주 출석", value: "4 / 5일", color: "#2196F3" },
                { label: "이번 달 출석률", value: "96%", color: "#C41E3A" },
                { label: "다음 수업", value: "내일 15:00", color: "#FF6B35" },
            ]
        },
    };

    return (
        <section ref={ref} style={{
            padding: "100px 24px",
            background: "linear-gradient(180deg, #0a0a0a 0%, #0f0505 50%, #0a0a0a 100%)",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s ease",
        }}>
            <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
                <span style={{ color: "#C41E3A", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>PREVIEW</span>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginTop: 12, marginBottom: 40, color: "#fff" }}>
                    실제 화면을 미리 확인하세요
                </h2>

                {/* 탭 */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
                    {[
                        { key: "admin", label: "관장님", icon: "👨‍💼" },
                        { key: "kiosk", label: "키오스크", icon: "📱" },
                        { key: "parent", label: "학부모", icon: "👨‍👩‍👧" },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                            background: activeTab === tab.key ? "rgba(196,30,58,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${activeTab === tab.key ? "#C41E3A" : "#222"}`,
                            borderRadius: 10, padding: "10px 20px",
                            color: activeTab === tab.key ? "#fff" : "#666",
                            fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 400,
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "all 0.2s",
                        }}>{tab.icon} {tab.label}</button>
                    ))}
                </div>

                {/* 미리보기 카드 */}
                <div style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a",
                    borderRadius: 20, overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}>
                    {/* 타이틀바 */}
                    <div style={{
                        background: "linear-gradient(135deg, #1a0a0a, #0a0a0a)",
                        borderBottom: "2px solid #C41E3A",
                        padding: "16px 24px",
                        display: "flex", alignItems: "center", gap: 12,
                    }}>
                        <span style={{ fontSize: 20 }}>🥋</span>
                        <span style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>
                            {screens[activeTab].title}
                        </span>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
                        </div>
                    </div>

                    {/* 콘텐츠 */}
                    <div style={{ padding: 32 }}>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: 16,
                        }}>
                            {screens[activeTab].items.map(item => (
                                <div key={item.label} style={{
                                    background: "rgba(255,255,255,0.03)", border: "1px solid #1a1a1a",
                                    borderRadius: 12, padding: "20px 16px",
                                    textAlign: "left",
                                }}>
                                    <div style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>{item.label}</div>
                                    <div style={{ color: item.color, fontSize: 20, fontWeight: 900 }}>{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── 요금제 섹션 ────────────────────────────────────────────────
function PricingSection({ selectedPlan, setSelectedPlan, onStart }) {
    const [ref, isVisible] = useInView();

    const plans = [
        {
            id: "free",
            name: "무료",
            price: "0",
            period: "영구 무료",
            desc: "소규모 도장에 딱 맞는 플랜",
            features: ["학생 10명까지", "기본 출석 관리", "학부모 알림 (일 20건)", "이메일 지원"],
            cta: "무료로 시작",
            popular: false,
        },
        {
            id: "pro",
            name: "프로",
            price: "29,000",
            period: "/ 월",
            desc: "성장하는 도장을 위한 플랜",
            features: ["학생 50명까지", "실시간 푸시 알림 (무제한)", "출석 통계 대시보드", "학부모 전용 화면", "월간 리포트 자동 생성", "카카오톡 지원"],
            cta: "14일 무료 체험",
            popular: true,
        },
        {
            id: "premium",
            name: "프리미엄",
            price: "59,000",
            period: "/ 월",
            desc: "대형 도장 & 다중 지점 운영",
            features: ["학생 무제한", "다중 지점 관리", "커스텀 브랜딩", "API 연동", "전담 매니저 배정", "전화 + 카카오톡 지원", "데이터 내보내기"],
            cta: "14일 무료 체험",
            popular: false,
        },
    ];

    return (
        <section id="요금제" ref={ref} style={{
            padding: "100px 24px", maxWidth: 1100, margin: "0 auto",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s ease",
        }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
                <span style={{ color: "#C41E3A", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>PRICING</span>
                <h2 style={{ fontSize: 36, fontWeight: 900, marginTop: 12, marginBottom: 16, color: "#fff" }}>
                    합리적인 요금제
                </h2>
                <p style={{ color: "#666", fontSize: 16 }}>
                    도장 규모에 맞는 플랜을 선택하세요. 모든 유료 플랜은 14일 무료 체험이 가능합니다.
                </p>
                <div style={{ width: 60, height: 3, background: "#C41E3A", margin: "20px auto 0" }} />
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24, alignItems: "stretch",
            }}>
                {plans.map(plan => (
                    <div key={plan.id} style={{
                        background: plan.popular ? "rgba(196,30,58,0.05)" : "rgba(255,255,255,0.02)",
                        border: `${plan.popular ? "2px" : "1px"} solid ${plan.popular ? "#C41E3A" : "#1a1a1a"}`,
                        borderRadius: 24, padding: 36, position: "relative",
                        transition: "all 0.3s",
                        transform: plan.popular ? "scale(1.02)" : "scale(1)",
                    }}>
                        {plan.popular && (
                            <div style={{
                                position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                                background: "linear-gradient(135deg, #C41E3A, #8B0000)",
                                borderRadius: 100, padding: "6px 20px",
                                fontSize: 12, fontWeight: 700, color: "#fff",
                                boxShadow: "0 4px 16px rgba(196,30,58,0.4)",
                            }}>BEST</div>
                        )}

                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{plan.name}</h3>
                            <p style={{ color: "#666", fontSize: 13 }}>{plan.desc}</p>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <span style={{ fontSize: 12, color: "#888" }}>&#8361;</span>
                            <span style={{ fontSize: 44, fontWeight: 900, color: "#fff", margin: "0 4px" }}>{plan.price}</span>
                            <span style={{ color: "#666", fontSize: 14 }}>{plan.period}</span>
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            {plan.features.map(f => (
                                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                    <span style={{ color: plan.popular ? "#C41E3A" : "#4CAF50", fontSize: 14 }}>&#10003;</span>
                                    <span style={{ color: "#bbb", fontSize: 14 }}>{f}</span>
                                </div>
                            ))}
                        </div>

                        <button onClick={onStart} style={{
                            width: "100%",
                            background: plan.popular ? "linear-gradient(135deg, #C41E3A, #8B0000)" : "rgba(255,255,255,0.05)",
                            border: plan.popular ? "none" : "1px solid #333",
                            borderRadius: 12, padding: "16px",
                            color: "#fff", fontSize: 15, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                            transition: "all 0.2s",
                            boxShadow: plan.popular ? "0 4px 20px rgba(196,30,58,0.3)" : "none",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                        >{plan.cta}</button>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── 후기 섹션 ──────────────────────────────────────────────────
function TestimonialsSection() {
    const [ref, isVisible] = useInView();

    const testimonials = [
        {
            name: "김관장",
            role: "무궁화 태권도",
            text: "학부모 전화가 80% 이상 줄었습니다. 이제 수업에만 집중할 수 있어요. 도입 전과 후가 완전히 다릅니다.",
            rating: 5,
        },
        {
            name: "이서영",
            role: "학부모",
            text: "아이가 도장에 도착하면 바로 알림이 와요. 일하면서도 안심이 됩니다. 다른 학원에서도 이런 서비스가 있으면 좋겠어요.",
            rating: 5,
        },
        {
            name: "박사범",
            role: "호랑이 태권도",
            text: "종이 출석부 시절이 아득하네요. 통계 기능 덕분에 어떤 시간대에 학생이 많은지 바로 파악됩니다.",
            rating: 5,
        },
    ];

    return (
        <section id="후기" ref={ref} style={{
            padding: "100px 24px",
            background: "linear-gradient(180deg, #0a0a0a 0%, #0f0505 50%, #0a0a0a 100%)",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s ease",
        }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 60 }}>
                    <span style={{ color: "#C41E3A", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>TESTIMONIALS</span>
                    <h2 style={{ fontSize: 32, fontWeight: 900, marginTop: 12, marginBottom: 16, color: "#fff" }}>
                        실제 사용자 후기
                    </h2>
                    <div style={{ width: 60, height: 3, background: "#C41E3A", margin: "0 auto" }} />
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: 24,
                }}>
                    {testimonials.map(t => (
                        <div key={t.name} style={{
                            background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a",
                            borderRadius: 20, padding: 32,
                        }}>
                            <div style={{ color: "#FFD700", fontSize: 16, marginBottom: 16, letterSpacing: 2 }}>
                                {"&#9733;".repeat(t.rating).split("").map((_, i) => <span key={i}>&#9733;</span>)}
                            </div>
                            <p style={{ color: "#ccc", fontSize: 15, lineHeight: 1.8, marginBottom: 24, fontStyle: "italic" }}>
                                &ldquo;{t.text}&rdquo;
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: "50%",
                                    background: "linear-gradient(135deg, #C41E3A, #8B0000)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", fontWeight: 900, fontSize: 16,
                                }}>{t.name[0]}</div>
                                <div>
                                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                                    <div style={{ color: "#666", fontSize: 12 }}>{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── FAQ 섹션 ────────────────────────────────────────────────────
function FAQSection() {
    const [ref, isVisible] = useInView();
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        { q: "설정이 어렵지 않나요?", a: "전혀 어렵지 않습니다. 가입 후 도장 이름만 입력하면 바로 사용할 수 있습니다. 학생 등록도 이름과 번호만 입력하면 끝입니다." },
        { q: "학부모는 앱을 설치해야 하나요?", a: "아닙니다. 학부모는 웹 브라우저에서 바로 알림을 받을 수 있고, 푸시 알림 동의만 하면 됩니다. 별도 앱 설치가 필요 없습니다." },
        { q: "기존 학생 데이터를 옮길 수 있나요?", a: "네, 프로 플랜 이상에서는 엑셀/CSV 파일로 학생 정보를 일괄 등록할 수 있습니다. 마이그레이션 지원도 해드립니다." },
        { q: "무료 플랜에서 유료로 전환하면 데이터가 유지되나요?", a: "물론입니다. 모든 데이터는 그대로 유지됩니다. 업그레이드 시 추가 기능만 활성화됩니다." },
        { q: "해지는 어떻게 하나요?", a: "설정에서 원클릭으로 해지할 수 있습니다. 위약금이나 숨겨진 비용은 일절 없습니다." },
    ];

    return (
        <section ref={ref} style={{
            padding: "100px 24px", maxWidth: 800, margin: "0 auto",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s ease",
        }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
                <span style={{ color: "#C41E3A", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>FAQ</span>
                <h2 style={{ fontSize: 32, fontWeight: 900, marginTop: 12, marginBottom: 16, color: "#fff" }}>
                    자주 묻는 질문
                </h2>
                <div style={{ width: 60, height: 3, background: "#C41E3A", margin: "0 auto" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {faqs.map((faq, i) => (
                    <div key={i} style={{
                        background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a",
                        borderRadius: 14, overflow: "hidden",
                        transition: "all 0.3s",
                    }}>
                        <button onClick={() => setOpenIndex(openIndex === i ? null : i)} style={{
                            width: "100%", background: "none", border: "none",
                            padding: "20px 24px",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            cursor: "pointer", fontFamily: "inherit",
                        }}>
                            <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, textAlign: "left" }}>{faq.q}</span>
                            <span style={{
                                color: "#C41E3A", fontSize: 20, fontWeight: 300,
                                transform: openIndex === i ? "rotate(45deg)" : "rotate(0)",
                                transition: "transform 0.3s",
                                flexShrink: 0, marginLeft: 16,
                            }}>+</span>
                        </button>
                        {openIndex === i && (
                            <div style={{
                                padding: "0 24px 20px", color: "#888", fontSize: 14, lineHeight: 1.8,
                                borderTop: "1px solid #1a1a1a",
                                paddingTop: 16,
                            }}>{faq.a}</div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── 최종 CTA 섹션 ──────────────────────────────────────────────
function FinalCTA({ onStart }) {
    const [ref, isVisible] = useInView();
    return (
        <section ref={ref} style={{
            padding: "100px 24px",
            background: "radial-gradient(ellipse at 50% 50%, #2a0a0a 0%, #0a0a0a 70%)",
            textAlign: "center",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s ease",
        }}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <div style={{ fontSize: 56, marginBottom: 24 }}>🥋</div>
                <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 16 }}>
                    지금 바로 시작하세요
                </h2>
                <p style={{ color: "#888", fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
                    5분이면 도장 등록부터 첫 번째 알림 발송까지 완료됩니다.<br />
                    학부모의 신뢰를 얻는 가장 빠른 방법.
                </p>
                <button onClick={onStart} style={{
                    background: "linear-gradient(135deg, #C41E3A, #8B0000)",
                    border: "none", borderRadius: 14, padding: "20px 48px",
                    color: "#fff", fontSize: 20, fontWeight: 900,
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: "0 8px 40px rgba(196,30,58,0.4)",
                    transition: "all 0.3s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 50px rgba(196,30,58,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(196,30,58,0.4)"; }}
                >
                    14일 무료 체험 시작
                </button>
                <div style={{ color: "#555", fontSize: 13, marginTop: 16 }}>
                    신용카드 없이 시작 &middot; 언제든 해지 가능
                </div>
            </div>
        </section>
    );
}

// ─── 푸터 ────────────────────────────────────────────────────────
function Footer() {
    return (
        <footer style={{
            borderTop: "1px solid #1a1a1a",
            padding: "60px 24px 40px",
            background: "#050505",
        }}>
            <div style={{
                maxWidth: 1100, margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 40, marginBottom: 40,
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <span style={{ fontSize: 24 }}>🥋</span>
                        <span style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>도장알림</span>
                    </div>
                    <p style={{ color: "#666", fontSize: 13, lineHeight: 1.7 }}>
                        태권도장 출결 관리의 새로운 기준.<br />
                        학부모 안심, 관장님 편의.
                    </p>
                </div>

                <div>
                    <h4 style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>서비스</h4>
                    {["출결 알림", "키오스크", "대시보드", "학부모 화면"].map(item => (
                        <div key={item} style={{ color: "#666", fontSize: 13, marginBottom: 8, cursor: "pointer" }}>{item}</div>
                    ))}
                </div>

                <div>
                    <h4 style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>지원</h4>
                    {["가이드", "FAQ", "문의하기", "공지사항"].map(item => (
                        <div key={item} style={{ color: "#666", fontSize: 13, marginBottom: 8, cursor: "pointer" }}>{item}</div>
                    ))}
                </div>

                <div>
                    <h4 style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>법적 안내</h4>
                    {["이용약관", "개인정보처리방침", "사업자정보"].map(item => (
                        <div key={item} style={{ color: "#666", fontSize: 13, marginBottom: 8, cursor: "pointer" }}>{item}</div>
                    ))}
                </div>
            </div>

            <div style={{
                borderTop: "1px solid #1a1a1a", paddingTop: 24,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: 12,
            }}>
                <div style={{ color: "#444", fontSize: 12 }}>
                    &copy; 2026 도장알림. All rights reserved.
                </div>
                <div style={{ color: "#444", fontSize: 12 }}>
                    Made with ❤️ for 태권도
                </div>
            </div>
        </footer>
    );
}
