#!/bin/bash

# Render 배포용 시작 스크립트
cd /opt/render/project/src/backend
uvicorn src.main:app --host 0.0.0.0 --port $PORT
