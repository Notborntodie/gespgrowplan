-- ================================================================
-- 提取每个级别答错频率最高的50道题目
-- ================================================================
-- 说明：
-- 1. 统计每个级别（level 1-6）中答错次数最多的50道题目
-- 2. 答错次数 = is_correct = 0 的记录数
-- 3. 按级别分组，每个级别取前50道题目
-- ================================================================

-- 方法一：使用窗口函数（推荐，MySQL 8.0+）
-- 如果您的MySQL版本是8.0及以上，可以使用此方法
SELECT 
    level,
    question_id,
    question_text,
    question_type,
    difficulty,
    wrong_count,
    total_attempts,
    correct_count,
    ROUND(wrong_count * 100.0 / total_attempts, 2) AS wrong_rate,
    ROUND(correct_count * 100.0 / total_attempts, 2) AS correct_rate,
    rank_in_level
FROM (
    SELECT 
        q.level,
        q.id AS question_id,
        q.question_text,
        q.question_type,
        q.difficulty,
        COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) AS wrong_count,
        COUNT(*) AS total_attempts,
        COUNT(CASE WHEN sa.is_correct = 1 THEN 1 END) AS correct_count,
        ROW_NUMBER() OVER (PARTITION BY q.level ORDER BY COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) DESC) AS rank_in_level
    FROM questions q
    INNER JOIN submission_answers sa ON q.id = sa.question_id
    GROUP BY q.level, q.id, q.question_text, q.question_type, q.difficulty
    HAVING wrong_count > 0  -- 只显示有答错记录的题目
) AS ranked_questions
WHERE rank_in_level <= 50
ORDER BY level ASC, wrong_count DESC, total_attempts DESC;

-- ================================================================
-- 方法二：使用变量（兼容MySQL 5.7及以下版本）
-- ================================================================
SET @prev_level = 0;
SET @rank = 0;

SELECT 
    level,
    question_id,
    question_text,
    question_type,
    difficulty,
    wrong_count,
    total_attempts,
    correct_count,
    ROUND(wrong_count * 100.0 / total_attempts, 2) AS wrong_rate,
    ROUND(correct_count * 100.0 / total_attempts, 2) AS correct_rate,
    rank_in_level
FROM (
    SELECT 
        level,
        question_id,
        question_text,
        question_type,
        difficulty,
        wrong_count,
        total_attempts,
        correct_count,
        @rank := IF(@prev_level = level, @rank + 1, 1) AS rank_in_level,
        @prev_level := level
    FROM (
        SELECT 
            q.level,
            q.id AS question_id,
            q.question_text,
            q.question_type,
            q.difficulty,
            COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) AS wrong_count,
            COUNT(*) AS total_attempts,
            COUNT(CASE WHEN sa.is_correct = 1 THEN 1 END) AS correct_count
        FROM questions q
        INNER JOIN submission_answers sa ON q.id = sa.question_id
        GROUP BY q.level, q.id, q.question_text, q.question_type, q.difficulty
        HAVING wrong_count > 0  -- 只显示有答错记录的题目
        ORDER BY q.level ASC, wrong_count DESC, total_attempts DESC
    ) AS stats
) AS ranked_questions
WHERE rank_in_level <= 50
ORDER BY level ASC, wrong_count DESC, total_attempts DESC;

-- ================================================================
-- 方法三：导出为CSV格式（便于分析）
-- ================================================================
-- 使用方法：在MySQL命令行中执行，并将结果导出
-- mysql -u username -p database_name < 此脚本.sql > 结果.csv

-- ================================================================
-- 方法四：按级别分别查询（如果只需要查看某个级别）
-- ================================================================
-- 查询级别1的答错频率最高的50道题目
SELECT 
    q.level,
    q.id AS question_id,
    q.question_text,
    q.question_type,
    q.difficulty,
    COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) AS wrong_count,
    COUNT(*) AS total_attempts,
    COUNT(CASE WHEN sa.is_correct = 1 THEN 1 END) AS correct_count,
    ROUND(COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) * 100.0 / COUNT(*), 2) AS wrong_rate,
    ROUND(COUNT(CASE WHEN sa.is_correct = 1 THEN 1 END) * 100.0 / COUNT(*), 2) AS correct_rate
FROM questions q
INNER JOIN submission_answers sa ON q.id = sa.question_id
WHERE q.level = 1  -- 修改这里的级别数字（1-6）
GROUP BY q.level, q.id, q.question_text, q.question_type, q.difficulty
HAVING wrong_count > 0
ORDER BY wrong_count DESC, total_attempts DESC
LIMIT 50;

-- ================================================================
-- 统计信息：查看每个级别的题目数量分布
-- ================================================================
SELECT 
    level,
    COUNT(DISTINCT question_id) AS total_questions_with_answers,
    SUM(wrong_count) AS total_wrong_answers,
    SUM(total_attempts) AS total_attempts,
    ROUND(SUM(wrong_count) * 100.0 / SUM(total_attempts), 2) AS overall_wrong_rate
FROM (
    SELECT 
        q.level,
        q.id AS question_id,
        COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) AS wrong_count,
        COUNT(*) AS total_attempts
    FROM questions q
    INNER JOIN submission_answers sa ON q.id = sa.question_id
    GROUP BY q.level, q.id
) AS level_stats
GROUP BY level
ORDER BY level ASC;

-- ================================================================
-- 查询高频错题的最容易错的选项（按级别查询）
-- ================================================================
-- 说明：对于每个级别答错频率最高的题目，统计每个选项被选错的次数
-- 找出最容易错的选项（被选错次数最多的选项）

-- 步骤1：先获取某个级别答错频率最高的50道题目ID
-- 例如：级别1
SET @target_level = 1;

-- 获取该级别的高频错题ID列表
CREATE TEMPORARY TABLE IF NOT EXISTS temp_top_wrong_questions AS
SELECT q.id AS question_id
FROM questions q
INNER JOIN submission_answers sa ON q.id = sa.question_id
WHERE q.level = @target_level
GROUP BY q.id
HAVING COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) > 0
ORDER BY COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) DESC
LIMIT 50;

-- 步骤2：统计这些题目中每个选项被选错的次数
SELECT 
    sa.question_id,
    q.question_text,
    q.correct_answer,
    sa.user_answer AS wrong_option_value,
    o.option_label,
    o.option_text,
    COUNT(*) AS wrong_count,
    ROUND(COUNT(*) * 100.0 / (
        SELECT COUNT(*) 
        FROM submission_answers sa2 
        WHERE sa2.question_id = sa.question_id AND sa2.is_correct = 0
    ), 2) AS wrong_percentage
FROM submission_answers sa
INNER JOIN temp_top_wrong_questions t ON sa.question_id = t.question_id
INNER JOIN questions q ON sa.question_id = q.id
LEFT JOIN options o ON sa.question_id = o.question_id AND sa.user_answer = o.option_value
WHERE sa.is_correct = 0
GROUP BY sa.question_id, sa.user_answer, o.option_label, o.option_text, q.question_text, q.correct_answer
ORDER BY sa.question_id, wrong_count DESC;

-- 步骤3：找出每道题最容易错的选项（被选错次数最多的选项）
SELECT 
    question_id,
    question_text,
    correct_answer,
    most_wrong_option_value,
    most_wrong_option_label,
    most_wrong_option_text,
    most_wrong_count,
    total_wrong_count,
    ROUND(most_wrong_count * 100.0 / total_wrong_count, 2) AS most_wrong_percentage
FROM (
    SELECT 
        sa.question_id,
        q.question_text,
        q.correct_answer,
        sa.user_answer AS most_wrong_option_value,
        o.option_label AS most_wrong_option_label,
        o.option_text AS most_wrong_option_text,
        COUNT(*) AS most_wrong_count,
        (SELECT COUNT(*) FROM submission_answers sa2 WHERE sa2.question_id = sa.question_id AND sa2.is_correct = 0) AS total_wrong_count,
        ROW_NUMBER() OVER (PARTITION BY sa.question_id ORDER BY COUNT(*) DESC) AS rn
    FROM submission_answers sa
    INNER JOIN temp_top_wrong_questions t ON sa.question_id = t.question_id
    INNER JOIN questions q ON sa.question_id = q.id
    LEFT JOIN options o ON sa.question_id = o.question_id AND sa.user_answer = o.option_value
    WHERE sa.is_correct = 0
    GROUP BY sa.question_id, sa.user_answer, o.option_label, o.option_text, q.question_text, q.correct_answer
) AS option_stats
WHERE rn = 1
ORDER BY question_id;

-- 清理临时表
DROP TEMPORARY TABLE IF EXISTS temp_top_wrong_questions;

-- ================================================================
-- 方法五：一次性查询某个级别的高频错题及其最容易错的选项（推荐）
-- ================================================================
-- 查询级别1的高频错题及最容易错的选项
SET @target_level = 1;  -- 修改这里的级别数字（1-6）

SELECT 
    q.level,
    q.id AS question_id,
    q.question_text,
    q.question_type,
    q.difficulty,
    q.correct_answer,
    COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) AS wrong_count,
    COUNT(*) AS total_attempts,
    ROUND(COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END) * 100.0 / COUNT(*), 2) AS wrong_rate,
    -- 最容易错的选项信息
    most_wrong.option_value AS most_wrong_option_value,
    most_wrong.option_label AS most_wrong_option_label,
    most_wrong.option_text AS most_wrong_option_text,
    most_wrong.wrong_count AS most_wrong_option_count,
    ROUND(most_wrong.wrong_count * 100.0 / COUNT(CASE WHEN sa.is_correct = 0 THEN 1 END), 2) AS most_wrong_option_percentage
FROM questions q
INNER JOIN submission_answers sa ON q.id = sa.question_id
LEFT JOIN (
    -- 子查询：找出每道题最容易错的选项
    SELECT 
        sa2.question_id,
        sa2.user_answer AS option_value,
        o2.option_label,
        o2.option_text,
        COUNT(*) AS wrong_count,
        ROW_NUMBER() OVER (PARTITION BY sa2.question_id ORDER BY COUNT(*) DESC) AS rn
    FROM submission_answers sa2
    LEFT JOIN options o2 ON sa2.question_id = o2.question_id AND sa2.user_answer = o2.option_value
    WHERE sa2.is_correct = 0
    GROUP BY sa2.question_id, sa2.user_answer, o2.option_label, o2.option_text
) AS most_wrong ON q.id = most_wrong.question_id AND most_wrong.rn = 1
WHERE q.level = @target_level
GROUP BY q.level, q.id, q.question_text, q.question_type, q.difficulty, q.correct_answer,
         most_wrong.option_value, most_wrong.option_label, most_wrong.option_text, most_wrong.wrong_count
HAVING wrong_count > 0
ORDER BY wrong_count DESC, total_attempts DESC
LIMIT 50;

