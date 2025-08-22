-- =============================================
-- GESP 练习系统数据库更新脚本
-- 只包含新增表结构和修改，不包含数据插入
-- =============================================

USE gesp_practice_system;

-- =============================================
-- 修改题目表 - 添加Level字段和图片支持
-- =============================================
ALTER TABLE questions ADD COLUMN level INT NOT NULL DEFAULT 1 COMMENT '题目等级：1-5为GESP等级，6为CSP-J';
ALTER TABLE questions ADD COLUMN image_url VARCHAR(500) NULL COMMENT '题目图片URL';
ALTER TABLE questions ADD COLUMN difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '题目难度';

-- =============================================
-- 新增知识点表
-- =============================================
CREATE TABLE knowledge_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '知识点名称',
    description TEXT COMMENT '知识点描述',
    category VARCHAR(50) NOT NULL COMMENT '知识点分类：algorithm, data_structure, programming, math等',
    level INT NOT NULL DEFAULT 1 COMMENT '适用等级：1-5为GESP等级，6为CSP-J',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_knowledge_point (name, level)
);

-- =============================================
-- 新增题目-知识点关联表（多对多关系）
-- =============================================
CREATE TABLE question_knowledge_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    knowledge_point_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE,
    UNIQUE KEY unique_question_knowledge (question_id, knowledge_point_id)
);

-- =============================================
-- 新增题目上传记录表
-- =============================================
CREATE TABLE question_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '上传用户ID',
    question_id INT NOT NULL COMMENT '题目ID',
    upload_type ENUM('manual', 'batch', 'import') DEFAULT 'manual' COMMENT '上传方式',
    upload_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
    review_notes TEXT COMMENT '审核备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- =============================================
-- 新增题目图片表（支持多图片）
-- =============================================
CREATE TABLE question_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL COMMENT '图片URL',
    image_type ENUM('question', 'explanation', 'hint') DEFAULT 'question' COMMENT '图片类型',
    display_order INT DEFAULT 0 COMMENT '显示顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- =============================================
-- 为常用查询添加索引
-- =============================================
CREATE INDEX idx_questions_level ON questions(level);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_knowledge_points_category ON knowledge_points(category);
CREATE INDEX idx_knowledge_points_level ON knowledge_points(level);
CREATE INDEX idx_question_knowledge_points_question ON question_knowledge_points(question_id);
CREATE INDEX idx_question_knowledge_points_knowledge ON question_knowledge_points(knowledge_point_id);
CREATE INDEX idx_question_uploads_status ON question_uploads(upload_status);
CREATE INDEX idx_question_images_question ON question_images(question_id);

-- =============================================
-- 创建题目详情视图（包含知识点）
-- =============================================
CREATE VIEW question_details_with_knowledge AS
SELECT 
    q.id,
    q.exam_id,
    q.question_number,
    q.question_text,
    q.question_type,
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
-- 创建知识点统计视图
-- =============================================
CREATE VIEW knowledge_point_stats AS
SELECT 
    kp.id,
    kp.name,
    kp.category,
    kp.level,
    COUNT(DISTINCT qkp.question_id) as question_count,
    COUNT(DISTINCT sa.submission_id) as usage_count,
    AVG(sa.is_correct) * 100 as correct_rate
FROM knowledge_points kp
LEFT JOIN question_knowledge_points qkp ON kp.id = qkp.knowledge_point_id
LEFT JOIN submission_answers sa ON qkp.question_id = sa.question_id
GROUP BY kp.id;

-- =============================================
-- 完成提示
-- =============================================
SELECT 'GESP练习系统数据库更新完成！' as message; 