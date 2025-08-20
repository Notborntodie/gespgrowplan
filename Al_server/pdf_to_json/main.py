from PyPDF2 import PdfReader
from fastapi import FastAPI, File, UploadFile, Request, Form
from fastapi.responses import JSONResponse, HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import uuid
from llm_processor import LLMProcessor

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

# 并行处理配置
PARALLEL_WORKERS = 3  # 可以根据需要调整并行线程数

# 进度存储
progress_storage = {}

def extract_pdf_text(file_path: str) -> str:
    """
    Extracts text content from PDF file.
    
    Args:
        file_path (str): Path to the PDF file
        
    Returns:
        str: Extracted text content
    """
    try:
        with open(file_path, "rb") as file:
            reader = PdfReader(file)
            pdf_text = ""
            for page in reader.pages:
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
