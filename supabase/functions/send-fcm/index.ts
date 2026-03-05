import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// --- Firebase Service Account 설정 ---
// Supabase 대시보드 -> Edge Functions -> Secrets 에서 환경변수 등록 필요
const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Firebase Admin 초기화 (REST API 방식으로 전송)
async function getAccessToken() {
    // JWT 생성을 위해 googleapis 라이브러리 사용 혹은 직접 구현 가능
    // 간편함을 위해 Edge Function 내에서 직접 POST 요청으로 토큰 획득
    const { client_email, private_key } = serviceAccount;

    // ... JWT 생성 로직 (Edge Function 환경에 맞춰 googleapis 혹은 jose 사용)
    // 실제 운영 시에는 Deno 호환 google 라이브러리 추가 필요
    // 여기서는 개념적 구조만 작성
    return "YOUR_ACCESS_TOKEN";
}

serve(async (req) => {
    try {
        const payload = await req.json()
        console.log("Webhook payload received:", payload);

        // 새 출석 기록이 생성되었을 때만 (INSERT)
        if (payload.type === 'INSERT' && payload.table === 'attendance') {
            const record = payload.record;

            // 1. 해당 학생의 정보 조회 (FCM 토큰을 얻기 위해)
            const supabase = createClient(supabaseUrl, supabaseServiceKey)
            const { data: student, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', record.student_id)
                .single()

            if (error || !student) {
                console.error("Student not found", error);
                return new Response("Error fetching student", { status: 400 })
            }

            const fcmToken = student.fcm_token;
            if (!fcmToken) {
                console.log("No FCM token for student", student.name);
                return new Response("No token, skipped", { status: 200 })
            }

            // 2. 알림 메시지 구성
            const title = record.type === '등원' ? '등원 알림 🥋' : '하원 알림 🏠';
            const body = record.type === '등원'
                ? `${student.name} 학생이 태권도장에 안전하게 도착했습니다. (${record.time})`
                : `${student.name} 학생이 태권도장에서 하원했습니다. (${record.time})`;

            // 3. FCM 발송 (HTTP v1 API)
            const accessToken = await getAccessToken();
            const fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: {
                        token: fcmToken,
                        notification: {
                            title: title,
                            body: body,
                        },
                        data: {
                            studentId: String(student.id),
                            type: record.type
                        }
                    }
                })
            });

            const fcmResult = await fcmResponse.json();
            console.log("FCM Response:", fcmResult);

            return new Response(JSON.stringify({ success: true, message: "Push sent!" }), {
                headers: { "Content-Type": "application/json" },
            })
        }

        return new Response("Not an insert event", { status: 200 })
    } catch (err) {
        console.error("Error in Edge Function:", err)
        return new Response(String(err?.message ?? err), { status: 500 })
    }
})
