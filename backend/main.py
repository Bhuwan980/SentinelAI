# main.py

from fastapi import FastAPI
from common.db.db import Base, engine
from user_service.routes.user_routes import router as user_router
from ip_service.routes.ip_routes import ip_router
from ip_service.routes.notification import notification_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sentinel AI Backend")

from fastapi.security import HTTPBearer

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


bearer_scheme = HTTPBearer()
@app.get("/")
def test():
    return {"message": "hey bro"}


# Create tables
Base.metadata.create_all(bind=engine)

# Register routers
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(ip_router, prefix="/ip", tags=["Image Protection"])
app.include_router(notification_router, prefix="/notifications", tags=["Notification"])