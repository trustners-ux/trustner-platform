"""NAV router — proxy to mfapi.in with 4-hour caching."""

import time
from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

# In-memory NAV cache: {scheme_code: {"data": {...}, "cached_at": timestamp}}
_NAV_CACHE = {}
CACHE_TTL = 4 * 60 * 60  # 4 hours in seconds
MFAPI_BASE = "https://api.mfapi.in/mf"


@router.get("/nav/{scheme_code}")
async def get_nav(scheme_code: str):
    """
    Fetch live NAV from mfapi.in for a given scheme code.
    Cached for 4 hours to avoid rate limiting.
    """
    now = time.time()

    # Check cache
    if scheme_code in _NAV_CACHE:
        entry = _NAV_CACHE[scheme_code]
        if now - entry["cached_at"] < CACHE_TTL:
            return entry["data"]

    # Fetch from mfapi.in
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{MFAPI_BASE}/{scheme_code}")

        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Scheme not found")

        raw = response.json()
        meta = raw.get("meta", {})
        data_points = raw.get("data", [])

        # Latest NAV (first entry in data array)
        latest = data_points[0] if data_points else {}

        result = {
            "scheme_code": scheme_code,
            "scheme_name": meta.get("scheme_name", ""),
            "nav": float(latest.get("nav", "0")),
            "date": latest.get("date", ""),
            "fund_house": meta.get("fund_house", ""),
            "scheme_type": meta.get("scheme_type", ""),
            "scheme_category": meta.get("scheme_category", ""),
        }

        # Cache it
        _NAV_CACHE[scheme_code] = {"data": result, "cached_at": now}

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch NAV: {str(e)}")


@router.get("/nav/search/{query}")
async def search_funds(query: str):
    """Search for mutual fund schemes by name."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{MFAPI_BASE}/search", params={"q": query})

        if response.status_code != 200:
            return {"results": []}

        results = response.json()
        # mfapi.in returns a list of {schemeCode, schemeName}
        return {"results": results[:20]}  # Limit to 20 results

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Search failed: {str(e)}")


@router.get("/nav/{scheme_code}/history")
async def get_nav_history(scheme_code: str, days: int = 30):
    """Get historical NAV data for charting."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{MFAPI_BASE}/{scheme_code}")

        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Scheme not found")

        raw = response.json()
        data_points = raw.get("data", [])

        # Return last N days of data
        history = []
        for point in data_points[:days]:
            history.append({
                "date": point.get("date", ""),
                "nav": float(point.get("nav", "0")),
            })

        return {
            "scheme_code": scheme_code,
            "scheme_name": raw.get("meta", {}).get("scheme_name", ""),
            "history": history,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch history: {str(e)}")
