from fastapi import FastAPI
from common.db.db import Base, engine
from user_service.routes.user_routes import router 
#from app.ipservices import routes as ip_routes  # placeholder for ML/IP services

app = FastAPI(title="Sentinel AI Backend")

@app.get("/")
def test():
    return {'message': 'hey bro'}

# Create tables
Base.metadata.create_all(bind=engine)


# Register routers
app.include_router(router)
#app.include_router(ip_routes.router)