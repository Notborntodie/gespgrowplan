-- 为教师学生关联表添加班级编号字段
-- 用于标识学生属于哪个班级，方便教师管理不同班级的学生

ALTER TABLE `teacher_students`
ADD COLUMN `class_no` VARCHAR(50) NULL DEFAULT NULL COMMENT '班级编号，如1班、2班、A班等' AFTER `student_id`;
