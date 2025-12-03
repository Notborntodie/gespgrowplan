-- 为 oj_problems 表添加解析视频URL字段
ALTER TABLE oj_problems 
ADD COLUMN video_url VARCHAR(500) DEFAULT NULL COMMENT '解析视频URL' 
AFTER data_range;
