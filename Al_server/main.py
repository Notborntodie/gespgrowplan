import pdfplumber
from fastapi import FastAPI, File, UploadFile, Request, Form
from fastapi.responses import JSONResponse, HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from llm_processor import LLMProcessor
from explanation_processor import ExplanationProcessor
from llm_stream_processor import LLMStreamProcessor

# Initialize FastAPI and templates
app = FastAPI()

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该指定具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")

# Initialize LLM processor with increased token limit
llm_processor = LLMProcessor(max_tokens=8000)

# Initialize explanation processor for fast explanation generation
explanation_processor = ExplanationProcessor(max_tokens=400)


# Initialize LLM stream processor for true streaming LLM output
llm_stream_processor = LLMStreamProcessor(max_tokens=16000)

# Agent SQL 生成：使用 LLM_MODE_ID，默认 glm-4.7
sql_llm = LLMProcessor(
    max_tokens=2000,
    model=os.getenv("LLM_MODE_ID", "glm-4.7")
)

# 进度存储
progress_storage = {}

# 学习计划相关表结构摘要，供 Agent 生成 SQL 使用
DEFAULT_SCHEMA_HINT = """
涉及的学习计划相关表（MySQL）：
- learning_plans: id, name, description, level(GESP级别1-6), start_time, end_time, created_by, is_active
- learning_tasks: id, plan_id, name, description, task_order, start_time, end_time
- user_learning_plans: id, user_id, plan_id, joined_at, status
- user_task_progress: id, user_id, task_id, is_completed, completed_at
- user_exam_progress: user_id, exam_id, task_id, is_completed, best_score, attempt_count, completed_at
- user_oj_progress: user_id, problem_id, task_id, is_completed, best_verdict, attempt_count, completed_at
- task_exams: task_id, exam_id, exam_order
- task_oj_problems: task_id, problem_id, problem_order
- users: id, username, real_name, email
请只生成一条 SELECT 语句，不要包含分号或多条语句，不要使用 INSERT/UPDATE/DELETE/DROP 等。
"""

def extract_pdf_text(file_path: str) -> str:
    """
    Extracts text content from PDF file using pdfplumber for better code formatting.
    
    Args:
        file_path (str): Path to the PDF file
        
    Returns:
        str: Extracted text content
    """
    try:
        pdf_text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    pdf_text += page_text + "\n"
        return pdf_text.strip()
    except Exception as e:
        raise ValueError(f"Error extracting PDF text: {str(e)}")

async def process_pdf_file(file: UploadFile, use_llm: bool = True, parallel_workers: int = 3, progress_id: str = None, expected_questions: int = None):
    """
    处理PDF文件
    
    Args:
        file: 上传的文件
        use_llm: 是否使用大模型处理
        parallel_workers: 并行线程数
        progress_id: 进度ID
        expected_questions: 预期题目数量（用于校准）
    """
    try:
        # 打印接收到的参数
        print(f"🔧 接收到的参数:")
        print(f"   - use_llm: {use_llm}")
        print(f"   - parallel_workers: {parallel_workers}")
        print(f"   - expected_questions: {expected_questions}")
        
        # 保存上传的文件
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        try:
            # 提取PDF文本
            pdf_text = extract_pdf_text(file_path)
            
            if not use_llm:
                # 仅返回原始文本
                return {
                    "filename": file.filename,
                    "raw_content": pdf_text,
                    "questions": [],
                    "status": "success",
                    "processed": False,
                    "question_count": 0
                }
            
            print(f"📄 开始处理PDF文件: {file.filename}")
            print(f"📊 PDF文本长度: {len(pdf_text)} 字符")
            
            # 发送开始处理的消息
            if progress_id:
                progress_storage[progress_id] = {
                    "type": "start",
                    "message": f"开始处理PDF文件: {file.filename}",
                    "text_length": len(pdf_text)
                }
            
            questions = llm_processor.process_pdf_text_with_progress(
                pdf_text, 
                max_workers=parallel_workers, 
                progress_id=progress_id,
                expected_questions=expected_questions
            )
            
            print(f"✅ 处理完成，提取到 {len(questions)} 个题目")
            
            # 发送完成消息
            if progress_id:
                progress_storage[progress_id] = {
                    "type": "complete",
                    "message": f"处理完成！总共提取到 {len(questions)} 个题目",
                    "question_count": len(questions)
                }
            
            return {
                "filename": file.filename,
                "raw_content": pdf_text,
                "questions": questions,
                "status": "success",
                "processed": True,
                "question_count": len(questions),
                "segment_count": len(llm_processor.get_last_segments()) if hasattr(llm_processor, 'get_last_segments') else 1,
                "parallel_workers": parallel_workers,
                "expected_questions": expected_questions
            }
            
        finally:
            # 清理临时文件
            if os.path.exists(file_path):
                os.remove(file_path)
                
    except Exception as e:
        return {
            "filename": file.filename,
            "error": str(e),
            "status": "error"
        }



@app.get("/", response_class=HTMLResponse)
async def home():
    """
    Renders the upload page with a form to upload a PDF.
    """
    return templates.TemplateResponse("upload.html", {"request": {}})

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    use_llm: bool = Form(True),
    parallel_workers: int = Form(3),
    expected_questions: str = Form("")
):
    """
    上传PDF文件并处理
    
    Args:
        file: 上传的PDF文件
        use_llm: 是否使用大模型处理
        parallel_workers: 并行线程数
        expected_questions: 预期题目数量（用于校准）
    """
    # 处理expected_questions参数
    expected_questions_int = None
    if expected_questions and expected_questions.strip():
        try:
            expected_questions_int = int(expected_questions)
        except ValueError:
            print(f"⚠️ 预期题目数转换失败: {expected_questions}")
    
    return await process_pdf_file(file, use_llm, parallel_workers, expected_questions=expected_questions_int)

@app.get("/progress/{progress_id}")
async def get_progress(progress_id: str):
    """
    获取处理进度
    """
    if progress_id in progress_storage:
        return progress_storage[progress_id]
    else:
        return {"type": "error", "message": "进度ID不存在"}



@app.post("/api/extract")
async def extract_pdf_api(
    file: UploadFile = File(...), 
    use_llm: bool = Form(True), 
    parallel_workers: int = Form(3)
):
    """
    API endpoint for PDF extraction without web interface.
    Designed for programmatic usage.
    """
    return await process_pdf_file(file, use_llm, parallel_workers)

@app.post("/api/extract-raw")
async def extract_pdf_raw(file: UploadFile = File(...)):
    """
    Extract raw text only, without LLM processing.
    """
    return await process_pdf_file(file, use_llm=False)

@app.post("/api/generate-explanation")
async def generate_explanation(request: Request):
    """
    为单个题目生成详细的答案解析
    
    请求体格式：
    {
        "question": {
            "question_text": "题目文本",
            "question_type": "code或text",
            "question_code": "代码内容或空字符串",
            "correct_answer": "正确答案标签",
            "explanation": "原始解释说明",
            "level": 难度等级,
            "difficulty": "难度描述",
            "options": [
                {"label": "A", "value": "A", "text": "选项内容"},
                {"label": "B", "value": "B", "text": "选项内容"},
                {"label": "C", "value": "C", "text": "选项内容"},
                {"label": "D", "value": "D", "text": "选项内容"}
            ]
        }
    }
    """
    try:
        # 获取请求体
        body = await request.json()
        
        # 验证请求数据
        if "question" not in body:
            return JSONResponse(
                status_code=400,
                content={"error": "请求体中缺少question字段"}
            )
        
        question_data = body["question"]
        
        # 验证题目数据
        if not explanation_processor.validate_question_data(question_data):
            return JSONResponse(
                status_code=400,
                content={"error": "题目数据格式不正确"}
            )
        
        # 生成解析
        result = explanation_processor.generate_explanation(question_data)
        
        return JSONResponse(content=result)
        
    except json.JSONDecodeError:
        return JSONResponse(
            status_code=400,
            content={"error": "请求体不是有效的JSON格式"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"生成解析失败: {str(e)}"}
        )

@app.post("/api/generate-batch-explanations")
async def generate_batch_explanations(request: Request):
    """
    批量生成多个题目的答案解析
    
    请求体格式：
    {
        "questions": [
            {
                "question_text": "题目文本",
                "question_type": "code或text",
                "question_code": "代码内容或空字符串",
                "correct_answer": "正确答案标签",
                "explanation": "原始解释说明",
                "level": 难度等级,
                "difficulty": "难度描述",
                "options": [
                    {"label": "A", "value": "A", "text": "选项内容"},
                    {"label": "B", "value": "B", "text": "选项内容"},
                    {"label": "C", "value": "C", "text": "选项内容"},
                    {"label": "D", "value": "D", "text": "选项内容"}
                ]
            }
        ]
    }
    """
    try:
        # 获取请求体
        body = await request.json()
        
        # 验证请求数据
        if "questions" not in body:
            return JSONResponse(
                status_code=400,
                content={"error": "请求体中缺少questions字段"}
            )
        
        questions = body["questions"]
        
        if not isinstance(questions, list):
            return JSONResponse(
                status_code=400,
                content={"error": "questions字段必须是数组"}
            )
        
        if len(questions) == 0:
            return JSONResponse(
                status_code=400,
                content={"error": "questions数组不能为空"}
            )
        
        # 验证每个题目数据
        for i, question in enumerate(questions):
            if not explanation_processor.validate_question_data(question):
                return JSONResponse(
                    status_code=400,
                    content={"error": f"第{i+1}个题目数据格式不正确"}
                )
        
        # 批量生成解析
        results = explanation_processor.generate_batch_explanations(questions)
        
        return JSONResponse(content={
            "results": results,
            "total_count": len(results),
            "success_count": len([r for r in results if r["status"] == "success"]),
            "error_count": len([r for r in results if r["status"] == "error"])
        })
        
    except json.JSONDecodeError:
        return JSONResponse(
            status_code=400,
            content={"error": "请求体不是有效的JSON格式"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"批量生成解析失败: {str(e)}"}
        )


ALLOWED_ACTIONS = frozenset({"think", "execute_sql", "query_schema", "ask_user", "present_result"})


def _parse_next_action_response(text: str) -> dict:
    """从 LLM 回复中解析出 thought, action, args（单行 JSON 或代码块内 JSON）"""
    import re
    raw = (text or "").strip()
    if not raw:
        return {}
    # 尝试提取 ```json ... ``` 或 ``` ... ``` 内的内容
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw, re.IGNORECASE)
    if m:
        raw = m.group(1).strip()
    # 找第一行看起来像 JSON 的
    for line in raw.split("\n"):
        line = line.strip()
        if line.startswith("{") and "action" in line:
            try:
                out = json.loads(line)
                return out
            except json.JSONDecodeError:
                continue
    # 整段作为 JSON（支持多行）
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # 尝试从文本中找第一个 { ... } 块
    brace = raw.find("{")
    if brace != -1:
        depth = 0
        for i in range(brace, len(raw)):
            if raw[i] == "{":
                depth += 1
            elif raw[i] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(raw[brace : i + 1])
                    except json.JSONDecodeError:
                        break
    return {}


@app.post("/api/admin/agent/next-action")
async def agent_next_action(request: Request):
    """
    ReAct 单步：根据当前上下文生成下一步 thought + action + args。
    请求体: { "system_prompt": string, "context": string }
    返回: { "thought": string, "action": string, "args": object }
    """
    try:
        body = await request.json()
        system_prompt = (body.get("system_prompt") or "").strip()
        context = (body.get("context") or "").strip()
        if not context:
            return JSONResponse(status_code=400, content={"error": "缺少 context"})
        prompt_suffix = (
            "\n\n请只输出一行 JSON，不要其他文字，格式: {\"thought\":\"你的推理\",\"action\":\"动作名\",\"args\":{...}}。"
            "action 只能是: think, execute_sql, query_schema, ask_user, present_result 之一。"
        )
        user_content = context + prompt_suffix
        raw = sql_llm.call_api_with_messages(system_prompt or "你是数据查询助手。", user_content)
        raw = (raw or "").strip()
        # LLM 返回空或无效时给出安全 fallback，避免 400 导致前端 502
        if not raw:
            return JSONResponse(
                content={
                    "thought": "模型未返回有效内容，转为向用户提示重试。",
                    "action": "ask_user",
                    "args": {"message": "请求暂时无有效回复，请简化问题或稍后重试。"},
                }
            )
        parsed = _parse_next_action_response(raw)
        thought = (parsed.get("thought") or "").strip()
        action = (parsed.get("action") or "").strip().lower()
        args = parsed.get("args")
        if not isinstance(args, dict):
            args = {}
        if action not in ALLOWED_ACTIONS:
            # 解析失败或 action 不合法时返回安全 fallback，避免前端 502
            if not action and raw:
                return JSONResponse(
                    content={
                        "thought": "模型返回内容无法解析为规定 JSON 格式，转为提示用户重试。",
                        "action": "ask_user",
                        "args": {"message": "当前回复格式异常，请简化问题或换一种说法重试。"},
                    }
                )
            return JSONResponse(
                status_code=400,
                content={"error": f"无效 action: {action}", "raw": (raw or "")[:500]}
            )
        return JSONResponse(content={"thought": thought, "action": action, "args": args})
    except json.JSONDecodeError:
        return JSONResponse(status_code=400, content={"error": "请求体不是有效 JSON"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"生成下一步失败: {str(e)}"})


def _extract_sql_from_response(text: str) -> str:
    """从 LLM 回复中提取单条 SQL，去除 markdown 代码块等"""
    import re
    text = (text or "").strip()
    # 去除 ```sql ... ``` 或 ``` ... ```
    m = re.search(r"```(?:sql)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if m:
        text = m.group(1).strip()
    # 只保留第一条语句（按分号或换行截断，且忽略注释后的分号）
    first_stmt = text.split(";")[0].strip()
    if first_stmt:
        text = first_stmt
    return text.strip()


@app.post("/api/admin/generate-sql")
async def generate_sql(request: Request):
    """
    根据自然语言问题生成只读 SELECT SQL（Agent 使用）。
    使用环境变量 LLM_MODE_ID，默认 glm-4.7。
    请求体: { "question": "用户问题", "schemaHint": "可选，表结构摘要" }
    返回: { "sql": "SELECT ..." }
    """
    try:
        body = await request.json()
        question = (body.get("question") or "").strip()
        if not question:
            return JSONResponse(status_code=400, content={"error": "缺少 question 字段"})
        schema_hint = (body.get("schemaHint") or "").strip() or DEFAULT_SCHEMA_HINT
        system_content = (
            "你是数据库查询助手。根据用户问题与给定的表结构，生成一条且仅一条 MySQL 的 SELECT 语句。"
            "不要输出任何解释，只输出 SQL。禁止 INSERT/UPDATE/DELETE/DROP 等写操作与多语句。"
        )
        user_content = f"表结构说明：\n{schema_hint}\n\n用户问题：{question}"
        raw = sql_llm.call_api_with_messages(system_content, user_content)
        sql = _extract_sql_from_response(raw)
        if not sql.upper().startswith("SELECT"):
            return JSONResponse(status_code=400, content={"error": "仅允许 SELECT 语句", "raw": raw[:200]})
        return JSONResponse(content={"sql": sql})
    except json.JSONDecodeError:
        return JSONResponse(status_code=400, content={"error": "请求体不是有效 JSON"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"生成 SQL 失败: {str(e)}"})


@app.post("/api/stream-extract")
async def stream_extract_pdf(
    file: UploadFile = File(...),
    expected_questions: str = Form("")
):
    """
    流式处理PDF文件，实时返回题目结果
    使用LLM的流式输出，每当生成一个完整题目就立即返回
    """
    # 处理expected_questions参数
    expected_questions_int = None
    if expected_questions and expected_questions.strip():
        try:
            expected_questions_int = int(expected_questions)
        except ValueError:
            print(f"⚠️ 预期题目数转换失败: {expected_questions}")
    
    # 先读取文件内容
    content = await file.read()
    
    def generate_stream():
        """生成流式响应"""
        file_path = None
        try:
            # 保存上传的文件
            file_path = f"temp_{file.filename}"
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            # 提取PDF文本
            pdf_text = extract_pdf_text(file_path)
            
            # 使用LLM流式处理器
            for data in llm_stream_processor.process_pdf_text_stream(
                pdf_text,
                expected_questions=expected_questions_int
            ):
                yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
            
            # 发送结束标记
            yield f"data: {json.dumps({'type': 'stream_end', 'message': '流式处理完成'}, ensure_ascii=False)}\n\n"
                
        except Exception as e:
            error_data = {
                "type": "error",
                "message": f"流式处理失败: {str(e)}",
                "error": str(e)
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
        finally:
            # 清理临时文件
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )
