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

# 进度存储
progress_storage = {}

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
