
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ServiceForm } from './ServiceForm';
import { ServiceFormData } from '@/hooks/useServicesData';

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ServiceFormData;
  onFormDataChange: (updates: Partial<ServiceFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

const ServiceDialog: React.FC<ServiceDialogProps> = ({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Service' : 'Create New Service'}
          </DialogTitle>
        </DialogHeader>
        <ServiceForm
          formData={formData}
          onFormDataChange={onFormDataChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDialog;
