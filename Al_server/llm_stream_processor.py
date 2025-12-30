import json
import os
import requests
from typing import Dict, Any, List, Generator, AsyncGenerator
import re
import asyncio

class LLMStreamProcessor:
    """
    真正的流式LLM处理器，支持实时流式输出题目
    """
    
    def __init__(self, api_key: str = None, max_tokens: int = 16000, model: str = None):
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        self.api_url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
        self.model = model or os.getenv("LLM_MODEL", "qwen-plus-latest")
        # 增加默认max_tokens，确保长文本也能完整输出
        self.max_tokens = max_tokens if max_tokens else 32000
    
    def create_question_prompt(self, pdf_text: str, expected_questions: int = None) -> str:
        """创建提取题目的prompt"""
        calibration_text = ""
        if expected_questions is not None:
            calibration_text = f"""

⚠️⚠️⚠️ 极其重要的要求 ⚠️⚠️⚠️：
- 预期题目数量：{expected_questions} 个
- 你必须生成完整的 {expected_questions} 个题目，一个都不能少！
- 请仔细检查整个PDF文本，确保提取所有题目
- 如果当前提取的题目数量少于 {expected_questions} 个，请继续仔细检查文本内容
- 不要遗漏任何题目，即使题目格式略有不同
- 每个题目都要完整提取，包括题目文本、选项、正确答案和解释
- 在生成完所有 {expected_questions} 个题目之前，不要停止输出
- 如果遇到困难，请重新检查PDF文本，确保没有遗漏任何题目"""
        
        return f"""请将以下PDF文本中的题目转换为标准JSON格式。

要求：
1. 分question_type两类题目：code和text
2. 如果题目有代码，则是code类型，反之text
3. 如果是code类型，则有question_code字段，如果是text类型，则question_code是空字符串
4. 每个题目包含：question_text, question_type, question_code, correct_answer, explanation, level, difficulty, options
5. level表示难度等级（1-5），difficulty表示难度描述（easy/medium/hard）{calibration_text}

重要格式要求：
- 每个题目之间用 "---QUESTION_SEPARATOR---" 分隔
- 每完成一个题目就立即输出，不要等待所有题目完成
- 严格按照JSON格式输出每个题目

代码处理要求：
- 对于code类型的题目，question_code字段中的代码需要：
  1. 移除行号（如"1 cin >> a;" → "cin >> a;"）
  2. 添加正确的缩进（根据代码结构添加适当的空格或制表符）
  3. 保持代码的完整性和可读性
  4. 确保代码语法正确

题目文本处理要求：
- question_text字段中不要包含题目编号（如"第1题"、"第2题"等）
- 只保留题目的实际内容，去除编号前缀
- 保持题目的完整性和清晰度

PDF文本：
{pdf_text}

请按照以下格式输出：
{{
  "question_text": "题目文本（不包含题目编号）",
  "question_type": "code或text",
  "question_code": "代码内容（移除行号，添加正确缩进）或空字符串",
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
---QUESTION_SEPARATOR---
{{
  "question_text": "下一个题目文本（不包含题目编号）",
  "question_type": "code或text",
  "question_code": "代码内容（移除行号，添加正确缩进）或空字符串",
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
---QUESTION_SEPARATOR---"""
    
    def call_api_stream(self, prompt: str) -> Generator[str, None, None]:
        """调用DashScope API并返回流式响应"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # 根据prompt长度动态调整max_tokens，确保有足够的输出空间
            # 估算：每个题目大约需要500-1000 tokens，加上prompt本身
            estimated_output_tokens = len(prompt) // 2  # 粗略估算输出token数
            dynamic_max_tokens = max(self.max_tokens, estimated_output_tokens + 10000)
            
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "你是一个专业的题目解析助手。你必须完整提取所有题目，不能遗漏任何一道题。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0,
                "max_tokens": min(dynamic_max_tokens, 32000),  # 设置最大输出token数，但不超过模型限制
                "stream": True  # 启用流式输出
            }
            
            response = requests.post(
                self.api_url, 
                headers=headers, 
                json=data, 
                timeout=120,
                stream=True
            )
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data_str = line_str[6:]  # 移除 'data: ' 前缀
                        if data_str.strip() == '[DONE]':
                            break
                        try:
                            chunk_data = json.loads(data_str)
                            if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                delta = chunk_data['choices'][0].get('delta', {})
                                if 'content' in delta:
                                    yield delta['content']
                        except json.JSONDecodeError:
                            continue
            
        except Exception as e:
            raise Exception(f"调用DashScope API失败: {str(e)}")
    
    async def call_api_stream_async(self, prompt: str) -> AsyncGenerator[str, None]:
        """异步调用DashScope API并返回流式响应"""
        try:
            import aiohttp
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # 根据prompt长度动态调整max_tokens，确保有足够的输出空间
            # 估算：每个题目大约需要500-1000 tokens，加上prompt本身
            estimated_output_tokens = len(prompt) // 2  # 粗略估算输出token数
            dynamic_max_tokens = max(self.max_tokens, estimated_output_tokens + 10000)
            
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "你是一个专业的题目解析助手。你必须完整提取所有题目，不能遗漏任何一道题。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0,
                "max_tokens": min(dynamic_max_tokens, 32000),  # 设置最大输出token数，但不超过模型限制
                "stream": True  # 启用流式输出
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url, 
                    headers=headers, 
                    json=data, 
                    timeout=120
                ) as response:
                    response.raise_for_status()
                    
                    async for line in response.content:
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            data_str = line_str[6:]  # 移除 'data: ' 前缀
                            if data_str.strip() == '[DONE]':
                                break
                            try:
                                chunk_data = json.loads(data_str)
                                if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                    delta = chunk_data['choices'][0].get('delta', {})
                                    if 'content' in delta:
                                        yield delta['content']
                            except json.JSONDecodeError:
                                continue
            
        except Exception as e:
            raise Exception(f"调用DashScope API失败: {str(e)}")
    
    def parse_streaming_json(self, stream_generator: Generator[str, None, None]) -> Generator[Dict[str, Any], None, None]:
        """解析流式JSON响应，使用分割符实时提取完整题目"""
        buffer = ""
        separator = "---QUESTION_SEPARATOR---"
        
        for chunk in stream_generator:
            buffer += chunk
            
            # 查找分割符，提取完整的题目
            while separator in buffer:
                # 找到分割符的位置
                separator_pos = buffer.find(separator)
                
                # 提取分割符之前的内容作为题目JSON
                question_json = buffer[:separator_pos].strip()
                
                # 移除已处理的部分
                buffer = buffer[separator_pos + len(separator):].strip()
                
                # 尝试解析题目JSON
                if question_json:
                    try:
                        question_obj = json.loads(question_json)
                        if self.is_valid_question(question_obj):
                            yield question_obj
                    except json.JSONDecodeError as e:
                        print(f"JSON解析错误: {e}")
                        print(f"问题JSON: {question_json[:200]}...")
                        continue
        
        # 流结束后，处理buffer中剩余的最后一个题目（可能没有分隔符）
        if buffer.strip():
            # 尝试提取可能的JSON对象
            buffer = buffer.strip()
            # 尝试找到最后一个完整的JSON对象
            try:
                # 尝试直接解析整个buffer
                question_obj = json.loads(buffer)
                if self.is_valid_question(question_obj):
                    yield question_obj
            except json.JSONDecodeError:
                # 如果直接解析失败，尝试找到最后一个完整的JSON对象
                # 查找最后一个 { 和对应的 }
                last_open = buffer.rfind('{')
                if last_open != -1:
                    # 尝试从最后一个 { 开始解析
                    for i in range(len(buffer), last_open, -1):
                        try:
                            potential_json = buffer[last_open:i]
                            question_obj = json.loads(potential_json)
                            if self.is_valid_question(question_obj):
                                yield question_obj
                                break
                        except json.JSONDecodeError:
                            continue
    
    async def parse_streaming_json_async(self, stream_generator: AsyncGenerator[str, None]) -> AsyncGenerator[Dict[str, Any], None]:
        """异步解析流式JSON响应，使用分割符实时提取完整题目"""
        buffer = ""
        separator = "---QUESTION_SEPARATOR---"
        
        async for chunk in stream_generator:
            buffer += chunk
            
            # 查找分割符，提取完整的题目
            while separator in buffer:
                # 找到分割符的位置
                separator_pos = buffer.find(separator)
                
                # 提取分割符之前的内容作为题目JSON
                question_json = buffer[:separator_pos].strip()
                
                # 移除已处理的部分
                buffer = buffer[separator_pos + len(separator):].strip()
                
                # 尝试解析题目JSON
                if question_json:
                    try:
                        question_obj = json.loads(question_json)
                        if self.is_valid_question(question_obj):
                            yield question_obj
                    except json.JSONDecodeError as e:
                        print(f"JSON解析错误: {e}")
                        print(f"问题JSON: {question_json[:200]}...")
                        continue
        
        # 流结束后，处理buffer中剩余的最后一个题目（可能没有分隔符）
        if buffer.strip():
            # 尝试提取可能的JSON对象
            buffer = buffer.strip()
            # 尝试找到最后一个完整的JSON对象
            try:
                # 尝试直接解析整个buffer
                question_obj = json.loads(buffer)
                if self.is_valid_question(question_obj):
                    yield question_obj
            except json.JSONDecodeError:
                # 如果直接解析失败，尝试找到最后一个完整的JSON对象
                # 查找最后一个 { 和对应的 }
                last_open = buffer.rfind('{')
                if last_open != -1:
                    # 尝试从最后一个 { 开始解析
                    for i in range(len(buffer), last_open, -1):
                        try:
                            potential_json = buffer[last_open:i]
                            question_obj = json.loads(potential_json)
                            if self.is_valid_question(question_obj):
                                yield question_obj
                                break
                        except json.JSONDecodeError:
                            continue
    
    def is_valid_question(self, obj: Dict[str, Any]) -> bool:
        """检查是否是有效的题目对象"""
        required_fields = ['question_text', 'question_type', 'correct_answer', 'options']
        return all(field in obj for field in required_fields)
    
    def split_pdf_text_intelligently(self, pdf_text: str, max_chunk_size: int = 3000) -> List[str]:
        """
        智能分割PDF文本，保持题目完整性
        基于pdfplumber提取的优化格式进行分割
        
        Args:
            pdf_text: PDF文本内容
            max_chunk_size: 每个片段的最大字符数
            
        Returns:
            分割后的文本片段列表
        """
        if len(pdf_text) <= max_chunk_size:
            return [pdf_text]
        
        chunks = []
        lines = pdf_text.split('\n')
        
        # 识别题目边界
        question_boundaries = []
        for i, line in enumerate(lines):
            # 匹配题目编号模式
            if re.match(r'第\s*\d+\s*题', line.strip()):
                question_boundaries.append(i)
            # 匹配章节分隔
            elif re.match(r'\d+\s*(单选题|判断题|编程题)', line.strip()):
                question_boundaries.append(i)
        
        # 如果没有找到题目边界，使用原来的方法
        if not question_boundaries:
            return self._split_by_size_fallback(pdf_text, max_chunk_size)
        
        # 按题目边界分割
        current_chunk = ""
        current_size = 0
        
        for i, line in enumerate(lines):
            line_with_newline = line + '\n'
            line_size = len(line_with_newline)
            
            # 检查是否是题目边界且当前块已经有一定大小
            if (i in question_boundaries and 
                current_size > max_chunk_size * 0.3 and  # 至少达到30%的大小
                current_chunk.strip()):
                # 保存当前块
                chunks.append(current_chunk.strip())
                current_chunk = line_with_newline
                current_size = line_size
            else:
                # 检查是否会超过最大大小
                if current_size + line_size > max_chunk_size and current_chunk.strip():
                    # 寻找最近的题目边界进行分割
                    split_point = self._find_best_split_point(current_chunk, question_boundaries, i, lines)
                    if split_point > 0:
                        chunks.append(current_chunk[:split_point].strip())
                        current_chunk = current_chunk[split_point:] + line_with_newline
                        current_size = len(current_chunk)
                    else:
                        # 强制分割
                        chunks.append(current_chunk.strip())
                        current_chunk = line_with_newline
                        current_size = line_size
                else:
                    current_chunk += line_with_newline
                    current_size += line_size
        
        # 添加最后一个片段
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _find_best_split_point(self, text: str, boundaries: List[int], current_line: int, all_lines: List[str]) -> int:
        """寻找最佳分割点"""
        # 在文本中寻找最近的题目开始位置
        lines = text.split('\n')
        for i in range(len(lines) - 1, -1, -1):
            line = lines[i].strip()
            if re.match(r'第\s*\d+\s*题', line):
                # 找到题目开始，返回该位置
                return sum(len(lines[j] + '\n') for j in range(i))
        return 0
    
    def _split_by_size_fallback(self, pdf_text: str, max_chunk_size: int) -> List[str]:
        """备用分割方法，按大小分割"""
        chunks = []
        current_chunk = ""
        lines = pdf_text.split('\n')
        
        for line in lines:
            if len(current_chunk) + len(line) + 1 > max_chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = line
                else:
                    chunks.append(line[:max_chunk_size])
                    current_chunk = line[max_chunk_size:]
            else:
                current_chunk += "\n" + line if current_chunk else line
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def estimate_questions_in_text(self, text: str) -> int:
        """
        估算文本中的题目数量
        基于pdfplumber提取的优化格式进行估算
        
        Args:
            text: 文本内容
            
        Returns:
            估算的题目数量
        """
        # 基于新的文本格式进行估算
        question_count = 0
        
        # 1. 直接计算题目编号
        question_pattern = r'第\s*\d+\s*题'
        question_matches = re.findall(question_pattern, text)
        question_count = max(question_count, len(question_matches))
        
        # 2. 计算选项组数量（A. B. C. D. 的组合）
        option_groups = 0
        lines = text.split('\n')
        in_option_group = False
        option_count = 0
        
        for line in lines:
            line = line.strip()
            # 检测选项开始
            if re.match(r'^[A-D]\s*[\.\)]\s*', line):
                if not in_option_group:
                    in_option_group = True
                    option_count = 1
                else:
                    option_count += 1
            else:
                # 如果之前有选项组且现在结束了
                if in_option_group and option_count >= 2:  # 至少2个选项才算一个题目
                    option_groups += 1
                in_option_group = False
                option_count = 0
        
        # 处理最后一个选项组
        if in_option_group and option_count >= 2:
            option_groups += 1
        
        question_count = max(question_count, option_groups)
        
        # 3. 计算代码块数量（作为编程题的指标）
        code_blocks = 0
        in_code_block = False
        for line in lines:
            line = line.strip()
            # 检测代码行（有行号的代码）
            if re.match(r'^\d+\s+', line) and any(keyword in line for keyword in ['cin', 'cout', 'for', 'int', 'if', 'while']):
                if not in_code_block:
                    in_code_block = True
                    code_blocks += 1
            elif line and not re.match(r'^\d+\s+', line):
                in_code_block = False
        
        # 4. 综合估算
        # 优先使用题目编号，其次使用选项组，最后使用代码块
        if question_count > 0:
            return question_count
        elif option_groups > 0:
            return option_groups
        elif code_blocks > 0:
            return code_blocks
        else:
            # 备用方法：通过其他指标估算
            fallback_indicators = [
                r'正确答案\s*[A-D]',
                r'答案\s*[A-D]',
                r'\(\s*\d+\s*分\s*\)'
            ]
            
            count = 0
            for pattern in fallback_indicators:
                matches = re.findall(pattern, text, re.IGNORECASE)
                count += len(matches)
            
            return max(1, count)
    
    def process_pdf_text_stream(self, pdf_text: str, expected_questions: int = None) -> Generator[Dict[str, Any], None, None]:
        """流式处理PDF文本，直接处理整个文本（跳过智能分割）"""
        try:
            # 发送开始处理消息
            yield {
                "type": "process_start",
                "message": "开始处理PDF文本（直接处理整个文本）"
            }
            
            # 直接使用整个PDF文本，不进行分割
            yield {
                "type": "chunk_info",
                "message": f"PDF文本长度: {len(pdf_text)} 字符，直接处理整个文本",
                "chunk_count": 1
            }
            
            total_questions = 0
            all_questions = []
            
            # 直接处理整个PDF文本
            yield {
                "type": "chunk_start",
                "message": "开始处理整个PDF文本",
                "chunk_index": 0,
                "chunk_size": len(pdf_text)
            }
            
            # 估算题目数量
            chunk_expected = self.estimate_questions_in_text(pdf_text)
            if expected_questions:
                chunk_expected = expected_questions
            
            # 创建prompt
            prompt = self.create_question_prompt(pdf_text, chunk_expected)
            
            # 调用流式API
            stream_generator = self.call_api_stream(prompt)
            
            # 解析流式JSON响应
            chunk_question_count = 0
            for question in self.parse_streaming_json(stream_generator):
                chunk_question_count += 1
                total_questions += 1
                all_questions.append(question)
                
                yield {
                    "type": "question",
                    "question": question,
                    "question_index": total_questions - 1,
                    "chunk_index": 0,
                    "message": f"✅ 第 {total_questions} 个题目提取完成"
                }
            
            yield {
                "type": "chunk_complete",
                "message": f"整个PDF文本处理完成，提取到 {chunk_question_count} 个题目",
                "chunk_index": 0,
                "chunk_questions": chunk_question_count
            }
            
            # 检查题目数量是否达到预期
            warning_message = ""
            if expected_questions and total_questions < expected_questions:
                missing_count = expected_questions - total_questions
                warning_message = f"⚠️ 警告：预期生成 {expected_questions} 个题目，但只提取到 {total_questions} 个，缺少 {missing_count} 个题目。可能的原因：1) PDF文本中实际题目数量不足；2) LLM输出被截断；3) 部分题目格式识别困难。"
                yield {
                    "type": "warning",
                    "message": warning_message,
                    "expected": expected_questions,
                    "actual": total_questions,
                    "missing": missing_count
                }
            
            # 发送处理完成消息
            complete_message = f"🎉 处理完成！总共提取到 {total_questions} 个题目"
            if warning_message:
                complete_message += f"\n{warning_message}"
            
            yield {
                "type": "process_complete",
                "message": complete_message,
                "total_questions": total_questions,
                "chunk_count": 1,
                "expected_questions": expected_questions
            }
            
        except Exception as e:
            yield {
                "type": "process_error",
                "error": str(e),
                "message": f"❌ 处理PDF文本失败: {str(e)}"
            }
    
    async def process_pdf_text_stream_async(self, pdf_text: str, expected_questions: int = None) -> AsyncGenerator[Dict[str, Any], None]:
        """异步流式处理PDF文本，直接处理整个文本（跳过智能分割）"""
        try:
            # 发送开始处理消息
            yield {
                "type": "process_start",
                "message": "开始处理PDF文本（直接处理整个文本）"
            }
            
            # 直接使用整个PDF文本，不进行分割
            yield {
                "type": "chunk_info",
                "message": f"PDF文本长度: {len(pdf_text)} 字符，直接处理整个文本",
                "chunk_count": 1
            }
            
            total_questions = 0
            all_questions = []
            
            # 直接处理整个PDF文本
            yield {
                "type": "chunk_start",
                "message": "开始处理整个PDF文本",
                "chunk_index": 0,
                "chunk_size": len(pdf_text)
            }
            
            # 估算题目数量
            chunk_expected = self.estimate_questions_in_text(pdf_text)
            if expected_questions:
                chunk_expected = expected_questions
            
            # 创建prompt
            prompt = self.create_question_prompt(pdf_text, chunk_expected)
            
            # 调用异步流式API
            stream_generator = self.call_api_stream_async(prompt)
            
            # 解析流式JSON响应
            chunk_question_count = 0
            async for question in self.parse_streaming_json_async(stream_generator):
                chunk_question_count += 1
                total_questions += 1
                all_questions.append(question)
                
                yield {
                    "type": "question",
                    "question": question,
                    "question_index": total_questions - 1,
                    "chunk_index": 0,
                    "message": f"✅ 第 {total_questions} 个题目提取完成"
                }
            
            yield {
                "type": "chunk_complete",
                "message": f"整个PDF文本处理完成，提取到 {chunk_question_count} 个题目",
                "chunk_index": 0,
                "chunk_questions": chunk_question_count
            }
            
            # 检查题目数量是否达到预期
            warning_message = ""
            if expected_questions and total_questions < expected_questions:
                missing_count = expected_questions - total_questions
                warning_message = f"⚠️ 警告：预期生成 {expected_questions} 个题目，但只提取到 {total_questions} 个，缺少 {missing_count} 个题目。可能的原因：1) PDF文本中实际题目数量不足；2) LLM输出被截断；3) 部分题目格式识别困难。"
                yield {
                    "type": "warning",
                    "message": warning_message,
                    "expected": expected_questions,
                    "actual": total_questions,
                    "missing": missing_count
                }
            
            # 发送处理完成消息
            complete_message = f"🎉 处理完成！总共提取到 {total_questions} 个题目"
            if warning_message:
                complete_message += f"\n{warning_message}"
            
            yield {
                "type": "process_complete",
                "message": complete_message,
                "total_questions": total_questions,
                "chunk_count": 1,
                "expected_questions": expected_questions
            }
            
        except Exception as e:
            yield {
                "type": "process_error",
                "error": str(e),
                "message": f"❌ 处理PDF文本失败: {str(e)}"
            }
