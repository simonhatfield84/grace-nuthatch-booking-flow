import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceBasicInfo } from './ServiceBasicInfo';
import { ServiceBookingSettings } from './ServiceBookingSettings';
import { ServiceAdvancedSettings } from './ServiceAdvancedSettings';
import { ServicePaymentSettings } from './ServicePaymentSettings';
import { useCreateService, useUpdateService } from '@/hooks/useServices';
import { useServiceTags } from '@/hooks/useServiceTags';
import { Service, ServiceFormData } from '@/hooks/useServicesData';

interface ServiceFormProps {
  service?: Service;
  onSuccess: () => void;
  onCancel: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  onSuccess,
  onCancel
}) => {
  return (
    <div>Service Form</div>
  );
};

export default ServiceForm;
