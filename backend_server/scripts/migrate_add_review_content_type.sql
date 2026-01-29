-- 迁移脚本：为 learning_tasks 表添加 review_content_type 字段，支持 PDF 复习内容

-- 添加 review_content_type 字段（text: 纯文本, pdf: PDF文件路径）
ALTER TABLE learning_tasks 
ADD COLUMN review_content_type ENUM('text', 'pdf') DEFAULT 'text' AFTER review_content;

-- 更新现有记录，所有非空的 review_content 都是 text 类型
UPDATE learning_tasks 
SET review_content_type = 'text' 
WHERE review_content IS NOT NULL AND review_content != '';

