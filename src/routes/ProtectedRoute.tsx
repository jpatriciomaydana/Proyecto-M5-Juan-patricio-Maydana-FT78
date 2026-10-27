import type { JSX } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuthContext } from "../hooks/useAuthContext";

function ProtectedRoute(): JSX.Element {
    const { user, loading } = useAuthContext();

    if (loading) {
        return <p>Cargando...</p>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;