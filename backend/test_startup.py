#!/usr/bin/env python3
import os
import sys

print("🧪 Testing basic startup...")

# Check if we're in the right directory
print(f"Current directory: {os.getcwd()}")
print(f"Files in current directory: {os.listdir('.')}")

# Try basic imports
try:
    import fastapi
    print("✅ FastAPI works")
except Exception as e:
    print(f"❌ FastAPI failed: {e}")

try:
    import uvicorn
    print("✅ Uvicorn works")
except Exception as e:
    print(f"❌ Uvicorn failed: {e}")

try:
    from decouple import config
    print("✅ python-decouple works")
except Exception as e:
    print(f"❌ python-decouple failed: {e}")

# Check environment
print(f"\nEnvironment variables:")
for key in ['DATABASE_URL', 'SECRET_KEY', 'HOST', 'PORT']:
    value = os.getenv(key)
    if value:
        print(f"  {key}: {'*' * len(value)}")
    else:
        print(f"  {key}: NOT SET")

print("\n✅ Basic startup test completed") 