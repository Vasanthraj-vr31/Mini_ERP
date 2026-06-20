from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.reports import pdf as pdf_reports

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{name}.pdf")
def report(name: str, db: Session = Depends(get_db)):
    if name not in pdf_reports.REPORTS:
        raise HTTPException(404, "Unknown report")
    filename, builder = pdf_reports.REPORTS[name]
    data = builder(db)
    return Response(content=data, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{filename}.pdf"'})


@router.get("")
def list_reports():
    return [{"name": k, "title": v[0].replace("_", " ")} for k, v in pdf_reports.REPORTS.items()]
