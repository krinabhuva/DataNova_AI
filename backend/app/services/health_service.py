from app.database.session import check_database_connection


def get_health_status() -> dict[str, str]:
    is_connected, message = check_database_connection()
    return {
        "status": "ok" if is_connected else "degraded",
        "database": "connected" if is_connected else "unavailable",
        "message": "Service is healthy" if is_connected else f"Database unavailable: {message}",
    }
