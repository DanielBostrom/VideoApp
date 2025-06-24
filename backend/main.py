from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import uuid
import subprocess

app = FastAPI()

# Tillåt frontend att kommunicera (byt till din domän vid deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/cut")
async def cut_video(
    file: UploadFile = File(...),
    timestamps: str = Form(...)
):
    if not file.filename.lower().endswith((".mp4", ".mov", ".mkv")):
        raise HTTPException(status_code=400, detail="Only video files are supported.")

    input_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"{input_id}_{file.filename}")
    with open(input_path, "wb") as f:
        f.write(await file.read())

    segments = timestamps.split(",")
    output_files = []

    for idx, segment in enumerate(segments):
        try:
            start, end = segment.strip().split("-")
            output_name = f"{input_id}_short_{idx+1}.mp4"
            output_path = os.path.join(TEMP_DIR, output_name)

            command = [
                "ffmpeg", "-y",
                "-i", input_path,
                "-ss", start.strip(),
                "-to", end.strip(),
                "-c", "copy",
                output_path
            ]
            subprocess.run(command, check=True)
            output_files.append(output_name)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error cutting segment {segment}: {e}")

    return {"clips": output_files}


@app.get("/download/{filename}")
async def download_clip(filename: str):
    file_path = os.path.join(TEMP_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Clip not found.")
    return FileResponse(file_path, media_type="video/mp4", filename=filename)
