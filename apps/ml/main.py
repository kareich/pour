from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="Pour ML Service", version="0.1.0")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/recommend")
async def recommend():
    # Phase 2: taste-profile-based spirit recommendations
    return JSONResponse({"spirits": []}, status_code=501)


@app.post("/label/parse")
async def label_parse():
    # Phase 2: OCR-based label parsing from bottle images
    return JSONResponse({"spirit": None}, status_code=501)
