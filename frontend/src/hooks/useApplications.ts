import { useState, useEffect, useCallback } from "react";
import {getApplication,createApplication,updateApplicationStatus} from "../services/api";
import type { Application } from "../types";

export const useApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getApplication();
      setApplications(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const addApplication = useCallback(async (newApp: Partial<Application>) => {
    try {
      const created = await createApplication(newApp);

      setApplications(prev => [created, ...prev]);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      await updateApplicationStatus(id, status);

      setApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status } : app
        )
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    addApplication,
    updateStatus,
  };
};