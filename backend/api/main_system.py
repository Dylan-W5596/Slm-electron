from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from globals import model_engine, OMNI_SYSTEM_PROMPT
from database import get_db, ChatSession, Message, Group
from sqlalchemy.orm import Session
from api.investment import nm

router = APIRouter(tags=["main_system"])

class GroupCreate(BaseModel):
    name: str = "未分類"

class GroupUpdate(BaseModel):
    name: Optional[str] = None 
    order: Optional[int] = None

class CreateSession(BaseModel):
    title: str = "New Chat"
    group_id: Optional[int] = None

class SessionMove(BaseModel):
    group_id: Optional[int] = None
    order: int

class CreateMessage(BaseModel):
    session_id: int
    content: str
    role: str = "user" 

class ChatResponse(BaseModel):
    role: str
    content: str 

@router.get("/status")
def get_status():
    return {
        "status": "running",
        "model_loaded": model_engine.is_loaded(),
        "device": "cuda" if model_engine.has_gpu else "cpu",
        "current_model": model_engine.get_current_model_id(),
        "network_allowed": nm.is_allowed()
    }

@router.get("/groups")
def list_groups(db: Session = Depends(get_db)):
    groups = db.query(Group).order_by(Group.order.asc()).all()
    return [
        {
            "id": g.id,
            "name": g.name,
            "order": g.order
        } for g in groups
    ]

@router.post("/groups")
def create_group(group_data: GroupCreate, db: Session = Depends(get_db)):
    max_order = db.query(Group).count()
    new_group = Group(name=group_data.name, order=max_order)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.patch("/groups/{group_id}")
def update_group(group_id: int, group_data: GroupUpdate, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group_data.name is not None:
        group.name = group_data.name
    if group_data.order is not None:
        group.order = group_data.order
    db.commit()
    db.refresh(group)
    return group

@router.delete("/groups/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.query(ChatSession).filter(ChatSession.group_id == group_id).update({ChatSession.group_id: None})
    db.delete(group)
    db.commit()
    return {"status": "success"}

@router.post("/sessions")
def create_session(session_data: CreateSession, db: Session = Depends(get_db)):
    count = db.query(ChatSession).filter(ChatSession.group_id == session_data.group_id).count()
    new_session = ChatSession(title=session_data.title, group_id=session_data.group_id, order=count)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(ChatSession.group_id.asc(), ChatSession.order.asc()).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "group_id": s.group_id,
            "order": s.order,
            "created_at": s.created_at
        } for s in sessions
    ]

@router.patch("/sessions/{session_id}/move")
def move_session(session_id: int, move_data: SessionMove, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.group_id = move_data.group_id
    session.order = move_data.order
    db.commit()
    db.refresh(session)
    return session

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"status": "success"}

@router.patch("/sessions/{session_id}")
def update_session(session_id: int, session_data: CreateSession, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.title = session_data.title
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}/messages")
def get_history(session_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.timestamp.asc()).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "timestamp": m.timestamp
        } for m in messages
    ]

@router.get("/updatelog")
def get_updatelog():
    log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "src", "assets", "updatelog.md")
    try:
        if not os.path.exists(log_path):
            raise HTTPException(status_code=404, detail="Update log file not found")
        with open(log_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
def chat(message: CreateMessage, db: Session = Depends(get_db)):
    user_msg = Message(session_id=message.session_id, role="user", content=message.content)
    db.add(user_msg)
    db.commit()
    
    history = db.query(Message).filter(Message.session_id == message.session_id).order_by(Message.timestamp.asc()).all()
    context = [OMNI_SYSTEM_PROMPT] + [{"role": m.role, "content": m.content} for m in history]
    
    response_text = model_engine.generate(context)
    
    ai_msg = Message(session_id=message.session_id, role="assistant", content=response_text)
    db.add(ai_msg)
    db.commit()
    
    return {"role": "assistant", "content": response_text}

@router.post("/run_python")
def run_python(data: dict):
    code = data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")
    
    wrapper_code = f"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64

plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'Arial Unicode MS', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False 

{code}

if plt.get_fignums():
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    print(f"OMNI_CHART_START{{img_str}}OMNI_CHART_END")
    plt.close('all')
"""
    
    import io
    output = io.StringIO()
    try:
        import contextlib
        with contextlib.redirect_stdout(output):
            exec(wrapper_code, {"__name__": "__main__"})
        
        full_output = output.getvalue()
        import re
        match = re.search(r"OMNI_CHART_START(.*?)OMNI_CHART_END", full_output, re.DOTALL)
        
        chart_data = match.group(1) if match else None
        return {"status": "success", "chart": chart_data, "logs": full_output.split("OMNI_CHART_START")[0]}
    except Exception as e:
        return {"status": "error", "message": str(e), "logs": output.getvalue()}

@router.post("/switch_model")
def switch_model(data: dict):
    model_id = data.get("model_id")
    print(model_id)
    if not model_id:
        raise HTTPException(status_code=400, detail="Model ID is required")
    
    try:
        model_engine.switch_model(model_id)
        return {"status": "success", "current_model": model_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
def chat_stream():
    return {"error": "串流功能在此最小版本中尚未實作"}
