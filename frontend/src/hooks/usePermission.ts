import { useState, useEffect } from 'react';
import axios from 'axios';

// Assuming you have a way to get the token, e.g. from localStorage or context
const getToken = () => localStorage.getItem('token') || localStorage.getItem('admin_token');

export function usePermission() {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const token = getToken();
                if (!token) {
                    setLoading(false);
                    return;
                }

                // In a real app, you might cache this in Context or Redux
                // to avoid fetching on every hook usage.
                // For now, simple fetch.
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await axios.get(`${apiUrl}/api/users/me/permissions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setPermissions(res.data);
            } catch (err) {
                console.error("Failed to fetch permissions", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    const can = (permissionSlug: string) => {
        if (loading) return false; // Default to false while loading

        // Exact match
        if (permissions.includes(permissionSlug)) return true;

        // Hierarchy match by prefix
        // If user has "document", they implicitly have "document.view"
        // Check if any user permission is a prefix of permissionSlug
        return permissions.some(p => {
            // Check if 'p' is a parent. 
            // e.g. p="document" matches slug="document.view"
            // e.g. p="document.view" matches slug="document.view"
            if (permissionSlug === p) return true;
            if (permissionSlug.startsWith(p + '.')) return true;
            return false;
        });
    };

    return { can, loading, permissions };
}
