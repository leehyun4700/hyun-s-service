import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { requestForToken, onMessageListener, auth, sendPushNotification } from "./lib/firebase";
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword
} from "firebase/auth";
import LandingPage from "./LandingPage";

// ─── 알림 시뮬레이션 (FCM 연동 전) ──────────────────────────────────
const createNotification = (student, type, academyId) => ({
    student_id: student.id,
    student_name: student.name,
    parent_name: student.parent,
    type,
    academy_id: academyId,
    time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    message: type === "등원"
        ? `🥋 ${student.name} 학생이 도장에 도착했습니다!`
        : `🏠 ${student.name} 학생이 귀가합니다. 안전하게 도착하길 바랍니다!`,
});

// ─── 관장님 로그인 화면 ───────────────────────────────────────────
function AdminLoginScreen({ onBack }) {
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [error, setError] = useState("");
    const [shake, setShake] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [academyName, setAcademyName] = useState("");

    const handleAuth = async () => {
        setLoading(true);
        setError("");
        try {
            if (isSignUp) {
                if (!academyName) throw new Error("도장 이름을 입력해주세요.");
                const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
                const user = userCredential.user;

                // Supabase academies 테이블에 정보 등록
                const { error: dbError } = await supabase.from("academies").insert([{
                    id: user.uid,
                    name: academyName,
                    admin_email: email
                }]);
                if (dbError) throw dbError;

            } else {
                await signInWithEmailAndPassword(auth, email, pw);
            }
        } catch (err) {
            console.error(err);
            let msg = "오류가 발생했습니다.";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = "이메일 또는 비밀번호가 틀립니다.";
            else if (err.code === 'auth/email-already-in-use') msg = "이미 사용 중인 이메일입니다.";
            else if (err.code === 'auth/weak-password') msg = "비밀번호가 너무 취약합니다.";
            else msg = err.message;

            setError(msg);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => { if (e.key === "Enter") handleAuth(); };

    return (
        <div style={{
            minHeight: "calc(100vh - 84px)",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <style>{`
        .admin-card { animation: fadeIn 0.4s ease; }
        .admin-input:focus { border-color: #C41E3A !important; outline: none; box-shadow: 0 0 0 2px rgba(196,30,58,0.2); }
      `}</style>

            <div className="admin-card" style={{
                width: "100%", maxWidth: 400,
                animation: shake ? "shake 0.5s ease" : undefined,
            }}>
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: "linear-gradient(135deg, #C41E3A, #8B0000)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 36, margin: "0 auto 20px",
                        boxShadow: "0 8px 32px rgba(196,30,58,0.4)",
                    }}>👨‍💼</div>
                    <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 6 }}>
                        {isSignUp ? "도장 등록" : "관장님 로그인"}
                    </h2>
                    <p style={{ color: "#555", fontSize: 13 }}>{isSignUp ? "새로운 도장 계정을 생성합니다" : "관리자 전용 페이지입니다"}</p>
                </div>

                <div style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid #222",
                    borderRadius: 24, padding: 32,
                }}>
                    {isSignUp && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 8, letterSpacing: 1 }}>도장 이름</label>
                            <div style={{ position: "relative" }}>
                                <span style={{
                                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                                    fontSize: 16, color: "#555",
                                }}>🏫</span>
                                <input
                                    className="admin-input" type="text" placeholder="예: 무궁화 태권도"
                                    value={academyName} onChange={e => setAcademyName(e.target.value)}
                                    style={{
                                        width: "100%", background: "#111", border: "1px solid #2a2a2a",
                                        borderRadius: 12, padding: "14px 14px 14px 44px",
                                        color: "#fff", fontSize: 15, fontFamily: "inherit", transition: "all 0.2s",
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 8, letterSpacing: 1 }}>이메일</label>
                        <div style={{ position: "relative" }}>
                            <span style={{
                                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                                fontSize: 16, color: "#555",
                            }}>📧</span>
                            <input
                                className="admin-input" type="email" placeholder="email@example.com"
                                value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                                onKeyDown={handleKey}
                                style={{
                                    width: "100%", background: "#111", border: "1px solid #2a2a2a",
                                    borderRadius: 12, padding: "14px 14px 14px 44px",
                                    color: "#fff", fontSize: 15, fontFamily: "inherit", transition: "all 0.2s",
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 8, letterSpacing: 1 }}>비밀번호</label>
                        <div style={{ position: "relative" }}>
                            <span style={{
                                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                                fontSize: 16, color: "#555",
                            }}>🔒</span>
                            <input
                                className="admin-input" type={showPw ? "text" : "password"} placeholder="비밀번호 입력"
                                value={pw} onChange={e => { setPw(e.target.value); setError(""); }}
                                onKeyDown={handleKey}
                                style={{
                                    width: "100%", background: "#111", border: "1px solid #2a2a2a",
                                    borderRadius: 12, padding: "14px 44px 14px 44px",
                                    color: "#fff", fontSize: 15, fontFamily: "inherit", transition: "all 0.2s",
                                }}
                            />
                            <button onClick={() => setShowPw(p => !p)} style={{
                                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer", fontSize: 16,
                                color: "#555", padding: 0,
                            }}>{showPw ? "🙈" : "👁️"}</button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: "rgba(196,30,58,0.1)", border: "1px solid rgba(196,30,58,0.4)",
                            borderRadius: 10, padding: "10px 14px", marginBottom: 20,
                            color: "#C41E3A", fontSize: 13, textAlign: "center",
                        }}>⚠️ {error}</div>
                    )}

                    <button onClick={handleAuth} disabled={loading} style={{
                        width: "100%", background: "linear-gradient(135deg, #C41E3A, #8B0000)", border: "none",
                        borderRadius: 14, padding: "16px", color: "#fff", fontSize: 16, fontWeight: 900,
                        cursor: loading ? "default" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(196,30,58,0.3)", transition: "all 0.2s",
                        opacity: loading ? 0.7 : 1
                    }}
                        onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(196,30,58,0.5)"; } }}
                        onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(196,30,58,0.3)"; } }}
                    >{loading ? "처리 중..." : (isSignUp ? "가입하기" : "로그인")}</button>

                    <div style={{ marginTop: 20, textAlign: "center" }}>
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{ background: "none", border: "none", color: "#C41E3A", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
                        >
                            {isSignUp ? "이미 계정이 있으신가요? 로그인" : "새 도장인가요? 가입하기"}
                        </button>
                    </div>
                </div>

                <button onClick={onBack} style={{
                    width: "100%", marginTop: 16, background: "transparent", border: "none",
                    color: "#444", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 10,
                }}>← 처음으로 돌아가기</button>
            </div>
        </div>
    );
}

// ─── 메인 앱 ─────────────────────────────────────────────────────
export default function TaekwondoApp() {
    const [showLanding, setShowLanding] = useState(() => {
        // sessionStorage를 사용해 새로고침 시에도 랜딩 재표시
        return !sessionStorage.getItem("app_started");
    });
    const [role, setRole] = useState(null); // "admin" | "parent" | "kiosk"
    const [currentUser, setCurrentUser] = useState(null);
    const [academyInfo, setAcademyInfo] = useState(null);

    // Supabase 연동 상태 관리
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loadingDb, setLoadingDb] = useState(true);

    const [showNotifToast, setShowNotifToast] = useState(null);
    const [parentStudentNum, setParentStudentNum] = useState("");

    // Firebase Auth 상태 감시
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                sessionStorage.setItem("app_started", "1");
                setShowLanding(false);
                // Supabase에서 도장 정보 가져오기
                const { data, error } = await supabase.from("academies").select("*").eq("id", user.uid).single();
                if (data) {
                    setAcademyInfo(data);
                    // 로그인 되어 있으면 관리자 모드로 자동 진입 (역할이 없었을 때만)
                    setRole(prev => prev === "admin-login" || !prev ? "admin" : prev);
                } else {
                    // 도장 정보가 없으면 로그아웃 처리하거나 가입 유도
                    console.error("Academy info not found for user", user.uid);
                }
            } else {
                setCurrentUser(null);
                setAcademyInfo(null);
                if (role === "admin") setRole(null);
            }
        });
        return () => unsubscribe();
    }, [role]);

    // Supabase 데이터 가져오기 및 실시간 구독 (academy_id 기반 필터링)
    useEffect(() => {
        if (!academyInfo) {
            setStudents([]);
            setAttendance([]);
            setNotifications([]);
            setLoadingDb(false);
            return;
        }

        const fetchInitialData = async () => {
            setLoadingDb(true);
            try {
                const [{ data: st }, { data: att }, { data: notif }] = await Promise.all([
                    supabase.from("students").select("*").eq("academy_id", academyInfo.id).order("created_at", { ascending: true }),
                    supabase.from("attendance").select("*").eq("academy_id", academyInfo.id).order("created_at", { ascending: false }),
                    supabase.from("notifications").select("*").eq("academy_id", academyInfo.id).order("created_at", { ascending: false }),
                ]);

                if (st) {
                    setStudents(st);
                    if (st.length > 0) setParentStudentNum(st[0].number);
                }
                if (att) setAttendance(att);
                if (notif) setNotifications(notif);
            } catch (err) {
                console.error("Error fetching remote data:", err);
            } finally {
                setLoadingDb(false);
            }
        };

        fetchInitialData();

        // Students 구독
        const channel = supabase.channel(`academy-${academyInfo.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `academy_id=eq.${academyInfo.id}` }, payload => {
                if (payload.eventType === 'INSERT') setStudents(p => [...p, payload.new]);
                if (payload.eventType === 'UPDATE') setStudents(p => p.map(s => s.id === payload.new.id ? payload.new : s));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance', filter: `academy_id=eq.${academyInfo.id}` }, payload => {
                setAttendance(p => [payload.new, ...p]);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `academy_id=eq.${academyInfo.id}` }, payload => {
                setNotifications(p => [payload.new, ...p]);
                setShowNotifToast(payload.new);
                setTimeout(() => setShowNotifToast(null), 3500);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [academyInfo]);

    const handleCheckin = async (number, type) => {
        if (!academyInfo) return null;
        const student = students.find(s => s.number === number && s.active);
        if (!student) return null;

        const time = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
        const date = new Date().toLocaleDateString("ko-KR");

        const record = {
            student_id: student.id,
            student_name: student.name,
            number: student.number,
            type,
            time,
            date,
            academy_id: academyInfo.id
        };

        const notif = createNotification(student, type, academyInfo.id);

        await Promise.all([
            supabase.from("attendance").insert([record]),
            supabase.from("notifications").insert([notif])
        ]);

        // FCM 푸시 발송 로직 추가
        if (student.fcm_token) {
            console.log(`Sending FCM to ${student.name}'s parent...`);
            sendPushNotification(
                student.fcm_token,
                notif.message.split('!')[0] + '!', // 제목
                notif.message // 내용
            );
        }

        return student;
    };

    const todayAttendance = attendance.filter(a => a.date === new Date().toLocaleDateString("ko-KR"));

    const handleRoleSelect = (r) => {
        if (r === "admin" && !currentUser) { setRole("admin-login"); return; }
        setRole(r);
    };

    const handleAdminLogout = async () => {
        await signOut(auth);
        setRole(null);
    };

    if (showLanding) return (
        <LandingPage onStart={() => {
            sessionStorage.setItem("app_started", "1");
            setShowLanding(false);
        }} />
    );

    if (loadingDb) return (
        <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>
            로딩 중... 🥋
        </div>
    );

    if (!role) return <LoginScreen onSelect={handleRoleSelect} />;

    if (role === "admin-login") return (
        <div style={{ minHeight: "100vh" }}>
            <nav style={{
                background: "linear-gradient(135deg, #1a0a0a, #0a0a0a)", borderBottom: "2px solid #C41E3A",
                padding: "0 24px", display: "flex", alignItems: "center", height: 60, position: "sticky", top: 0, zIndex: 100, gap: 12,
            }}>
                <span style={{ fontSize: 28 }}>🥋</span>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: 2 }}>태권도장 알림 시스템</div>
            </nav>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
                <AdminLoginScreen onBack={() => setRole(null)} />
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh" }}>
            <nav style={{
                background: "linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%)", borderBottom: "2px solid #C41E3A",
                padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🥋</span>
                    <div>
                        <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: 2 }}>{academyInfo ? academyInfo.name : "태권도장 알림 시스템"}</div>
                        <div style={{ color: "#C41E3A", fontSize: 11, letterSpacing: 1 }}>
                            {role === "admin" ? "🔐 관장님 모드" : role === "parent" ? "학부모 모드" : "키오스크 모드"}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {["admin", "parent", "kiosk"].map(r => (
                        <button key={r} onClick={() => handleRoleSelect(r)} style={{
                            background: role === r ? "#C41E3A" : "transparent", color: role === r ? "#fff" : "#666",
                            border: `1px solid ${role === r ? "#C41E3A" : "#333"}`, borderRadius: 6, padding: "5px 12px", fontSize: 12,
                            cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
                        }}>
                            {r === "admin" ? "🔐 관장" : r === "parent" ? "학부모" : "키오스크"}
                        </button>
                    ))}
                    {currentUser && (
                        <button onClick={handleAdminLogout} style={{
                            background: "transparent", border: "1px solid #333", color: "#555", borderRadius: 6,
                            padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                        }}>로그아웃</button>
                    )}
                </div>
            </nav>

            {!academyInfo && role !== "admin" && (
                <div style={{ textAlign: "center", color: "#666", padding: 100 }}>
                    <div style={{ fontSize: 40, marginBottom: 20 }}>⚠️</div>
                    <div>로그인이 되어있지 않거나 도장 정보를 불러올 수 없습니다.</div>
                    <div>관장님 모드에서 먼저 로그인해 주세요.</div>
                </div>
            )}

            {academyInfo && (
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
                    {showNotifToast && (
                        <div style={{
                            position: "fixed", top: 80, right: 24, zIndex: 9999,
                            background: "linear-gradient(135deg, #1a3a1a, #0d1f0d)", border: "1px solid #4CAF50",
                            borderRadius: 12, padding: "16px 20px", boxShadow: "0 8px 32px rgba(76,175,80,0.3)",
                            animation: "slideIn 0.3s ease", maxWidth: 320,
                        }}>
                            <div style={{ color: "#4CAF50", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>📱 학부모 알림 전송됨</div>
                            <div style={{ color: "#fff", fontSize: 14 }}>{showNotifToast.message}</div>
                            <div style={{ color: "#888", fontSize: 11, marginTop: 4 }}>{showNotifToast.parent_name}님께 전송 • {showNotifToast.time}</div>
                        </div>
                    )}

                    {role === "admin" && <AdminView academyId={academyInfo.id} students={students} attendance={attendance} todayAttendance={todayAttendance} notifications={notifications} />}
                    {role === "parent" && <ParentView students={students} attendance={attendance} notifications={notifications} parentStudentNum={parentStudentNum} setParentStudentNum={setParentStudentNum} />}
                    {role === "kiosk" && <KioskView students={students} onCheckin={handleCheckin} />}
                </div>
            )}
        </div>
    );
}

// ─── 로그인 화면 ─────────────────────────────────────────────────
function LoginScreen({ onSelect }) {
    return (
        <div style={{
            minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, #2a0a0a 0%, #0a0a0a 60%)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
        }}>
            <div style={{
                position: "absolute", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(196,30,58,0.1)",
                top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            }} />
            <div style={{
                position: "absolute", width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(196,30,58,0.15)",
                top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            }} />

            <div style={{ textAlign: "center", marginBottom: 60, position: "relative" }}>
                <div style={{ fontSize: 80, marginBottom: 16 }}>🥋</div>
                <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 900, letterSpacing: 4, marginBottom: 8, }}>태권도장 알림 시스템</h1>
                <p style={{ color: "#666", fontSize: 14, letterSpacing: 2 }}>TAEKWONDO ACADEMY MANAGEMENT</p>
                <div style={{ width: 80, height: 3, background: "#C41E3A", margin: "20px auto 0" }} />
            </div>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", position: "relative" }}>
                {[
                    { role: "admin", icon: "👨‍💼", title: "관장님", desc: "도장 관리 · 학생 관리 · 알림 기록", color: "#C41E3A" },
                    { role: "kiosk", icon: "📱", title: "키오스크", desc: "학생 등하원 체크인", color: "#FF6B35" },
                    { role: "parent", icon: "👨‍👩‍👧", title: "학부모", desc: "관리 중인 자녀 출석 확인", color: "#4CAF50" },
                ].map(item => (
                    <button key={item.role} onClick={() => onSelect(item.role)} style={{
                        background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 20, padding: "32px 40px",
                        cursor: "pointer", width: 220, transition: "all 0.3s", position: "relative", overflow: "hidden", fontFamily: "inherit",
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = `rgba(${item.color === "#C41E3A" ? "196,30,58" : item.color === "#FF6B35" ? "255,107,53" : "76,175,80"},0.15)`;
                            e.currentTarget.style.border = `1px solid ${item.color}`;
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = `0 20px 40px ${item.color}33`;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>{item.icon}</div>
                        <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{item.title}</div>
                        <div style={{ color: "#666", fontSize: 12, lineHeight: 1.6 }}>{item.desc}</div>
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: item.color, opacity: 0.7, }} />
                    </button>
                ))}
            </div>
        </div>
    );
}

const BELT_COLORS = {
    "흰띠": "#f0f0f0", "노란띠": "#FFD700", "초록띠": "#4CAF50",
    "파란띠": "#2196F3", "빨간띠": "#F44336", "검은띠": "#111",
};

// ─── 관장님 화면 ──────────────────────────────────────────────────
function AdminView({ academyId, students, attendance, todayAttendance, notifications }) {
    const [tab, setTab] = useState("dashboard");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: "", age: "", parent: "", phone: "", belt: "흰띠" });

    const presentToday = todayAttendance.filter(a => a.type === "등원").map(a => a.student_id);
    const leftToday = todayAttendance.filter(a => a.type === "하원").map(a => a.student_id);

    const addStudent = async () => {
        if (!newStudent.name || !newStudent.parent || !newStudent.phone) return;
        const nextNum = String(students.length + 1).padStart(2, "0");

        await supabase.from("students").insert([{
            number: nextNum,
            active: true,
            academy_id: academyId,
            ...newStudent,
            age: parseInt(newStudent.age) || 8,
        }]);

        setNewStudent({ name: "", age: "", parent: "", phone: "", belt: "흰띠" });
        setShowAddModal(false);
    };

    const tabs = [
        { id: "dashboard", label: "📊 대시보드" },
        { id: "students", label: "👦 학생 관리" },
        { id: "attendance", label: "📋 출석 기록" },
        { id: "notifications", label: "🔔 알림 기록" },
    ];

    return (
        <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #222", paddingBottom: 0 }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        background: "transparent", border: "none", borderBottom: tab === t.id ? "2px solid #C41E3A" : "2px solid transparent",
                        color: tab === t.id ? "#fff" : "#555", padding: "10px 20px", cursor: "pointer", fontSize: 14,
                        fontFamily: "inherit", fontWeight: tab === t.id ? 700 : 400, transition: "all 0.2s", marginBottom: -1,
                    }}>{t.label}</button>
                ))}
            </div>

            {tab === "dashboard" && (
                <div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
                        {[
                            { label: "전체 학생", value: students.filter(s => s.active).length, icon: "👥", color: "#2196F3" },
                            { label: "오늘 등원", value: new Set(presentToday).size, icon: "✅", color: "#4CAF50" },
                            { label: "오늘 하원", value: new Set(leftToday).size, icon: "🏠", color: "#FF9800" },
                            { label: "오늘 알림", value: notifications.length, icon: "🔔", color: "#C41E3A" },
                        ].map(stat => (
                            <div key={stat.label} style={{
                                background: "rgba(255,255,255,0.03)", border: "1px solid #222", borderRadius: 16, padding: 24, borderLeft: `3px solid ${stat.color}`,
                            }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>{stat.icon}</div>
                                <div style={{ color: stat.color, fontSize: 36, fontWeight: 900 }}>{stat.value}</div>
                                <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 16, padding: 24 }}>
                        <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 20 }}>오늘 출석 현황</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                            {students.filter(s => s.active).map(s => {
                                const arrived = presentToday.includes(s.id);
                                const left = leftToday.includes(s.id);
                                return (
                                    <div key={s.id} style={{
                                        background: arrived ? (left ? "rgba(255,152,0,0.1)" : "rgba(76,175,80,0.1)") : "rgba(255,255,255,0.02)",
                                        border: `1px solid ${arrived ? (left ? "#FF9800" : "#4CAF50") : "#1a1a1a"}`, borderRadius: 12, padding: 16, textAlign: "center",
                                    }}>
                                        <div style={{ fontSize: 24, marginBottom: 8 }}>{arrived ? (left ? "🏠" : "✅") : "⭕"}</div>
                                        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                                        <div style={{ color: "#555", fontSize: 11 }}>번호 {s.number}</div>
                                        <div style={{ color: arrived ? (left ? "#FF9800" : "#4CAF50") : "#333", fontSize: 11, marginTop: 4, fontWeight: 700, }}>
                                            {arrived ? (left ? "하원완료" : "등원중") : "미출석"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {tab === "students" && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>등록 학생 목록</h3>
                        <button onClick={() => setShowAddModal(true)} style={{
                            background: "#C41E3A", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                        }}>+ 학생 추가</button>
                    </div>
                    <div style={{ display: "grid", gap: 10 }}>
                        {students.map(s => (
                            <div key={s.id} style={{
                                background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 20,
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: "50%", background: "#C41E3A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 16, flexShrink: 0,
                                }}>{s.number}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{s.name}</div>
                                    <div style={{ color: "#555", fontSize: 12 }}>학부모: {s.parent} · {s.phone}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{
                                        display: "inline-block", background: BELT_COLORS[s.belt] + "22", border: `1px solid ${BELT_COLORS[s.belt]}`, color: BELT_COLORS[s.belt] === "#f0f0f0" ? "#aaa" : BELT_COLORS[s.belt], borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700,
                                    }}>{s.belt}</div>
                                    <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>{s.age}세</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {showAddModal && (
                        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, }}>
                            <div style={{ background: "#111", border: "1px solid #333", borderRadius: 20, padding: 32, width: 400, }}>
                                <h3 style={{ color: "#fff", marginBottom: 24, fontSize: 18 }}>새 학생 등록</h3>
                                {[
                                    { key: "name", label: "이름", placeholder: "홍길동" },
                                    { key: "age", label: "나이", placeholder: "8", type: "number" },
                                    { key: "parent", label: "학부모 이름", placeholder: "홍아버지" },
                                    { key: "phone", label: "연락처", placeholder: "010-0000-0000" },
                                ].map(field => (
                                    <div key={field.key} style={{ marginBottom: 16 }}>
                                        <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>{field.label}</label>
                                        <input type={field.type || "text"} placeholder={field.placeholder} value={newStudent[field.key]} onChange={e => setNewStudent(p => ({ ...p, [field.key]: e.target.value }))} style={{
                                            width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none",
                                        }} />
                                    </div>
                                ))}
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 6 }}>띠</label>
                                    <select value={newStudent.belt} onChange={e => setNewStudent(p => ({ ...p, belt: e.target.value }))} style={{
                                        width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, fontFamily: "inherit",
                                    }}>
                                        {Object.keys(BELT_COLORS).map(b => <option key={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button onClick={() => setShowAddModal(false)} style={{ flex: 1, background: "transparent", border: "1px solid #333", color: "#888", borderRadius: 8, padding: 12, cursor: "pointer", fontFamily: "inherit", }}>취소</button>
                                    <button onClick={addStudent} style={{ flex: 1, background: "#C41E3A", border: "none", color: "#fff", borderRadius: 8, padding: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, }}>등록</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {tab === "attendance" && (
                <div>
                    <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>출석 기록</h3>
                    {attendance.length === 0 ? (
                        <div style={{ textAlign: "center", color: "#444", padding: 60 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                            <div>아직 출석 기록이 없습니다.</div>
                            <div style={{ fontSize: 12, marginTop: 8 }}>키오스크에서 학생이 체크인하면 여기에 기록됩니다.</div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                            {attendance.map(a => (
                                <div key={a.id} style={{
                                    background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16,
                                }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: "50%", background: a.type === "등원" ? "rgba(76,175,80,0.2)" : "rgba(255,152,0,0.2)",
                                        border: `1px solid ${a.type === "등원" ? "#4CAF50" : "#FF9800"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                                    }}>{a.type === "등원" ? "✅" : "🏠"}</div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{ color: "#fff", fontWeight: 700 }}>{a.student_name}</span>
                                        <span style={{ color: a.type === "등원" ? "#4CAF50" : "#FF9800", fontWeight: 700, marginLeft: 8, fontSize: 13, }}>{a.type}</span>
                                    </div>
                                    <div style={{ color: "#555", fontSize: 13 }}>{a.date} {a.time}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === "notifications" && (
                <div>
                    <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>발송된 알림 기록</h3>
                    {notifications.length === 0 ? (
                        <div style={{ textAlign: "center", color: "#444", padding: 60 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
                            <div>발송된 알림이 없습니다.</div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                            {notifications.map(n => (
                                <div key={n.id} style={{
                                    background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "flex-start", gap: 16,
                                }}>
                                    <div style={{ fontSize: 24, width: 44, textAlign: "center", flexShrink: 0, }}>{n.type === "등원" ? "✅" : "🏠"}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: "#fff", fontSize: 14 }}>{n.message}</div>
                                        <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>수신: {n.parent_name}님 · {n.time}</div>
                                    </div>
                                    <div style={{ background: "rgba(76,175,80,0.2)", border: "1px solid #4CAF50", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: "#4CAF50", whiteSpace: "nowrap", }}>전송완료</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── 학부모 화면 ──────────────────────────────────────────────────
function ParentView({ students, attendance, notifications, parentStudentNum, setParentStudentNum }) {
    const myStudent = students.find(s => s.number === parentStudentNum);
    const myAttendance = myStudent ? attendance.filter(a => a.student_id === myStudent.id) : [];
    const myNotifications = myStudent ? notifications.filter(n => n.student_id === myStudent.id) : [];

    // FCM 알림 권한 요청 및 토큰 저장
    useEffect(() => {
        if (!myStudent) return;

        const setupFCM = async () => {
            try {
                const token = await requestForToken();
                if (token && token !== myStudent.fcm_token) {
                    // 토큰이 없었거나, 갱신된 경우 Supabase에 저장
                    await supabase
                        .from('students')
                        .update({ fcm_token: token })
                        .eq('id', myStudent.id);
                    console.log("FCM Token updated setting:", token);
                }
            } catch (err) {
                console.error("Failed to set up FCM:", err);
            }
        };

        setupFCM();
    }, [myStudent]);

    // 포그라운드 알림 수신
    useEffect(() => {
        onMessageListener().then(payload => {
            console.log('Received foreground message: ', payload);
            if (Notification.permission === 'granted') {
                new Notification(payload.notification.title, {
                    body: payload.notification.body,
                    icon: '/vite.svg'
                });
            }
        }).catch(err => console.log('failed: ', err));
    }, []);

    return (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ marginBottom: 24 }}>
                <label style={{ color: "#888", fontSize: 12, display: "block", marginBottom: 8 }}>내 아이 선택</label>
                <select value={parentStudentNum} onChange={e => setParentStudentNum(e.target.value)} style={{
                    width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 16, fontFamily: "inherit",
                }}>
                    {students.map(s => <option key={s.id} value={s.number}>{s.number}번 · {s.name} ({s.parent})</option>)}
                </select>
            </div>

            {myStudent && (
                <>
                    <div style={{
                        background: "linear-gradient(135deg, #1a0a0a, #0d1a0d)", border: "1px solid #C41E3A", borderRadius: 20, padding: 28, marginBottom: 24, textAlign: "center",
                    }}>
                        <div style={{ fontSize: 64, marginBottom: 12 }}>🥋</div>
                        <div style={{ color: "#fff", fontSize: 24, fontWeight: 900 }}>{myStudent.name}</div>
                        <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>{myStudent.age}세 · 번호 {myStudent.number}</div>
                        <div style={{
                            display: "inline-block", marginTop: 12, background: BELT_COLORS[myStudent.belt] + "22", border: `1px solid ${BELT_COLORS[myStudent.belt]}`, color: BELT_COLORS[myStudent.belt] === "#f0f0f0" ? "#aaa" : BELT_COLORS[myStudent.belt], borderRadius: 20, padding: "4px 16px", fontSize: 13, fontWeight: 700,
                        }}>{myStudent.belt}</div>

                        {myAttendance.length > 0 && (
                            <div style={{ marginTop: 20, padding: "12px 20px", background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 12, }}>
                                <div style={{ color: "#4CAF50", fontSize: 13, fontWeight: 700 }}>오늘 {myAttendance[0].type} ·  {myAttendance[0].time}</div>
                            </div>
                        )}
                    </div>

                    <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📱 수신된 알림</h3>
                    {myNotifications.length === 0 ? (
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 16, padding: 40, textAlign: "center", color: "#444", }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                            <div>아직 수신된 알림이 없습니다.</div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {myNotifications.map(n => (
                                <div key={n.id} style={{
                                    background: n.type === "등원" ? "rgba(76,175,80,0.08)" : "rgba(255,152,0,0.08)", border: `1px solid ${n.type === "등원" ? "rgba(76,175,80,0.3)" : "rgba(255,152,0,0.3)"}`, borderRadius: 14, padding: "16px 20px",
                                }}>
                                    <div style={{ color: "#fff", fontSize: 14, marginBottom: 4 }}>{n.message}</div>
                                    <div style={{ color: "#555", fontSize: 12 }}>{n.time}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "24px 0 16px" }}>📋 출석 기록</h3>
                    {myAttendance.length === 0 ? (
                        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 16, padding: 40, textAlign: "center", color: "#444", }}>아직 출석 기록이 없습니다.</div>
                    ) : (
                        <div style={{ display: "grid", gap: 8 }}>
                            {myAttendance.map(a => (
                                <div key={a.id} style={{
                                    background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontSize: 20 }}>{a.type === "등원" ? "✅" : "🏠"}</span>
                                        <span style={{ color: a.type === "등원" ? "#4CAF50" : "#FF9800", fontWeight: 700, }}>{a.type}</span>
                                    </div>
                                    <div style={{ color: "#555", fontSize: 13 }}>{a.date} {a.time}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── 키오스크 화면 ────────────────────────────────────────────────
function KioskView({ students, onCheckin }) {
    const [input, setInput] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleNumber = (n) => { if (input.length < 2) setInput(p => p + n); };
    const handleClear = () => { setInput(""); setError(""); setResult(null); setLoading(false); };

    const handleSubmit = async (type) => {
        if (input.length === 0) { setError("번호를 입력해주세요"); return; }
        const num = input.padStart(2, "0");
        setLoading(true);
        const student = await onCheckin(num, type);
        setLoading(false);

        if (!student) {
            setError(`${num}번 학생을 찾을 수 없습니다`);
            setTimeout(() => { setError(""); setInput(""); }, 2000);
        } else {
            setResult({ student, type });
            setTimeout(() => { setResult(null); setInput(""); }, 3000);
        }
    };

    return (
        <div style={{ minHeight: "calc(100vh - 84px)", display: "flex", alignItems: "center", justifyContent: "center", }}>
            <div style={{ width: "100%", maxWidth: 360 }}>
                {result ? (
                    <div style={{
                        background: result.type === "등원" ? "linear-gradient(135deg, #0d2a0d, #0a1a0a)" : "linear-gradient(135deg, #2a1a00, #1a1000)", border: `2px solid ${result.type === "등원" ? "#4CAF50" : "#FF9800"}`, borderRadius: 28, padding: 48, textAlign: "center", animation: "slideIn 0.3s ease",
                    }}>
                        <div style={{ fontSize: 80, marginBottom: 20 }}>{result.type === "등원" ? "✅" : "🏠"}</div>
                        <div style={{ color: result.type === "등원" ? "#4CAF50" : "#FF9800", fontSize: 28, fontWeight: 900, marginBottom: 8, }}>{result.student.name} 학생</div>
                        <div style={{ color: "#fff", fontSize: 20, marginBottom: 16 }}>{result.type === "등원" ? "등원했습니다! 🥋" : "하원합니다! 👋"}</div>
                        <div style={{ color: "#555", fontSize: 13 }}>학부모님께 알림이 전송되었습니다</div>
                    </div>
                ) : (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #222", borderRadius: 28, padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", pointerEvents: loading ? "none" : "auto", opacity: loading ? 0.7 : 1 }}>
                        <div style={{ textAlign: "center", marginBottom: 28 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>🥋</div>
                            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>태권도장 출석</h2>
                            <p style={{ color: "#555", fontSize: 13, marginTop: 4 }}>학생 번호를 입력하세요</p>
                        </div>

                        <div style={{ background: "#0a0a0a", border: "2px solid #C41E3A", borderRadius: 16, padding: "20px 24px", marginBottom: 20, textAlign: "center", minHeight: 76, display: "flex", alignItems: "center", justifyContent: "center", }}>
                            {input ? <span style={{ color: "#fff", fontSize: 52, fontWeight: 900, letterSpacing: 8 }}>{input.padStart(2, "·")}</span> : <span style={{ color: "#333", fontSize: 52, fontWeight: 900, letterSpacing: 8 }}>··</span>}
                        </div>

                        {error && <div style={{ background: "rgba(196,30,58,0.1)", border: "1px solid #C41E3A", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#C41E3A", fontSize: 13, textAlign: "center", }}>{error}</div>}

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((n, i) => (
                                <button key={i} onClick={() => {
                                    if (n === "⌫") setInput(p => p.slice(0, -1)); else if (n !== "") handleNumber(String(n));
                                }} style={{
                                    background: n === "⌫" ? "rgba(196,30,58,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${n === "⌫" ? "#C41E3A" : "#222"}`, borderRadius: 14, padding: "18px 10px", color: n === "⌫" ? "#C41E3A" : n === "" ? "transparent" : "#fff", fontSize: 22, fontWeight: 700, cursor: n === "" ? "default" : "pointer", fontFamily: "inherit", transition: "all 0.1s", pointerEvents: n === "" ? "none" : "auto",
                                }}
                                    onMouseDown={e => { if (n !== "") e.currentTarget.style.transform = "scale(0.95)"; }} onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                                >{n}</button>
                            ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <button onClick={() => handleSubmit("등원")} style={{ background: "linear-gradient(135deg, #2d7a2d, #1a5c1a)", border: "none", borderRadius: 16, padding: "18px 10px", color: "#fff", fontSize: 18, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>✅ 등원</button>
                            <button onClick={() => handleSubmit("하원")} style={{ background: "linear-gradient(135deg, #7a5a00, #5c4200)", border: "none", borderRadius: 16, padding: "18px 10px", color: "#fff", fontSize: 18, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>🏠 하원</button>
                        </div>
                        <button onClick={handleClear} style={{ width: "100%", marginTop: 10, background: "transparent", border: "1px solid #222", borderRadius: 12, padding: 12, color: "#444", fontSize: 13, cursor: "pointer", fontFamily: "inherit", }}>초기화</button>
                    </div>
                )}
            </div>
        </div>
    );
}
