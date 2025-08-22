-- =============================================
-- GESP 练习系统数据库初始化脚本
-- 适用于云服务器部署
-- 创建时间: 2025-01-16
-- =============================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `gesp_practice_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gesp_practice_system`;

-- =============================================
-- 1. 用户表
-- =============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. 考试表
-- =============================================
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `level` int NOT NULL,
  `description` text,
  `total_questions` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. 题目表
-- =============================================
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_text` text NOT NULL,
  `question_type` enum('text','code') DEFAULT 'text',
  `question_code` text,
  `correct_answer` varchar(10) NOT NULL,
  `explanation` text,
  `level` int NOT NULL DEFAULT '1',
  `difficulty` enum('easy','medium','hard') DEFAULT 'medium',
  `image_url` varchar(500) DEFAULT NULL,
  `question_date` varchar(7) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_questions_level` (`level`),
  KEY `idx_questions_date` (`question_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. 考试-题目关联表
-- =============================================
DROP TABLE IF EXISTS `exam_questions`;
CREATE TABLE `exam_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL,
  `question_id` int NOT NULL,
  `question_number` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_exam_question` (`exam_id`,`question_id`),
  UNIQUE KEY `unique_exam_question_number` (`exam_id`,`question_number`),
  KEY `question_id` (`question_id`),
  KEY `idx_exam_questions_exam` (`exam_id`),
  CONSTRAINT `exam_questions_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_questions_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. 选项表
-- =============================================
DROP TABLE IF EXISTS `options`;
CREATE TABLE `options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `option_label` varchar(10) NOT NULL,
  `option_value` varchar(10) NOT NULL,
  `option_text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_option` (`question_id`,`option_label`),
  KEY `idx_options_question` (`question_id`),
  CONSTRAINT `options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. 知识点表
-- =============================================
DROP TABLE IF EXISTS `knowledge_points`;
CREATE TABLE `knowledge_points` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `category` varchar(50) NOT NULL,
  `level` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_knowledge_point` (`name`,`level`),
  KEY `idx_knowledge_points_category` (`category`),
  KEY `idx_knowledge_points_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. 题目-知识点关联表
-- =============================================
DROP TABLE IF EXISTS `question_knowledge_points`;
CREATE TABLE `question_knowledge_points` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `knowledge_point_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_question_knowledge` (`question_id`,`knowledge_point_id`),
  KEY `idx_question_knowledge_points_question` (`question_id`),
  KEY `idx_question_knowledge_points_knowledge` (`knowledge_point_id`),
  CONSTRAINT `question_knowledge_points_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `question_knowledge_points_ibfk_2` FOREIGN KEY (`knowledge_point_id`) REFERENCES `knowledge_points` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 8. 题目图片表
-- =============================================
DROP TABLE IF EXISTS `question_images`;
CREATE TABLE `question_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `image_type` enum('question','explanation','hint') DEFAULT 'question',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_question_images_question` (`question_id`),
  CONSTRAINT `question_images_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 9. 题目上传记录表
-- =============================================
DROP TABLE IF EXISTS `question_uploads`;
CREATE TABLE `question_uploads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_id` int NOT NULL,
  `upload_type` enum('manual','batch','import') DEFAULT 'manual',
  `upload_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `review_notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_question_uploads_status` (`upload_status`),
  CONSTRAINT `question_uploads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `question_uploads_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 10. 答题记录表
-- =============================================
DROP TABLE IF EXISTS `submissions`;
CREATE TABLE `submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exam_id` int NOT NULL,
  `attempt_number` int NOT NULL,
  `score` int NOT NULL,
  `submit_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attempt` (`user_id`,`exam_id`,`attempt_number`),
  KEY `idx_submissions_user_exam` (`user_id`,`exam_id`),
  KEY `idx_submissions_exam_score` (`exam_id`,`score`),
  CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 11. 答题详情表
-- =============================================
DROP TABLE IF EXISTS `submission_answers`;
CREATE TABLE `submission_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `submission_id` int NOT NULL,
  `question_id` int NOT NULL,
  `user_answer` varchar(10) NOT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `idx_submission_answers_submission` (`submission_id`),
  CONSTRAINT `submission_answers_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `submission_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 插入示例数据
-- =============================================

-- 插入用户
INSERT INTO `users` (`id`, `username`, `password`, `phone`, `created_at`) VALUES
(1, 'czy', '$2b$10$example_hash_1', NULL, '2025-07-26 12:45:41'),
(2, 'lele', '$2b$10$example_hash_2', NULL, '2025-07-26 14:14:54');

-- 插入考试
INSERT INTO `exams` (`id`, `name`, `level`, `description`, `total_questions`, `created_at`) VALUES
(7, 'GESP 1级 6月真题', 1, 'GESP 1级 6月真题', 25, '2025-08-16 17:56:26');

-- 插入知识点
INSERT INTO `knowledge_points` (`id`, `name`, `description`, `category`, `level`, `created_at`) VALUES
(1, '链表基础', '链表的基本概念和操作', 'data_structure', 5, '2025-01-16 10:00:00'),
(2, '', '数据结构基础', 'data_structure', 5, '2025-01-16 10:00:00'),
(3, 'DFS', '深度优先搜索算法', 'algorithm', 6, '2025-01-16 10:00:00'),
(4, '波兰表达式', '前缀表达式和后缀表达式', 'data_structure', 5, '2025-01-16 10:00:00'),
(5, '', '基础数据结构', 'data_structure', 1, '2025-01-16 10:00:00');

-- 插入题目（部分示例）
INSERT INTO `questions` (`id`, `question_text`, `question_type`, `question_code`, `correct_answer`, `explanation`, `level`, `difficulty`, `image_url`, `question_date`, `created_at`) VALUES
(320, '2025年4⽉19⽇在北京举⾏了⼀场颇为瞩⽬的⼈形机器⼈半程马拉松赛。⽐赛期间，跑动着的机器⼈会利⽤⾝上安装的多个传感器所反馈的数据来调整姿态、保持平衡等，那么这类传感器类似于计算机的(   )。', 'text', NULL, 'A', '传感器类似于计算机的输入设备。', 1, 'easy', NULL, '2025-06', '2025-01-16 10:00:00'),
(321, '在某集成开发环境中调试下⾯代码段时尝试设置断点和检查局部变量，下⾯哪个说法是错误的（  ）。', 'code', 'int x = 10;\nint y = 20;\nint z = x + y;', 'B', '调试器可以检查局部变量的值。', 1, 'medium', NULL, '2025-06', '2025-01-16 10:00:00'),
(322, '对下列C++的代码，描述准确的是( )。', 'code', 'for(int i = 0; i < 10; i++) {\n    cout << i << endl;\n}', 'A', '这是一个循环，输出0到9。', 1, 'medium', NULL, '2025-06', '2025-01-16 10:00:00');

-- 插入选项（部分示例）
INSERT INTO `options` (`id`, `question_id`, `option_label`, `option_value`, `option_text`, `created_at`) VALUES
(1, 320, 'A', 'A', '输入设备', '2025-01-16 10:00:00'),
(2, 320, 'B', 'B', '输出设备', '2025-01-16 10:00:00'),
(3, 320, 'C', 'C', '存储设备', '2025-01-16 10:00:00'),
(4, 320, 'D', 'D', '处理设备', '2025-01-16 10:00:00'),
(5, 321, 'A', 'A', '可以设置断点', '2025-01-16 10:00:00'),
(6, 321, 'B', 'B', '不能检查变量值', '2025-01-16 10:00:00'),
(7, 321, 'C', 'C', '可以单步执行', '2025-01-16 10:00:00'),
(8, 321, 'D', 'D', '可以查看调用栈', '2025-01-16 10:00:00');

-- 插入考试-题目关联
INSERT INTO `exam_questions` (`id`, `exam_id`, `question_id`, `question_number`, `created_at`) VALUES
(1, 7, 320, 1, '2025-01-16 10:00:00'),
(2, 7, 321, 2, '2025-01-16 10:00:00'),
(3, 7, 322, 3, '2025-01-16 10:00:00');

-- 插入答题记录（部分示例）
INSERT INTO `submissions` (`id`, `user_id`, `exam_id`, `attempt_number`, `score`, `submit_time`) VALUES
(3, 1, 7, 1, 12, '2025-08-20 07:32:15'),
(4, 1, 7, 2, 0, '2025-08-20 07:32:53'),
(5, 1, 7, 3, 40, '2025-08-20 07:44:02');

-- 插入答题详情（部分示例）
INSERT INTO `submission_answers` (`id`, `submission_id`, `question_id`, `user_answer`, `is_correct`, `created_at`) VALUES
(1, 3, 320, 'A', 1, '2025-08-20 07:32:15'),
(2, 3, 321, 'B', 0, '2025-08-20 07:32:15'),
(3, 3, 322, 'A', 1, '2025-08-20 07:32:15');

-- =============================================
-- 创建视图
-- =============================================

-- 答题统计视图
CREATE OR REPLACE VIEW `submission_stats` AS
SELECT 
    s.id,
    s.user_id,
    s.exam_id,
    s.attempt_number,
    s.score,
    s.submit_time,
    e.name as exam_name,
    e.total_questions,
    ROUND((s.score / e.total_questions) * 100, 2) as percentage
FROM submissions s
JOIN exams e ON s.exam_id = e.id;

-- 题目难度统计视图
CREATE OR REPLACE VIEW `question_difficulty_stats` AS
SELECT 
    q.id,
    q.question_text,
    q.level,
    q.difficulty,
    COUNT(sa.id) as total_attempts,
    SUM(sa.is_correct) as correct_attempts,
    COUNT(sa.id) - SUM(sa.is_correct) as wrong_attempts,
    ROUND((SUM(sa.is_correct) / COUNT(sa.id)) * 100, 2) as correct_rate
FROM questions q
LEFT JOIN submission_answers sa ON q.id = sa.question_id
GROUP BY q.id;

-- 考试统计视图
CREATE OR REPLACE VIEW `exam_stats` AS
SELECT 
    e.id as exam_id,
    e.name as exam_name,
    e.level as exam_level,
    COUNT(DISTINCT s.user_id) as total_participants,
    COUNT(s.id) as total_submissions,
    ROUND(AVG(s.score), 2) as average_score,
    MAX(s.score) as best_score,
    MIN(s.score) as worst_score,
    SUM(CASE WHEN s.score >= 80 THEN 1 ELSE 0 END) as excellent_count,
    SUM(CASE WHEN s.score >= 60 AND s.score < 80 THEN 1 ELSE 0 END) as good_count,
    SUM(CASE WHEN s.score >= 40 AND s.score < 60 THEN 1 ELSE 0 END) as pass_count,
    SUM(CASE WHEN s.score < 40 THEN 1 ELSE 0 END) as fail_count
FROM exams e
LEFT JOIN submissions s ON e.id = s.exam_id
GROUP BY e.id;

-- 用户答题统计视图
CREATE OR REPLACE VIEW `user_answer_stats` AS
SELECT 
    u.id as user_id,
    u.username,
    q.level,
    q.difficulty,
    COUNT(sa.id) as total_attempts,
    SUM(sa.is_correct) as correct_attempts,
    COUNT(sa.id) - SUM(sa.is_correct) as wrong_attempts,
    ROUND((SUM(sa.is_correct) / COUNT(sa.id)) * 100, 2) as correct_rate
FROM users u
JOIN submissions s ON u.id = s.user_id
JOIN submission_answers sa ON s.id = sa.submission_id
JOIN questions q ON sa.question_id = q.id
GROUP BY u.id, q.level, q.difficulty;

-- 用户错题视图
CREATE OR REPLACE VIEW `user_wrong_questions` AS
SELECT 
    q.id as question_id,
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
    u.id as user_id,
    e.id as exam_id,
    e.name as exam_name,
    e.level as exam_level,
    u.username,
    s.attempt_number,
    s.score as exam_score
FROM questions q
JOIN submission_answers sa ON q.id = sa.question_id
JOIN submissions s ON sa.submission_id = s.id
JOIN users u ON s.user_id = u.id
JOIN exams e ON s.exam_id = e.id
WHERE sa.is_correct = 0;

-- 知识点统计视图
CREATE OR REPLACE VIEW `knowledge_point_stats` AS
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

-- 知识点错误统计视图
CREATE OR REPLACE VIEW `knowledge_point_wrong_stats` AS
SELECT 
    kp.id as knowledge_point_id,
    kp.name as knowledge_point_name,
    kp.category,
    kp.level,
    COUNT(DISTINCT qkp.question_id) as total_questions,
    COUNT(sa.id) as total_attempts,
    SUM(sa.is_correct) as correct_attempts,
    COUNT(sa.id) - SUM(sa.is_correct) as wrong_attempts,
    ROUND((SUM(sa.is_correct) / COUNT(sa.id)) * 100, 2) as correct_rate
FROM knowledge_points kp
LEFT JOIN question_knowledge_points qkp ON kp.id = qkp.knowledge_point_id
LEFT JOIN submission_answers sa ON qkp.question_id = sa.question_id
GROUP BY kp.id;

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 完成提示
SELECT 'GESP练习系统数据库初始化完成！' as message;
