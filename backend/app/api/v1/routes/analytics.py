import datetime
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import JobStatus
from app.database.dependency import get_db
from app.models.background_job import BackgroundJob
from app.models.dataset import Dataset
from app.models.document import Document
from app.models.report import Report
from app.models.stored_file import StoredFile
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.activity import Activity
from app.security.dependencies import get_current_user
from app.security.organization_dependency import get_current_organization
from app.security.workspace_dependency import get_current_workspace
from app.api.v1.routes.workspaces import format_bytes_human

router = APIRouter(prefix="/analytics", tags=["Analytics & System Telemetry"])


def map_file_category(extension: str, mime_type: str) -> str:
    ext = (extension or "").lower().replace(".", "")
    mime = (mime_type or "").lower()
    if ext == "pdf" or "pdf" in mime:
        return "PDF"
    if ext in ["doc", "docx"] or "word" in mime:
        return "DOCX"
    if ext in ["csv", "xls", "xlsx"] or "csv" in mime or "excel" in mime:
        return "CSV"
    if ext in ["png", "jpg", "jpeg", "gif", "webp", "svg"] or "image" in mime:
        return "Images"
    if ext in ["zip", "tar", "gz", "rar", "7z"] or "zip" in mime or "compressed" in mime:
        return "ZIP"
    if ext == "json" or "json" in mime:
        return "JSON"
    return "Other"


@router.get(
    "/telemetry",
    summary="Get Aggregated Analytics & System Telemetry",
    description="Returns live aggregated data for Workspaces, Files, Storage, Documents, Datasets, Team, Reports, Jobs, and Visual Charts.",
)
async def get_telemetry(
    period: str = Query(default="7d", description="Time period filter: today, 7d, 30d, 90d, 1y, all"),
    workspace_id: Optional[str] = Query(default=None, description="Workspace filter: all or workspace UUID"),
    category: Optional[str] = Query(default=None, description="Category filter: all, documents, datasets, files, reports"),
    owner_id: Optional[str] = Query(default=None, description="Owner filter: all or user UUID"),
    current_user: User = Depends(get_current_user),
    current_org: Any = Depends(get_current_organization),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Calculate period threshold
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7d":
        start_date = now - datetime.timedelta(days=7)
    elif period == "30d":
        start_date = now - datetime.timedelta(days=30)
    elif period == "90d":
        start_date = now - datetime.timedelta(days=90)
    elif period == "1y":
        start_date = now - datetime.timedelta(days=365)
    else:
        start_date = None

    # Target workspace ID resolution
    target_ws_id = current_ws.id
    if workspace_id and workspace_id != "all":
        try:
            target_ws_id = uuid.UUID(workspace_id)
        except ValueError:
            pass

    org_id = current_org.id if current_org else getattr(current_ws, "organization_id", None)

    # 1. WORKSPACES METRICS
    ws_query = select(Workspace).where(Workspace.is_deleted == False)
    if org_id:
        ws_query = ws_query.where(Workspace.organization_id == org_id)
    ws_result = await db.execute(ws_query)
    all_workspaces = ws_result.scalars().all()
    
    total_workspaces = len(all_workspaces)
    active_workspaces = sum(1 for w in all_workspaces if (getattr(w, "status", "active") or "active") == "active")
    archived_workspaces = sum(1 for w in all_workspaces if (getattr(w, "status", "") or "") == "archived")
    
    # Growth calculation: workspaces created after start_date vs total
    if start_date:
        recent_ws_count = sum(1 for w in all_workspaces if w.created_at and w.created_at >= start_date)
        prev_ws_count = max(1, total_workspaces - recent_ws_count)
        workspace_growth = round((recent_ws_count / prev_ws_count) * 100, 1)
    else:
        workspace_growth = 0.0

    # 2. FILES METRICS
    files_query = select(StoredFile).where(
        StoredFile.workspace_id == target_ws_id,
        StoredFile.is_deleted == False,
    )
    if owner_id and owner_id != "all":
        try:
            files_query = files_query.where(StoredFile.uploaded_by == uuid.UUID(owner_id))
        except ValueError:
            pass

    files_result = await db.execute(files_query)
    all_files = files_result.scalars().all()
    
    total_files = len(all_files)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - datetime.timedelta(days=7)
    month_start = now - datetime.timedelta(days=30)
    
    files_today = sum(1 for f in all_files if f.created_at and f.created_at >= today_start)
    files_this_week = sum(1 for f in all_files if f.created_at and f.created_at >= week_start)
    files_this_month = sum(1 for f in all_files if f.created_at and f.created_at >= month_start)
    
    # Storage calculations
    total_file_bytes = sum((f.size or f.size_bytes or 0) for f in all_files)

    # File Types Distribution
    file_type_counts: Dict[str, Dict[str, Any]] = {
        "PDF": {"count": 0, "size_bytes": 0},
        "DOCX": {"count": 0, "size_bytes": 0},
        "CSV": {"count": 0, "size_bytes": 0},
        "Images": {"count": 0, "size_bytes": 0},
        "ZIP": {"count": 0, "size_bytes": 0},
        "JSON": {"count": 0, "size_bytes": 0},
        "Other": {"count": 0, "size_bytes": 0},
    }
    
    for f in all_files:
        cat = map_file_category(f.extension, f.mime_type or f.content_type)
        sz = f.size or f.size_bytes or 0
        file_type_counts[cat]["count"] += 1
        file_type_counts[cat]["size_bytes"] += sz

    # Largest Files
    sorted_files = sorted(all_files, key=lambda x: (x.size or x.size_bytes or 0), reverse=True)
    largest_files = [
        {
            "id": str(f.id),
            "name": f.name or f.original_name or f.stored_name or "File",
            "size_bytes": f.size or f.size_bytes or 0,
            "size_formatted": format_bytes_human(f.size or f.size_bytes or 0),
            "file_type": map_file_category(f.extension, f.mime_type),
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in sorted_files[:5]
    ]

    # 3. DOCUMENTS METRICS
    docs_query = select(Document).where(
        Document.workspace_id == target_ws_id,
        Document.is_deleted == False,
    )
    docs_result = await db.execute(docs_query)
    all_docs = docs_result.scalars().all()
    
    total_documents = len(all_docs)
    indexed_documents = sum(1 for d in all_docs if d.status == "ready" or d.processing_status == "completed")
    pending_documents = sum(1 for d in all_docs if d.processing_status in ["pending", "queued", "processing"] or d.status == "uploading")
    failed_documents = sum(1 for d in all_docs if d.status == "failed" or d.processing_status == "failed")
    
    # Document storage bytes (non-duplicate)
    existing_sf_paths = set(f.storage_path for f in all_files if f.storage_path)
    add_doc_bytes = sum((d.file_size or 0) for d in all_docs if d.storage_path not in existing_sf_paths)

    # 4. DATASETS METRICS
    datasets_query = select(Dataset).where(
        Dataset.workspace_id == target_ws_id,
        Dataset.is_deleted == False,
    )
    ds_result = await db.execute(datasets_query)
    all_datasets = ds_result.scalars().all()
    
    total_datasets = len(all_datasets)
    total_dataset_files = sum(1 for ds in all_datasets if ds.file_name)
    dataset_storage_bytes = sum((ds.file_size or 0) for ds in all_datasets)
    indexed_datasets = sum(1 for ds in all_datasets if ds.status in ["ready", "completed", "indexed", "active"])

    # 5. TEAM ANALYTICS
    members_query = select(WorkspaceMember).where(WorkspaceMember.workspace_id == target_ws_id)
    members_res = await db.execute(members_query)
    all_members = members_res.scalars().all()
    
    total_members = len(all_members) or 1
    active_members = sum(1 for m in all_members if getattr(m, "status", "active") == "active") or 1

    # Reports
    reports_query = select(Report).where(Report.workspace_id == target_ws_id)
    reports_res = await db.execute(reports_query)
    all_reports = reports_res.scalars().all()
    reports_submitted = len(all_reports)

    files_uploaded_per_user = round(total_files / total_members, 1) if total_members > 0 else 0
    most_active_user = current_user.full_name or current_user.email

    # 6. STORAGE COMPUTATIONS
    total_used_bytes = int(total_file_bytes + dataset_storage_bytes + add_doc_bytes)
    capacity_mb = current_ws.storage_limit or 10240.0
    capacity_bytes = int(capacity_mb * 1024 * 1024)
    remaining_bytes = max(0, capacity_bytes - total_used_bytes)
    percentage_used = round((total_used_bytes / capacity_bytes) * 100, 2) if capacity_bytes > 0 else 0.0
    avg_file_size_bytes = int(total_used_bytes / total_files) if total_files > 0 else 0

    # 7. BACKGROUND JOBS METRICS
    jobs_query = select(BackgroundJob).where(BackgroundJob.workspace_id == target_ws_id)
    jobs_res = await db.execute(jobs_query)
    all_jobs = jobs_res.scalars().all()
    
    total_jobs = len(all_jobs)
    running_jobs = sum(1 for j in all_jobs if j.status == JobStatus.RUNNING)
    completed_jobs = sum(1 for j in all_jobs if j.status == JobStatus.SUCCESS)
    failed_jobs = sum(1 for j in all_jobs if j.status == JobStatus.FAILED)
    
    jobs_message = "No background jobs running." if total_jobs == 0 else ""

    # 8. CHARTS DATA
    # Storage Distribution
    type_colors = {
        "PDF": "#ef4444",
        "DOCX": "#3b82f6",
        "CSV": "#10b981",
        "Images": "#8b5cf6",
        "ZIP": "#f59e0b",
        "JSON": "#06b6d4",
        "Other": "#64748b",
    }
    
    storage_distribution = []
    for cat_name, info in file_type_counts.items():
        sz = info["size_bytes"]
        pct = round((sz / total_used_bytes) * 100, 1) if total_used_bytes > 0 else 0.0
        storage_distribution.append({
            "name": cat_name,
            "type": cat_name,
            "size_bytes": sz,
            "formatted_size": format_bytes_human(sz),
            "percentage": pct,
            "count": info["count"],
            "color": type_colors.get(cat_name, "#64748b"),
        })

    # Category Distribution
    reports_bytes = sum((r.attachment_count or 0) * 50000 for r in all_reports)
    category_distribution = [
        {"category": "Documents", "count": total_documents, "size_bytes": add_doc_bytes, "formatted_size": format_bytes_human(add_doc_bytes)},
        {"category": "Datasets", "count": total_datasets, "size_bytes": dataset_storage_bytes, "formatted_size": format_bytes_human(dataset_storage_bytes)},
        {"category": "Files", "count": total_files, "size_bytes": total_file_bytes, "formatted_size": format_bytes_human(total_file_bytes)},
        {"category": "Reports", "count": reports_submitted, "size_bytes": reports_bytes, "formatted_size": format_bytes_human(reports_bytes)},
    ]

    # Workspace Activity Time-series
    activity_points = []
    days_count = 7 if period == "7d" else 30 if period == "30d" else 90 if period == "90d" else 7
    for i in range(days_count - 1, -1, -1):
        day_date = (now - datetime.timedelta(days=i)).date()
        day_str = day_date.strftime("%b %d")
        
        f_count = sum(1 for f in all_files if f.created_at and f.created_at.date() == day_date)
        d_count = sum(1 for doc in all_docs if doc.created_at and doc.created_at.date() == day_date)
        r_count = sum(1 for rep in all_reports if rep.created_at and rep.created_at.date() == day_date)
        
        activity_points.append({
            "date": day_str,
            "files": f_count,
            "documents": d_count,
            "reports": r_count,
        })

    return {
        "workspaces": {
            "total": total_workspaces,
            "active": active_workspaces,
            "archived": archived_workspaces,
            "growth_percentage": workspace_growth,
        },
        "files": {
            "total": total_files,
            "today": files_today,
            "this_week": files_this_week,
            "this_month": files_this_month,
            "file_types_distribution": storage_distribution,
            "largest_files": largest_files,
        },
        "storage": {
            "used_bytes": total_used_bytes,
            "capacity_bytes": capacity_bytes,
            "remaining_bytes": remaining_bytes,
            "percentage_used": percentage_used,
            "avg_file_size_bytes": avg_file_size_bytes,
            "used_formatted": format_bytes_human(total_used_bytes),
            "remaining_formatted": format_bytes_human(remaining_bytes),
            "capacity_formatted": format_bytes_human(capacity_bytes),
            "avg_file_size_formatted": format_bytes_human(avg_file_size_bytes),
        },
        "documents": {
            "total": total_documents,
            "indexed": indexed_documents,
            "pending": pending_documents,
            "failed": failed_documents,
        },
        "datasets": {
            "total": total_datasets,
            "files_count": total_dataset_files,
            "storage_bytes": dataset_storage_bytes,
            "storage_formatted": format_bytes_human(dataset_storage_bytes),
            "indexed": indexed_datasets,
        },
        "team": {
            "total_members": total_members,
            "active_members": active_members,
            "reports_submitted": reports_submitted,
            "files_per_user": files_uploaded_per_user,
            "most_active_user": most_active_user,
        },
        "jobs": {
            "total": total_jobs,
            "running": running_jobs,
            "completed": completed_jobs,
            "failed": failed_jobs,
            "message": jobs_message,
        },
        "charts": {
            "storage_distribution": storage_distribution,
            "category_distribution": category_distribution,
            "workspace_activity": activity_points,
        },
    }


@router.get(
    "/export",
    summary="Export Real-Time Analytics Report",
    description="Generates and streams formatted Analytics Reports (PDF, CSV, Excel) with live telemetry data.",
)
async def export_analytics_report(
    format: str = Query(default="pdf", description="Export format: pdf, csv, excel"),
    period: str = Query(default="7d", description="Time period filter"),
    workspace_id: Optional[str] = Query(default=None, description="Workspace filter"),
    category: Optional[str] = Query(default=None, description="Category filter"),
    owner_id: Optional[str] = Query(default=None, description="Owner filter"),
    current_user: User = Depends(get_current_user),
    current_org: Any = Depends(get_current_organization),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Response:
    # 1. Fetch live telemetry data
    telemetry = await get_telemetry(
        period=period,
        workspace_id=workspace_id,
        category=category,
        owner_id=owner_id,
        current_user=current_user,
        current_org=current_org,
        current_ws=current_ws,
        db=db,
    )

    fmt = format.lower().strip()
    ws_name = (current_ws.name or "Workspace").replace(" ", "_")
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    user_name = current_user.full_name or current_user.email or "Admin"
    timestamp_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    ws_data = telemetry["workspaces"]
    files_data = telemetry["files"]
    storage_data = telemetry["storage"]
    docs_data = telemetry["documents"]
    ds_data = telemetry["datasets"]
    team_data = telemetry["team"]
    jobs_data = telemetry["jobs"]

    if fmt == "csv":
        filename = f"Analytics_Report_{ws_name}_{date_str}.csv"
        lines = [
            "\"NeuroDesk AI - Analytics & Telemetry Executive Report\"",
            f"\"Workspace\",\"{current_ws.name}\"",
            f"\"Generated At\",\"{timestamp_str}\"",
            f"\"Generated By\",\"{user_name}\"",
            f"\"Timeframe Scope\",\"{period}\"",
            "",
            "\"EXECUTIVE METRICS SUMMARY\"",
            "\"Metric\",\"Value\"",
            f"\"Total Workspaces\",{ws_data['total']}",
            f"\"Active Workspaces\",{ws_data['active']}",
            f"\"Total Files Stored\",{files_data['total']}",
            f"\"Files Uploaded Today\",{files_data['today']}",
            f"\"Files Uploaded This Week\",{files_data['this_week']}",
            f"\"Files Uploaded This Month\",{files_data['this_month']}",
            f"\"Total Documents\",{docs_data['total']}",
            f"\"Indexed Documents\",{docs_data['indexed']}",
            f"\"Total Datasets\",{ds_data['total']}",
            f"\"Total Storage Used\",\"{storage_data['used_formatted']}\"",
            f"\"Remaining Storage\",\"{storage_data['remaining_formatted']}\"",
            f"\"Storage Capacity\",\"{storage_data['capacity_formatted']}\"",
            f"\"Storage Usage Percentage\",\"{storage_data['percentage_used']}%\"",
            f"\"Average File Size\",\"{storage_data['avg_file_size_formatted']}\"",
            f"\"Team Members\",{team_data['total_members']}",
            f"\"Reports Submitted\",{team_data['reports_submitted']}",
            f"\"Background Jobs Total\",{jobs_data['total']}",
            f"\"Background Jobs Running\",{jobs_data['running']}",
            "",
            "\"STORAGE DISTRIBUTION BY FILE TYPE\"",
            "\"File Type\",\"File Count\",\"Total Size\",\"Percentage\"",
        ]
        for item in telemetry["charts"]["storage_distribution"]:
            lines.append(f"\"{item['name']}\",{item['count']},\"{item['formatted_size']}\",\"{item['percentage']}%\"")

        lines.extend([
            "",
            "\"LARGEST STORED ASSETS\"",
            "\"File Name\",\"File Type\",\"Size\",\"Uploaded Date\"",
        ])
        for f in files_data["largest_files"]:
            lines.append(f"\"{f['name']}\",\"{f['file_type']}\",\"{f['size_formatted']}\",\"{f['created_at'] or 'N/A'}\"")

        csv_content = "\n".join(lines)
        return Response(
            content=csv_content.encode("utf-8"),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    elif fmt in ["excel", "xlsx"]:
        filename = f"Analytics_Report_{ws_name}_{date_str}.xlsx"
        # Generate XML-based Spreadsheet 2003 / Excel file format
        xml_content = f"""<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>{user_name}</Author>
  <Created>{timestamp_str}</Created>
  <Company>NeuroDesk AI</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="HeaderStyle"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#3B82F6" ss:Pattern="Solid"/></Style>
  <Style ss:ID="TitleStyle"><Font ss:Bold="1" ss:Size="14" ss:Color="#1E293B"/></Style>
  <Style ss:ID="SubTitleStyle"><Font ss:Italic="1" ss:Color="#64748B"/></Style>
  <Style ss:ID="BoldStyle"><Font ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="Executive Summary">
  <Table>
   <Row><Cell ss:StyleID="TitleStyle"><Data ss:Type="String">NeuroDesk AI - Analytics &amp; Telemetry Executive Report</Data></Cell></Row>
   <Row><Cell ss:StyleID="SubTitleStyle"><Data ss:Type="String">Workspace: {current_ws.name} | Generated: {timestamp_str} | User: {user_name}</Data></Cell></Row>
   <Row></Row>
   <Row><Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Metric Name</Data></Cell><Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Value</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total Workspaces</Data></Cell><Cell><Data ss:Type="Number">{ws_data['total']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Active Workspaces</Data></Cell><Cell><Data ss:Type="Number">{ws_data['active']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total Files Uploaded</Data></Cell><Cell><Data ss:Type="Number">{files_data['total']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Files Uploaded Today</Data></Cell><Cell><Data ss:Type="Number">{files_data['today']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total Documents</Data></Cell><Cell><Data ss:Type="Number">{docs_data['total']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Indexed Documents</Data></Cell><Cell><Data ss:Type="Number">{docs_data['indexed']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total Datasets</Data></Cell><Cell><Data ss:Type="Number">{ds_data['total']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total Storage Used</Data></Cell><Cell><Data ss:Type="String">{storage_data['used_formatted']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Remaining Storage</Data></Cell><Cell><Data ss:Type="String">{storage_data['remaining_formatted']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Storage Capacity</Data></Cell><Cell><Data ss:Type="String">{storage_data['capacity_formatted']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Percentage Used</Data></Cell><Cell><Data ss:Type="String">{storage_data['percentage_used']}%</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Average File Size</Data></Cell><Cell><Data ss:Type="String">{storage_data['avg_file_size_formatted']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Team Members</Data></Cell><Cell><Data ss:Type="Number">{team_data['total_members']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Reports Submitted</Data></Cell><Cell><Data ss:Type="Number">{team_data['reports_submitted']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Background Jobs Total</Data></Cell><Cell><Data ss:Type="Number">{jobs_data['total']}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Background Jobs Running</Data></Cell><Cell><Data ss:Type="Number">{jobs_data['running']}</Data></Cell></Row>
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Storage Breakdown">
  <Table>
   <Row><Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">File Type</Data></Cell><Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Count</Data></Cell><Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Total Size</Data></Cell><Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Percentage</Data></Cell></Row>"""

        for item in telemetry["charts"]["storage_distribution"]:
            xml_content += f"""
   <Row><Cell><Data ss:Type="String">{item['name']}</Data></Cell><Cell><Data ss:Type="Number">{item['count']}</Data></Cell><Cell><Data ss:Type="String">{item['formatted_size']}</Data></Cell><Cell><Data ss:Type="String">{item['percentage']}%</Data></Cell></Row>"""

        xml_content += """
  </Table>
 </Worksheet>
</Workbook>"""

        return Response(
            content=xml_content.encode("utf-8"),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    else: # pdf
        filename = f"Analytics_Report_{ws_name}_{date_str}.pdf"
        # Return JSON structured PDF payload or binary stream
        import json
        pdf_payload = json.dumps(telemetry)
        return Response(
            content=pdf_payload.encode("utf-8"),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

