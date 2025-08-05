
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ServiceForm from './ServiceForm';

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ServiceDialog: React.FC<ServiceDialogProps> = ({
  open,
  onOpenChange,
  service,
  onSuccess,
  onCancel
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Edit Service' : 'Create New Service'}
          </DialogTitle>
        </DialogHeader>
        <ServiceForm
          service={service}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDialog;
