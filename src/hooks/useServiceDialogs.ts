
import { useState } from "react";

export const useServiceDialogs = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [managingWindowsServiceId, setManagingWindowsServiceId] = useState(null);

  const handleManageWindows = (serviceId) => {
    setManagingWindowsServiceId(serviceId);
  };

  const closeWindowsManager = () => {
    setManagingWindowsServiceId(null);
  };

  return {
    showDialog,
    setShowDialog,
    managingWindowsServiceId,
    handleManageWindows,
    closeWindowsManager
  };
};
