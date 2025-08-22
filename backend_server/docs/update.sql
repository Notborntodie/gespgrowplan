-- =============================================
-- GESP 练习系统数据库更新脚本
-- 添加 question_code 字段到题目表
-- =============================================

USE gesp_practice_system;

-- =============================================
-- 1. 添加 question_code 字段到题目表
-- =============================================
ALTER TABLE questions ADD COLUMN question_code TEXT NULL COMMENT '题目代码内容，用于代码类题目';

-- =============================================
-- 2. 更新现有视图以包含新字段
-- =============================================

-- 删除现有视图
DROP VIEW IF EXISTS question_details;
DROP VIEW IF EXISTS question_details_with_knowledge;

-- 重新创建题目详情视图
CREATE VIEW question_details AS
SELECT 
    q.id,
    q.exam_id,
    q.question_number,
    q.question_text,
    q.question_type,
    q.question_code,
    q.correct_answer,
    q.explanation,
    e.name as exam_name,
    e.level as exam_level
FROM questions q
JOIN exams e ON q.exam_id = e.id;

-- 重新创建包含知识点的题目详情视图
CREATE VIEW question_details_with_knowledge AS
SELECT 
    q.id,
    q.exam_id,
    q.question_number,
    q.question_text,
    q.question_type,
    q.question_code,
    q.correct_answer,
    q.explanation,
    q.level,
    q.difficulty,
    q.image_url,
    e.name as exam_name,
    e.level as exam_level,
    GROUP_CONCAT(DISTINCT kp.name ORDER BY kp.name SEPARATOR ', ') as knowledge_points,
    GROUP_CONCAT(DISTINCT kp.category ORDER BY kp.category SEPARATOR ', ') as knowledge_categories
FROM questions q
JOIN exams e ON q.exam_id = e.id
LEFT JOIN question_knowledge_points qkp ON q.id = qkp.question_id
LEFT JOIN knowledge_points kp ON qkp.knowledge_point_id = kp.id
GROUP BY q.id;

-- =============================================
-- 3. 验证更新
-- =============================================

-- 检查字段是否添加成功
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'gesp_practice_system' 
AND TABLE_NAME = 'questions' 
AND COLUMN_NAME = 'question_code';

-- 检查视图是否更新成功
SELECT COUNT(*) as question_details_count FROM question_details;
SELECT COUNT(*) as question_details_with_knowledge_count FROM question_details_with_knowledge;

-- =============================================
-- 4. 完成提示
-- =============================================
SELECT 'GESP练习系统数据库更新完成！question_code字段已成功添加。' as message; 