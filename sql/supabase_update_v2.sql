-- 1. 도장(Academy) 테이블 추가
CREATE TABLE IF NOT EXISTS academies (
  id UUID PRIMARY KEY, -- Firebase Auth UID와 일치시킴
  name TEXT NOT NULL,
  admin_email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. 기존 테이블에 academy_id 컬럼 추가 (비어있는 상태에서 진행 권장)
-- 주의: 이미 데이터가 있다면 DEFAULT 값을 주거나 제약 조건을 나중에 걸어야 합니다.

-- 학생 테이블 수정
ALTER TABLE students ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES academies(id) ON DELETE CASCADE;

-- 출석 기록 테이블 수정
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES academies(id) ON DELETE CASCADE;

-- 알림 기록 테이블 수정
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES academies(id) ON DELETE CASCADE;

-- 3. RLS(Row Level Security) 정책 업데이트 (도장별 데이터 격리)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (필요한 경우)
-- DROP POLICY IF EXISTS "Allow anonymous read access" ON students;
-- ...

-- 도장별 데이터 접근 정책 (단순화된 예시, 실제로는 auth.uid()와 비교)
-- 여기서는 일단 모든 anon 접근을 유지하되, 필터링은 앱에서 담당하게 하거나 
-- RLS를 통해 강제할 수 있습니다. 
-- 권장: 각 도장은 본인의 데이터만 SELECT/INSERT 할 수 있어야 함.

-- 예시: 본인의 academy_id 데이터만 조회 가능
-- CREATE POLICY "Academy specific access" ON students
--   FOR ALL USING (academy_id = auth.uid()); 

-- 4. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_students_academy_id ON students(academy_id);
CREATE INDEX IF NOT EXISTS idx_attendance_academy_id ON attendance(academy_id);
CREATE INDEX IF NOT EXISTS idx_notifications_academy_id ON notifications(academy_id);
