
import { useEffect } from "react";
import { useUpdatePlatformSettingsV2 } from "@/hooks/usePlatformSettingsV2";

export const InitializeDomainSettings = () => {
  const updateSettings = useUpdatePlatformSettingsV2();

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        await updateSettings.mutateAsync({
          app_domain: "https://grace-os.co.uk",
          from_email: "nuthatch@grace-os.co.uk",
          from_name: "The Nuthatch",
          email_signature: "Best regards,\nThe Nuthatch Team"
        });
        console.log('✅ Platform settings updated with production domain');
      } catch (error) {
        console.error('❌ Failed to update platform settings:', error);
      }
    };

    initializeSettings();
  }, [updateSettings]);

  return null;
};
