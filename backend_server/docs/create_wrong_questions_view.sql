-- =============================================
-- 创建错题统计视图
-- =============================================

USE gesp_practice_system;

-- 1. 创建用户错题统计视图
CREATE OR REPLACE VIEW user_wrong_questions AS
SELECT 
    sa.question_id,
    q.question_text,
    q.question_type,
    q.question_code,
    q.correct_answer,
    q.explanation,
    q.level,
    q.difficulty,
    q.image_url,
    sa.user_answer,
    sa.is_correct,
    sa.created_at as answered_at,
    s.user_id,
    s.exam_id,
    e.name as exam_name,
    e.level as exam_level,
    u.username,
    s.attempt_number,
    s.score as exam_score
FROM submission_answers sa
JOIN questions q ON sa.question_id = q.id
JOIN submissions s ON sa.submission_id = s.id
JOIN exams e ON s.exam_id = e.id
JOIN users u ON s.user_id = u.id
WHERE sa.is_correct = 0
ORDER BY sa.created_at DESC;

-- 2. 创建用户答题统计视图
CREATE OR REPLACE VIEW user_answer_stats AS
SELECT 
    s.user_id,
    u.username,
    q.level,
    q.difficulty,
    COUNT(*) as total_attempts,
    SUM(sa.is_correct) as correct_attempts,
    COUNT(*) - SUM(sa.is_correct) as wrong_attempts,
    ROUND(SUM(sa.is_correct) * 100.0 / COUNT(*), 2) as correct_rate
FROM submission_answers sa
JOIN submissions s ON sa.submission_id = s.id
JOIN questions q ON sa.question_id = q.id
JOIN users u ON s.user_id = u.id
GROUP BY s.user_id, u.username, q.level, q.difficulty
ORDER BY s.user_id, q.level, q.difficulty;

-- 3. 创建题目难度统计视图
CREATE OR REPLACE VIEW question_difficulty_stats AS
SELECT 
    q.id,
    q.question_text,
    q.level,
    q.difficulty,
    COUNT(sa.id) as total_attempts,
    SUM(sa.is_correct) as correct_attempts,
    COUNT(sa.id) - SUM(sa.is_correct) as wrong_attempts,
    ROUND(SUM(sa.is_correct) * 100.0 / COUNT(sa.id), 2) as correct_rate
FROM questions q
LEFT JOIN submission_answers sa ON q.id = sa.question_id
GROUP BY q.id, q.question_text, q.level, q.difficulty
ORDER BY q.level, q.difficulty, correct_rate ASC;

-- 4. 创建考试统计视图
CREATE OR REPLACE VIEW exam_stats AS
SELECT 
    e.id as exam_id,
    e.name as exam_name,
    e.level as exam_level,
    COUNT(DISTINCT s.user_id) as total_participants,
    COUNT(s.id) as total_submissions,
    AVG(s.score) as average_score,
    MAX(s.score) as best_score,
    MIN(s.score) as worst_score,
    COUNT(CASE WHEN s.score >= 90 THEN 1 END) as excellent_count,
    COUNT(CASE WHEN s.score >= 80 AND s.score < 90 THEN 1 END) as good_count,
    COUNT(CASE WHEN s.score >= 60 AND s.score < 80 THEN 1 END) as pass_count,
    COUNT(CASE WHEN s.score < 60 THEN 1 END) as fail_count
FROM exams e
LEFT JOIN submissions s ON e.id = s.exam_id
GROUP BY e.id, e.name, e.level
ORDER BY e.level, e.id;

-- 5. 创建知识点错题统计视图
CREATE OR REPLACE VIEW knowledge_point_wrong_stats AS
SELECT 
    kp.id as knowledge_point_id,
    kp.name as knowledge_point_name,
    kp.category,
    kp.level,
    COUNT(DISTINCT q.id) as total_questions,
    COUNT(sa.id) as total_attempts,
    SUM(sa.is_correct) as correct_attempts,
    COUNT(sa.id) - SUM(sa.is_correct) as wrong_attempts,
    ROUND(SUM(sa.is_correct) * 100.0 / COUNT(sa.id), 2) as correct_rate
FROM knowledge_points kp
LEFT JOIN question_knowledge_points qkp ON kp.id = qkp.knowledge_point_id
LEFT JOIN questions q ON qkp.question_id = q.id
LEFT JOIN submission_answers sa ON q.id = sa.question_id
GROUP BY kp.id, kp.name, kp.category, kp.level
ORDER BY kp.category, kp.level, correct_rate ASC;

-- 完成提示
SELECT '错题统计视图创建完成！' as message;
