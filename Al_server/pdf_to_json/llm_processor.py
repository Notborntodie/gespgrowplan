import json
import os
import requests
from typing import Dict, Any, List
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

class LLMProcessor:
    """
    大模型处理器，支持智能分割和实时进度显示
    """
    
    def __init__(self, api_key: str = None, max_tokens: int = 8000):
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        self.api_url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
        self.max_tokens = max_tokens
        self.max_input_length = 3000
    
    def create_split_prompt(self, pdf_text: str) -> str:
        """创建分割题目的prompt"""
        return f"""请将以下PDF文本中的题目进行智能分割，每个分割片段应该包含1-3个完整的题目。

要求：
1. 每个分割片段应该包含完整的题目（包括题目、选项、答案等）
2. 分割片段长度控制在合理范围内，便于后续处理
3. 返回JSON格式的分割结果

PDF文本：
{pdf_text}

请返回以下JSON格式：
{{
    "segments": [
        {{
            "id": 1,
            "content": "第一个分割片段的内容",
            "estimated_questions": 2
        }}
    ]
}}"""
    
    def create_question_prompt(self, segment_content: str, expected_questions: int = None) -> str:
        """创建提取题目的prompt"""
        calibration_text = ""
        if expected_questions is not None:
            calibration_text = f"\n6. 请仔细检查文本，确保提取所有题目。预期题目数量约为 {expected_questions} 个，如果发现题目数量明显少于预期，请重新仔细检查文本内容。"
        
        return f"""请将以下文本中的题目转换为标准JSON格式。

要求：
1. 分question_type两类题目：code和text
2. 如果题目有代码，则是code类型，反之text
3. 如果是code类型，则有question_code字段，如果是text类型，则question_code是空字符串
4. 每个题目包含：question_text, question_type, question_code, correct_answer, explanation, level, difficulty, options
5. level表示难度等级（1-5），difficulty表示难度描述（easy/medium/hard）{calibration_text}

文本内容：
{segment_content}

请严格按照以下JSON格式输出：
[
  {{
    "question_text": "题目文本",
    "question_type": "code或text",
    "question_code": "代码内容或空字符串",
    "correct_answer": "正确答案标签",
    "explanation": "解释说明",
    "level": 难度等级,
    "difficulty": "难度描述",
    "options": [
      {{"label": "A", "value": "A", "text": "选项内容"}},
      {{"label": "B", "value": "B", "text": "选项内容"}},
      {{"label": "C", "value": "C", "text": "选项内容"}},
      {{"label": "D", "value": "D", "text": "选项内容"}}
    ]
  }}
]"""
    
    def call_api(self, prompt: str) -> str:
        """调用DashScope API"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            data = {
                "model": "qwen-plus",
                "messages": [
                    {"role": "system", "content": "你是一个专业的题目解析助手。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": self.max_tokens
            }
            
            response = requests.post(self.api_url, headers=headers, json=data, timeout=120)
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
        except Exception as e:
            raise Exception(f"调用DashScope API失败: {str(e)}")
    
    def parse_json_response(self, response: str) -> List[Dict[str, Any]]:
        """解析JSON响应"""
        try:
            if response.strip().startswith('[') and response.strip().endswith(']'):
                return json.loads(response)
            elif response.strip().startswith('{') and response.strip().endswith('}'):
                return json.loads(response)
            
            # 提取JSON部分
            start_idx = response.find('[')
            end_idx = response.rfind(']') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = response[start_idx:end_idx]
                return json.loads(json_str)
            else:
                start_idx = response.find('{')
                end_idx = response.rfind('}') + 1
                if start_idx != -1 and end_idx != 0:
                    json_str = response[start_idx:end_idx]
                    return json.loads(json_str)
                else:
                    raise ValueError("无法找到有效的JSON格式")
                
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON解析失败: {str(e)}")
        except Exception as e:
            raise ValueError(f"解析响应失败: {str(e)}")
    
    def split_text_intelligently(self, pdf_text: str) -> List[Dict[str, Any]]:
        """快速启发式分割文本"""
        try:
            if len(pdf_text) <= self.max_input_length:
                return [{"id": 1, "content": pdf_text, "estimated_questions": 1}]
            
            print(f"📝 文本过长，使用快速启发式分割...")
            return self.fast_heuristic_split(pdf_text)
                
        except Exception as e:
            print(f"⚠️ 快速分割失败，使用备用方案: {str(e)}")
            return self.fallback_split(pdf_text)
    
    def fast_heuristic_split(self, text: str) -> List[Dict[str, Any]]:
        """快速启发式分割"""
        import re
        
        # 分割参数
        MIN_SEGMENT_SIZE = 800
        MAX_SEGMENT_SIZE = 3000
        TARGET_SEGMENT_SIZE = 2000
        
        segments = []
        current_segment = ""
        segment_id = 1
        
        # 按段落分割
        paragraphs = text.split('\n\n')
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
                
            # 如果当前段落加上新段落超过目标大小，且当前段落不为空
            if current_segment and len(current_segment + "\n\n" + paragraph) > TARGET_SEGMENT_SIZE:
                # 保存当前片段
                if len(current_segment) >= MIN_SEGMENT_SIZE:
                    segments.append({
                        "id": segment_id,
                        "content": current_segment.strip(),
                        "estimated_questions": self._estimate_questions(current_segment)
                    })
                    segment_id += 1
                    current_segment = paragraph
                else:
                    # 当前片段太小，继续添加
                    current_segment += "\n\n" + paragraph
            else:
                # 添加到当前片段
                if current_segment:
                    current_segment += "\n\n" + paragraph
                else:
                    current_segment = paragraph
        
        # 处理最后一个片段
        if current_segment and len(current_segment) >= MIN_SEGMENT_SIZE:
            segments.append({
                "id": segment_id,
                "content": current_segment.strip(),
                "estimated_questions": self._estimate_questions(current_segment)
            })
        
        # 如果分割后片段太少，尝试更细粒度的分割
        if len(segments) < 2 and len(text) > MAX_SEGMENT_SIZE:
            return self._fine_grained_split(text)
        
        return segments
    
    def _estimate_questions(self, text: str) -> int:
        """估算片段中的题目数量"""
        import re
        
        # 题目编号模式
        patterns = [
            r'\d+\.',  # 1. 2. 3.
            r'第\d+题',  # 第1题 第2题
            r'题目\d+',  # 题目1 题目2
            r'Q\d+',    # Q1 Q2
            r'\(\d+\)',  # (1) (2)
            r'[A-D]\.',  # A. B. C. D.
        ]
        
        question_count = 0
        for pattern in patterns:
            matches = re.findall(pattern, text)
            question_count += len(matches)
        
        # 如果没有找到题目编号，根据文本长度估算
        if question_count == 0:
            question_count = max(1, len(text) // 1000)
        
        return question_count
    
    def _fine_grained_split(self, text: str) -> List[Dict[str, Any]]:
        """细粒度分割，用于处理大片段"""
        import re
        
        segments = []
        segment_id = 1
        
        # 按句子分割
        sentences = re.split(r'[。！？\n]+', text)
        current_segment = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            if len(current_segment + sentence) > 2000:
                if current_segment:
                    segments.append({
                        "id": segment_id,
                        "content": current_segment.strip(),
                        "estimated_questions": self._estimate_questions(current_segment)
                    })
                    segment_id += 1
                    current_segment = sentence
                else:
                    current_segment = sentence
            else:
                current_segment += sentence
        
        # 处理最后一个片段
        if current_segment:
            segments.append({
                "id": segment_id,
                "content": current_segment.strip(),
                "estimated_questions": self._estimate_questions(current_segment)
            })
        
        return segments
    
    def fallback_split(self, text: str) -> List[Dict[str, Any]]:
        """备用分割方案"""
        paragraphs = text.split('\n\n')
        segments = []
        
        for i, para in enumerate(paragraphs):
            if len(para.strip()) > 100:
                segments.append({
                    "id": i + 1,
                    "content": para.strip(),
                    "estimated_questions": 1
                })
        
        return segments
    

    
    def process_segment(self, segment: Dict[str, Any], segment_index: int, expected_questions: int = None) -> Dict[str, Any]:
        """处理单个片段"""
        try:
            print(f"🔄 开始处理第 {segment_index + 1} 个片段...")
            prompt = self.create_question_prompt(segment['content'], expected_questions)
            response = self.call_api(prompt)
            questions = self.parse_json_response(response)
            
            if isinstance(questions, list):
                print(f"✅ 第 {segment_index + 1} 个片段完成，提取到 {len(questions)} 个题目")
                return {
                    "segment_index": segment_index,
                    "segment_id": segment.get("id", segment_index + 1),
                    "questions": questions,
                    "success": True
                }
            else:
                print(f"⚠️ 第 {segment_index + 1} 个片段解析失败")
                return {
                    "segment_index": segment_index,
                    "segment_id": segment.get("id", segment_index + 1),
                    "questions": [],
                    "success": False
                }
                
        except Exception as e:
            print(f"❌ 第 {segment_index + 1} 个片段处理失败: {str(e)}")
            return {
                "segment_index": segment_index,
                "segment_id": segment.get("id", segment_index + 1),
                "questions": [],
                "success": False,
                "error": str(e)
            }

    def process_pdf_text_with_progress(self, pdf_text: str, max_workers: int = 3, progress_id: str = None, expected_questions: int = None) -> List[Dict[str, Any]]:
        """处理PDF文本（带进度版本）"""
        try:
            segments = self.split_text_intelligently(pdf_text)
            self.last_segments = segments  # 保存分割结果
            
            # 发送分割完成消息
            if progress_id:
                from main import progress_storage
                progress_storage[progress_id] = {
                    "type": "split_complete",
                    "message": f"分割完成，共 {len(segments)} 个片段",
                    "segment_count": len(segments),
                    "parallel_workers": max_workers
                }
            
            print(f"📊 分割为 {len(segments)} 个片段，使用 {max_workers} 个并行线程")
            
            # 初始化结果存储，按片段索引排序
            segment_results = [None] * len(segments)
            completed_count = 0
            
            # 使用线程池进行并行处理
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # 提交所有任务
                future_to_segment = {
                    executor.submit(self.process_segment, segment, i, expected_questions): (i, segment)
                    for i, segment in enumerate(segments)
                }
                
                # 收集结果
                for future in as_completed(future_to_segment):
                    segment_index, segment = future_to_segment[future]
                    try:
                        result = future.result()
                        # 按片段索引存储结果，保持顺序
                        segment_results[segment_index] = result
                        completed_count += 1
                        
                        # 发送进度更新
                        if progress_id:
                            from main import progress_storage
                            progress_storage[progress_id] = {
                                "type": "progress",
                                "message": f"处理第 {completed_count}/{len(segments)} 个片段",
                                "completed": completed_count,
                                "total": len(segments),
                                "questions_found": len(result.get("questions", [])),
                                "total_questions": sum(len(r.get("questions", [])) for r in segment_results if r is not None)
                            }
                        
                        print(f"📈 进度: {completed_count}/{len(segments)} 个片段已完成")
                    except Exception as e:
                        print(f"❌ 片段 {segment_index + 1} 处理异常: {str(e)}")
                        segment_results[segment_index] = {
                            "segment_index": segment_index,
                            "segment_id": segment.get("id", segment_index + 1),
                            "questions": [],
                            "success": False,
                            "error": str(e)
                        }
                        completed_count += 1
            
            # 按原始顺序合并所有题目
            all_questions = []
            for result in segment_results:
                if result and result.get("success"):
                    all_questions.extend(result["questions"])
            
            print(f"🎉 所有片段处理完成！总共提取到 {len(all_questions)} 个题目")
            return all_questions
            
        except Exception as e:
            raise Exception(f"处理PDF文本失败: {str(e)}")
    
    def process_pdf_text(self, pdf_text: str, max_workers: int = 3, expected_questions: int = None) -> List[Dict[str, Any]]:
        """处理PDF文本（并行版本）"""
        try:
            segments = self.split_text_intelligently(pdf_text)
            self.last_segments = segments  # 保存分割结果
            print(f"📊 分割为 {len(segments)} 个片段，使用 {max_workers} 个并行线程")
            
            # 初始化结果存储，按片段索引排序
            segment_results = [None] * len(segments)
            completed_count = 0
            
            # 使用线程池进行并行处理
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # 提交所有任务
                future_to_segment = {
                    executor.submit(self.process_segment, segment, i, expected_questions): (i, segment)
                    for i, segment in enumerate(segments)
                }
                
                # 收集结果
                for future in as_completed(future_to_segment):
                    segment_index, segment = future_to_segment[future]
                    try:
                        result = future.result()
                        # 按片段索引存储结果，保持顺序
                        segment_results[segment_index] = result
                        completed_count += 1
                        print(f"📈 进度: {completed_count}/{len(segments)} 个片段已完成")
                    except Exception as e:
                        print(f"❌ 片段 {segment_index + 1} 处理异常: {str(e)}")
                        segment_results[segment_index] = {
                            "segment_index": segment_index,
                            "segment_id": segment.get("id", segment_index + 1),
                            "questions": [],
                            "success": False,
                            "error": str(e)
                        }
                        completed_count += 1
            
            # 按原始顺序合并所有题目
            all_questions = []
            for result in segment_results:
                if result and result.get("success"):
                    all_questions.extend(result["questions"])
            
            print(f"🎉 所有片段处理完成！总共提取到 {len(all_questions)} 个题目")
            return all_questions
            
        except Exception as e:
            raise Exception(f"处理PDF文本失败: {str(e)}")
    
    def get_last_segments(self) -> List[Dict[str, Any]]:
        """获取最后的分割结果"""
        return getattr(self, 'last_segments', []) 