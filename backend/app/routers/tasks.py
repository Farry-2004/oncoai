from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.patient import Patient
from app.models.task import Task, TaskComment
from app.models.user import User
from app.schemas.task import TaskCommentCreate, TaskCommentRead, TaskCreate, TaskRead, TaskUpdate
from app.services.audit_service import write_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _to_read(task: Task, db: Session) -> TaskRead:
    read = TaskRead.model_validate(task)
    if task.patient_id:
        patient = db.get(Patient, task.patient_id)
        if patient:
            read.patient_name = patient.full_name
    if task.assigned_to_id:
        assignee = db.get(User, task.assigned_to_id)
        if assignee:
            read.assigned_to_name = assignee.full_name
    read.comment_count = db.query(TaskComment).filter(TaskComment.task_id == task.id).count()
    return read


@router.get("", response_model=list[TaskRead])
def list_tasks(
    status_filter: str | None = None,
    assigned_to_id: str | None = None,
    patient_id: str | None = None,
    tumor_board_case_id: str | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[TaskRead]:
    query = db.query(Task)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if assigned_to_id:
        query = query.filter(Task.assigned_to_id == assigned_to_id)
    if patient_id:
        query = query.filter(Task.patient_id == patient_id)
    if tumor_board_case_id:
        query = query.filter(Task.tumor_board_case_id == tumor_board_case_id)
    tasks = query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).all()
    return [_to_read(t, db) for t in tasks]


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskRead:
    task = Task(created_by_id=current_user.id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    write_audit_event(
        db, actor_id=current_user.id, action="task.create", entity_type="task", entity_id=task.id
    )
    if task.assigned_to_id and task.assigned_to_id != current_user.id:
        create_notification(
            db,
            recipient_id=task.assigned_to_id,
            message=f'"{task.title}" has been assigned to you.',
            link="/tasks",
        )
    return _to_read(task, db)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskRead:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    write_audit_event(
        db,
        actor_id=current_user.id,
        action="task.update",
        entity_type="task",
        entity_id=task.id,
        metadata=changes,
    )
    return _to_read(task, db)


@router.get("/{task_id}/comments", response_model=list[TaskCommentRead])
def list_comments(
    task_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> list[TaskCommentRead]:
    comments = (
        db.query(TaskComment)
        .filter(TaskComment.task_id == task_id)
        .order_by(TaskComment.created_at.asc())
        .all()
    )
    reads = []
    for c in comments:
        read = TaskCommentRead.model_validate(c)
        if c.author_id:
            author = db.get(User, c.author_id)
            if author:
                read.author_name = author.full_name
        reads.append(read)
    return reads


@router.post("/{task_id}/comments", response_model=TaskCommentRead, status_code=status.HTTP_201_CREATED)
def add_comment(
    task_id: str,
    payload: TaskCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskCommentRead:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    comment = TaskComment(task_id=task_id, author_id=current_user.id, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    read = TaskCommentRead.model_validate(comment)
    read.author_name = current_user.full_name
    return read
