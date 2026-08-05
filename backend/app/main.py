from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.routes import auth, projects, gcode, tools, materials, ai_assistant, cam

app = FastAPI(
    title="MachineAI",
    description="Intelligent CNC Manufacturing Analysis Platform",
    version="0.1.0",
    docs_url=None
)

DARK_SWAGGER_CSS = """
<style>
body { background-color: #0f1117 !important; }
.swagger-ui { background-color: #0f1117 !important; }
.swagger-ui .topbar { display: none; }

.swagger-ui .info .title,
.swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3,
.swagger-ui .opblock-tag,
.swagger-ui .opblock .opblock-summary-operation-id,
.swagger-ui .opblock .opblock-summary-path,
.swagger-ui .opblock .opblock-summary-description,
.swagger-ui table thead tr th,
.swagger-ui .parameter__name,
.swagger-ui .parameter__type,
.swagger-ui .response-col_status,
.swagger-ui .response-col_description,
.swagger-ui label,
.swagger-ui .btn,
.swagger-ui .tab li,
.swagger-ui .opblock-description-wrapper p,
.swagger-ui .opblock-title_normal p,
.swagger-ui .model-title,
.swagger-ui .model,
.swagger-ui section.models h4,
.swagger-ui .scheme-container .schemes > label {
  color: #e0e0e0 !important;
}

.swagger-ui .info .base-url,
.swagger-ui .info li, .swagger-ui .info p, .swagger-ui .info a {
  color: #888 !important;
}

.swagger-ui .scheme-container {
  background-color: #0f1117 !important;
  box-shadow: none !important;
}

.swagger-ui .opblock {
  background-color: #1e2130 !important;
  border-color: #2e3250 !important;
}

.swagger-ui .opblock .opblock-summary {
  border-color: #2e3250 !important;
}

.swagger-ui .opblock-body {
  background-color: #1e2130 !important;
}

.swagger-ui .opblock.opblock-post {
  background-color: #16241e !important;
  border-color: #1f4d3a !important;
}
.swagger-ui .opblock.opblock-post .opblock-summary {
  border-color: #1f4d3a !important;
}

.swagger-ui .opblock.opblock-get {
  background-color: #16202f !important;
  border-color: #1f3a5c !important;
}
.swagger-ui .opblock.opblock-get .opblock-summary {
  border-color: #1f3a5c !important;
}

.swagger-ui .opblock.opblock-delete {
  background-color: #2a1a1f !important;
  border-color: #5c1f2e !important;
}
.swagger-ui .opblock.opblock-delete .opblock-summary {
  border-color: #5c1f2e !important;
}

.swagger-ui .btn, .swagger-ui select, .swagger-ui input[type=text], .swagger-ui input[type=password], .swagger-ui textarea {
  background-color: #0f1117 !important;
  border-color: #2e3250 !important;
  color: #e0e0e0 !important;
}

.swagger-ui .btn.authorize {
  background-color: #3a3f6b !important;
  border-color: #3a3f6b !important;
  color: #fff !important;
}
.swagger-ui .btn.authorize svg { fill: #fff !important; }

.swagger-ui .btn.execute {
  background-color: #3a3f6b !important;
  border-color: #3a3f6b !important;
  color: #fff !important;
}

.swagger-ui table, .swagger-ui table tr, .swagger-ui table td, .swagger-ui table th {
  background-color: transparent !important;
  border-color: #2e3250 !important;
}

.swagger-ui .model-box, .swagger-ui section.models, .swagger-ui section.models.is-open h4 {
  background-color: #1e2130 !important;
  border-color: #2e3250 !important;
}

.swagger-ui .dialog-ux .modal-ux {
  background-color: #1e2130 !important;
  border-color: #2e3250 !important;
}
.swagger-ui .dialog-ux .modal-ux-header h3 {
  color: #e0e0e0 !important;
}
.swagger-ui .dialog-ux .modal-ux-content p,
.swagger-ui .dialog-ux .modal-ux-content label {
  color: #e0e0e0 !important;
}

.swagger-ui .microlight, .swagger-ui pre {
  background-color: #0f1117 !important;
  color: #e0e0e0 !important;
}

.swagger-ui .response-col_status { color: #e0e0e0 !important; }
.swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 { color: #e0e0e0 !important; }

.swagger-ui svg { fill: #888 !important; }

.swagger-ui section.models .model-container {
  background-color: transparent !important;
}
.swagger-ui section.models .model-box {
  background-color: transparent !important;
}
.swagger-ui .model-title__text {
  color: #e0e0e0 !important;
}

.swagger-ui section.models * {
  background: transparent !important;
  background-color: transparent !important;
}
.swagger-ui section.models .model-toggle {
  color: #888 !important;
}
</style>
"""

@app.get("/docs", include_in_schema=False)
def custom_swagger_ui_html():
    html = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Docs"
    ).body.decode("utf-8")
    html = html.replace("</head>", DARK_SWAGGER_CSS + "</head>")
    return HTMLResponse(html)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(gcode.router)
app.include_router(tools.router)
app.include_router(materials.router)
app.include_router(ai_assistant.router)
app.include_router(cam.router)

@app.get("/")
def root():
    return {"message": "MachineAI API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}