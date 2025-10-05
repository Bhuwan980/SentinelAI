# main.py

from fastapi import FastAPI
from common.db.db import Base, engine
from user_service.routes.user_routes import router as user_router
from ip_service.routes.ip_routes import ip_router
from ip_service.routes.notification import notification_router

app = FastAPI(title="Sentinel AI Backend")

from fastapi.security import HTTPBearer


bearer_scheme = HTTPBearer()
@app.get("/")
def test():
    return {"message": "hey bro"}


# Create tables
Base.metadata.create_all(bind=engine)

# Register routers
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(ip_router, prefix="/ip", tags=["Image Protection"])
app.include_router(notification_router, prefix="/notification", tags=["Notification"])