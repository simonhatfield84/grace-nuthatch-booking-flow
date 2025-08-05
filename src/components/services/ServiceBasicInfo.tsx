
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ServiceFormData } from '@/hooks/useServicesData';
import { MediaUpload } from './MediaUpload';

interface ServiceBasicInfoProps {
  formData: ServiceFormData;
  onFormDataChange: (updates: Partial<ServiceFormData>) => void;
}

export const ServiceBasicInfo: React.FC<ServiceBasicInfoProps> = ({
  formData,
  onFormDataChange
}) => {
  const handleImageChange = (url: string) => {
    onFormDataChange({ image_url: url });
  };

  const handleImageRemove = () => {
    onFormDataChange({ image_url: '' });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Service Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onFormDataChange({ title: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormDataChange({ description: e.target.value })}
          rows={4}
        />
      </div>

      <MediaUpload
        imageUrl={formData.image_url}
        onImageChange={handleImageChange}
        onRemove={handleImageRemove}
      />
    </div>
  );
};
