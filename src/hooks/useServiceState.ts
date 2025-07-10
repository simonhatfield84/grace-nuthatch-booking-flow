
import { useState } from "react";
import { SERVICE_DEFAULTS } from "@/constants/serviceDefaults";

export const useServiceState = () => {
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState(SERVICE_DEFAULTS);

  const resetForm = () => {
    setNewService(SERVICE_DEFAULTS);
    setEditingService(null);
  };

  return {
    editingService,
    setEditingService,
    newService,
    setNewService,
    resetForm,
  };
};
