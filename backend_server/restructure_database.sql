-- GESP 练习系统数据库重构脚本
-- 将题目和考试的关系改为多对多关系

USE gesp_practice_system;

-- 1. 创建新的题目表（不包含exam_id）
CREATE TABLE questions_new (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_text TEXT NOT NULL,
    question_type ENUM('text', 'code') DEFAULT 'text',
    question_code TEXT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    explanation TEXT,
    level INT NOT NULL DEFAULT 1,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 创建考试-题目关联表（多对多关系）
CREATE TABLE exam_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    question_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions_new(id) ON DELETE CASCADE,
    UNIQUE KEY unique_exam_question (exam_id, question_id),
    UNIQUE KEY unique_exam_question_number (exam_id, question_number)
);

-- 3. 迁移现有数据
INSERT INTO questions_new (
    question_text, question_type, question_code, correct_answer, 
    explanation, level, difficulty, image_url, created_at
)
SELECT 
    question_text, question_type, question_code, correct_answer,
    explanation, level, difficulty, image_url, created_at
FROM questions;

-- 4. 创建题目ID映射
CREATE TEMPORARY TABLE question_id_mapping AS
SELECT 
    old_id.id as old_id,
    new_id.id as new_id
FROM questions old_id
JOIN questions_new new_id ON 
    old_id.question_text = new_id.question_text AND
    old_id.correct_answer = new_id.correct_answer;

-- 5. 迁移考试-题目关联
INSERT INTO exam_questions (exam_id, question_id, question_number)
SELECT 
    q.exam_id,
    qim.new_id,
    q.question_number
FROM questions q
JOIN question_id_mapping qim ON q.id = qim.old_id;

-- 6. 更新相关表的外键引用
ALTER TABLE options ADD COLUMN question_id_new INT NULL;
UPDATE options o 
JOIN question_id_mapping qim ON o.question_id = qim.old_id
SET o.question_id_new = qim.new_id;

-- 7. 删除旧表并重命名
DROP TABLE questions;
RENAME TABLE questions_new TO questions;

-- 8. 更新索引
CREATE INDEX idx_questions_level ON questions(level);
CREATE INDEX idx_exam_questions_exam ON exam_questions(exam_id);

SELECT '数据库重构完成！' as message; 