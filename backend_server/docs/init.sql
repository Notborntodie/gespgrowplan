-- =============================================
-- GESP 练习系统数据库脚本
-- =============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS gesp_practice_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gesp_practice_system;

-- =============================================
-- 1. 用户表
-- =============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 2. 考试表
-- =============================================
CREATE TABLE exams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    description TEXT,
    total_questions INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. 题目表
-- =============================================
CREATE TABLE questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    exam_id INT NOT NULL,
    question_number INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('text', 'code') DEFAULT 'text',
    correct_answer VARCHAR(10) NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_question (exam_id, question_number)
);

-- =============================================
-- 4. 选项表
-- =============================================
CREATE TABLE options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    option_label VARCHAR(10) NOT NULL,
    option_value VARCHAR(10) NOT NULL,
    option_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_option (question_id, option_label)
);

-- =============================================
-- 5. 答题记录表
-- =============================================
CREATE TABLE submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    exam_id INT NOT NULL,
    attempt_number INT NOT NULL,
    score INT NOT NULL,
    submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attempt (user_id, exam_id, attempt_number)
);

-- =============================================
-- 6. 答题详情表
-- =============================================
CREATE TABLE submission_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    submission_id INT NOT NULL,
    question_id INT NOT NULL,
    user_answer VARCHAR(10) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- =============================================
-- 插入示例数据
-- =============================================

-- 插入考试
INSERT INTO exams (name, level, description, total_questions) VALUES 
('GESP五级链表专题', 5, '掌握链表相关知识', 11);

-- 插入题目
INSERT INTO questions (exam_id, question_number, question_text, correct_answer, explanation) VALUES 
(1, 1, '链表的存储空间物理上可以连续，也可以不连续。', 'A', '对。链表的节点在内存中可以连续，也可以不连续。就像用绳子串珠子，每个珠子（节点）可能分散在不同地方，只要用指针串起来，顺序就能保持。数组是连续存储，而链表用指针连接，不要求连续，这也是链表的一大灵活性。'),
(1, 2, '如果将双向链表的最后一个结点的下一项指针指向第一个结点，第一个结点的前一项指针指向最后一个结点，则该双向链表构成循环链表。', 'A', '对。如果双向链表的最后一个结点的 next 指向第一个结点，第一个结点的 prev 指向最后一个结点，这样首尾连在一起，形成一个闭合的环，叫做循环链表。就像小朋友围成一个圈，一个拉着下一个的手，最后一个也拉着第一个的手。'),
(1, 3, '单链表只支持在表头进行插入和删除操作。', 'B', '错。虽然单链表在表头插入删除很快，但只要我们知道前一个节点，也能在中间或尾部插入删除。单链表并不局限于只能操作表头，只是表头操作最简单。'),
(1, 4, '下面关于链表和数组的描述，错误的是（ ）。', 'C', 'C 错误。A 正确，数组大小固定；B 正确，数组可以快速定位第 k 个元素，而链表只能一个一个找；C 错误，链表为了连接节点要额外保存指针，比数组更占空间；D 正确，链表插入删除只改指针更高效。所以 C 错在于说反了，链表其实更占内存。'),
(1, 5, '若循环单链表表头，节点的 next 指针指向下一个节点，最后一个节点的 next 指针指向（ ）。', 'C', 'C 正确。循环单链表的特点是最后一个节点的 next 指向第一个节点。这样可以从任何一个节点出发不断走下去，不会遇到 nullptr。A 指向自己不对；B 指向空表示非循环；D 指向前一个也不是循环单链表的结构。'),
(1, 6, '通过（  ）操作，能完成在双向循环链表结点 p 之后插入结点 s 的功能（其中 next 域为结点的直接后继，prev 域为结点的直接前驱）。', 'D', 'D 正确。要在 p 节点后插入 s，正确顺序是：让 s 指向 p 的后一个（s->next = p->next），让 p->next 的 prev 指回 s（p->next->prev = s），再让 s->prev = p，p->next = s。这四步形成新的双向连接，把 s 嵌入在 p 和原来的 p->next 之间。'),
(1, 7, '双向链表中每个结点有两个指针域 prev 和 next，分别指向该结点的前驱及后继结点。设 p 指向链表中的一个结点，它的前驱结点和后继结点均非空。要删除结点 p，以下语句中错误的是（ ）。', 'A', 'A 错误。删除节点 p 要让前一个节点的 next 指向 p 的 next，同时 p 的 next 的 prev 指向 p 的前一个。A 中 p->next->prev = p->next 是错误的，它让 p 后面的 prev 指向自己，断开了原链。B 是正确的标准写法，能正确连接前后节点并删除 p。'),
(1, 8, '下述查询函数在双向链表中查找歌曲，其时间复杂度为（ ）。', 'B', 'B 正确。函数 search 从链表头一个一个往下找，最坏情况下要查完整个链表，所以时间复杂度是 O(n)。链表不能像数组那样一下子定位到目标，只能顺序查找。O(1) 是常数时间，适合用在能直接找到目标的位置，比如哈希表或数组索引。'),
(1, 9, '将一首新歌插入为双向链表的第一个节点，横线应填入的代码为（ ）。', 'C', 'C 正确。我们在链表头插入一个新节点 p，它的 next 指向旧 head，prev 设为 nullptr。旧 head 的 prev 应该改为 p，也就是 head->prev = p。这步不能省略，否则链表前后方向就断开了。'),
(1, 10, '下列代码使用虚拟头节点删除链表中值为 val 的元素，横线上应填最佳代码是（ ）。', 'A', 'A 正确。为了方便处理删除操作，尤其是可能删除头节点的情况，我们先创建一个虚拟头 dummyHead，它的 next 指向真正的 head。然后从 dummyHead 开始遍历整个链表，遇到值为 val 的就删除。这种方法能统一处理各种情况，写法简单且鲁棒性强。'),
(1, 11, '下面代码实现了一个空的双向循环链表，横线上应填入的最佳代码是（ ）。', 'B', 'B 正确。我们要创建一个空的双向循环链表结构，有头尾哨兵节点。初始状态下：head->next = tail 表示链表开始；tail->prev = head 表示链表结束。后续插入元素时就插在这两者之间。这样设计方便处理边界情况，不用频繁判断头尾。');

-- 插入选项
INSERT INTO options (question_id, option_label, option_value, option_text) VALUES 
-- 第1题选项
(1, 'A', 'A', '对'),
(1, 'B', 'B', '错'),
-- 第2题选项
(2, 'A', 'A', '对'),
(2, 'B', 'B', '错'),
-- 第3题选项
(3, 'A', 'A', '对'),
(3, 'B', 'B', '错'),
-- 第4题选项
(4, 'A', 'A', 'A. 数组大小固定，链表大小可动态调整。'),
(4, 'B', 'B', 'B. 数组支持随机访问，链表只能顺序访问。'),
(4, 'C', 'C', 'C. 存储相同数目的整数，数组比链表所需的内存多。'),
(4, 'D', 'D', 'D. 数组插入和删除元素效率低，链表插入和删除元素效率高。'),
-- 第5题选项
(5, 'A', 'A', 'A. 当前节点'),
(5, 'B', 'B', 'B. nullptr'),
(5, 'C', 'C', 'C. 第一个节点'),
(5, 'D', 'D', 'D. 上一个节点'),
-- 第6题选项
(6, 'A', 'A', 'A. p->next->prev = s; s->prev = p; p->next = s; s->next = p->next;'),
(6, 'B', 'B', 'B. p->next->prev = s; p->next = s; s->prev = p; s->next = p->next;'),
(6, 'C', 'C', 'C. p->next = s; s->next = p->next; p->next->prev = s; s->prev = p;'),
(6, 'D', 'D', 'D. s->next = p->next; p->next->prev = s; s->prev = p; p->next = s;'),
-- 第7题选项
(7, 'A', 'A', 'A'),
(7, 'B', 'B', 'B'),
(7, 'C', 'C', 'C'),
(7, 'D', 'D', 'D'),
-- 第8题选项
(8, 'A', 'A', 'A. O(1)'),
(8, 'B', 'B', 'B. O(n)'),
(8, 'C', 'C', 'C. O(log n)'),
(8, 'D', 'D', 'D. O(n²)'),
-- 第9题选项
(9, 'A', 'A', 'A. head->next->prev = p;'),
(9, 'B', 'B', 'B. head->next = p;'),
(9, 'C', 'C', 'C. head->prev = p;'),
(9, 'D', 'D', 'D. 触发异常，不能对空指针进行操作。'),
-- 第10题选项
(10, 'A', 'A', 'A. dummyHead->next = head; cur = dummyHead;'),
(10, 'B', 'B', 'B. dummyHead->next = head->next; cur = dummyHead;'),
(10, 'C', 'C', 'C. dummyHead->next = head; cur = dummyHead->next;'),
(10, 'D', 'D', 'D. dummyHead->next = head->next; cur = dummyHead->next;'),
-- 第11题选项
(11, 'A', 'A', 'A. list->head->prev = list->head; list->tail->prev = list->head;'),
(11, 'B', 'B', 'B. list->head->next = list->tail; list->tail->prev = list->head;'),
(11, 'C', 'C', 'C. list->head->next = list->tail; list->tail->next = list->head;'),
(11, 'D', 'D', 'D. list->head->next = list->tail; list->tail->next = nullptr;');

-- =============================================
-- 常用查询视图
-- =============================================

-- 创建题目详情视图
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

-- 创建答题统计视图
CREATE VIEW submission_stats AS
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

-- =============================================
-- 常用查询示例
-- =============================================

-- 1. 获取考试的所有题目和选项
-- SELECT q.*, o.option_label, o.option_text 
-- FROM questions q 
-- LEFT JOIN options o ON q.id = o.question_id 
-- WHERE q.exam_id = 1 
-- ORDER BY q.question_number;

-- 2. 获取用户答题历史
-- SELECT s.*, e.name as exam_name 
-- FROM submissions s 
-- JOIN exams e ON s.exam_id = e.id 
-- WHERE s.user_id = ? 
-- ORDER BY s.submit_time DESC;

-- 3. 获取用户某次答题的详细答案
-- SELECT sa.*, q.question_text, q.correct_answer, q.explanation
-- FROM submission_answers sa
-- JOIN questions q ON sa.question_id = q.id
-- WHERE sa.submission_id = ?
-- ORDER BY q.question_number;

-- 4. 获取考试排行榜
-- SELECT u.username, s.score, s.submit_time
-- FROM submissions s
-- JOIN users u ON s.user_id = u.id
-- WHERE s.exam_id = 1
-- ORDER BY s.score DESC, s.submit_time ASC;

-- =============================================
-- 索引优化
-- =============================================

-- 为常用查询字段添加索引
CREATE INDEX idx_submissions_user_exam ON submissions(user_id, exam_id);
CREATE INDEX idx_submissions_exam_score ON submissions(exam_id, score);
CREATE INDEX idx_questions_exam_number ON questions(exam_id, question_number);
CREATE INDEX idx_options_question ON options(question_id);
CREATE INDEX idx_submission_answers_submission ON submission_answers(submission_id);

-- =============================================
-- 修改题目表 - 添加Level字段和图片支持
-- =============================================
ALTER TABLE questions ADD COLUMN level INT NOT NULL DEFAULT 1 COMMENT '题目等级：1-5为GESP等级，6为CSP-J';
ALTER TABLE questions ADD COLUMN image_url VARCHAR(500) NULL COMMENT '题目图片URL';
ALTER TABLE questions ADD COLUMN difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '题目难度';
ALTER TABLE questions ADD COLUMN question_code TEXT NULL COMMENT '题目代码内容，用于代码类题目';

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
SELECT 'GESP练习系统数据库创建完成！' as message;
