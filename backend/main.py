from fastapi import FastAPI
from common.db.db import Base, engine
from user_service.routes.user_routes import router as user_router
from ip_service.routes import ip_routes  # import your IP routes module

app = FastAPI(title="Sentinel AI Backend")

@app.get("/")
def test():
    return {"message": "hey bro"}

# Create tables
Base.metadata.create_all(bind=engine)

# Register routers
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(ip_routes.router, prefix="/ip", tags=["Image Protection"])