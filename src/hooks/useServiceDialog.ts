
import { useState, useEffect } from 'react';

interface PaymentSettings {
  requires_payment: boolean;
  charge_type: 'all_reservations' | 'large_groups';
  minimum_guests_for_charge: number;
  charge_amount_per_guest: number;
}

export const useServiceDialog = (editingService?: any, newService?: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minGuests, setMinGuests] = useState(1);
  const [maxGuests, setMaxGuests] = useState(10);
  const [leadTimeHours, setLeadTimeHours] = useState(24);
  const [cancellationWindowHours, setCancellationWindowHours] = useState(24);
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [depositPerGuest, setDepositPerGuest] = useState(0);
  const [onlineBookable, setOnlineBookable] = useState(true);
  const [active, setActive] = useState(true);
  const [isSecret, setIsSecret] = useState(false);
  const [secretSlug, setSecretSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [durationRules, setDurationRules] = useState([]);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    requires_payment: false,
    charge_type: 'all_reservations',
    minimum_guests_for_charge: 8,
    charge_amount_per_guest: 0,
  });

  useEffect(() => {
    const service = editingService || newService;
    if (service) {
      setTitle(service.title || '');
      setDescription(service.description || '');
      setMinGuests(service.min_guests || 1);
      setMaxGuests(service.max_guests || 10);
      setLeadTimeHours(service.lead_time_hours || 24);
      setCancellationWindowHours(service.cancellation_window_hours || 24);
      setRequiresDeposit(service.requires_deposit || false);
      setDepositPerGuest(service.deposit_per_guest || 0);
      setOnlineBookable(service.online_bookable ?? true);
      setActive(service.active ?? true);
      setIsSecret(service.is_secret || false);
      setSecretSlug(service.secret_slug || '');
      setImageUrl(service.image_url || '');
      setSelectedTags(service.tag_ids || []);
      setDurationRules(service.duration_rules || []);
      setTermsAndConditions(service.terms_and_conditions || '');
      
      setPaymentSettings({
        requires_payment: service.requires_payment || false,
        charge_type: service.charge_type || 'all_reservations',
        minimum_guests_for_charge: service.minimum_guests_for_charge || 8,
        charge_amount_per_guest: service.charge_amount_per_guest || 0,
      });
    }
  }, [editingService, newService]);

  const getServiceData = () => ({
    id: editingService?.id,
    title: title.trim(),
    description: description.trim() || null,
    min_guests: minGuests,
    max_guests: maxGuests,
    lead_time_hours: leadTimeHours,
    cancellation_window_hours: cancellationWindowHours,
    requires_deposit: requiresDeposit,
    deposit_per_guest: requiresDeposit ? depositPerGuest : 0,
    online_bookable: onlineBookable,
    active,
    is_secret: isSecret,
    secret_slug: isSecret ? secretSlug : null,
    image_url: imageUrl,
    tag_ids: selectedTags,
    duration_rules: durationRules,
    terms_and_conditions: termsAndConditions,
    requires_payment: paymentSettings.requires_payment,
    charge_type: paymentSettings.requires_payment ? paymentSettings.charge_type : 'none',
    minimum_guests_for_charge: paymentSettings.minimum_guests_for_charge,
    charge_amount_per_guest: paymentSettings.charge_amount_per_guest,
  });

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prevSelected) =>
      prevSelected.includes(tagId)
        ? prevSelected.filter((id) => id !== tagId)
        : [...prevSelected, tagId]
    );
  };

  return {
    // State
    title, setTitle,
    description, setDescription,
    minGuests, setMinGuests,
    maxGuests, setMaxGuests,
    leadTimeHours, setLeadTimeHours,
    cancellationWindowHours, setCancellationWindowHours,
    requiresDeposit, setRequiresDeposit,
    depositPerGuest, setDepositPerGuest,
    onlineBookable, setOnlineBookable,
    active, setActive,
    isSecret, setIsSecret,
    secretSlug, setSecretSlug,
    imageUrl, setImageUrl,
    selectedTags, setSelectedTags,
    durationRules, setDurationRules,
    termsAndConditions, setTermsAndConditions,
    paymentSettings, setPaymentSettings,
    
    // Methods
    getServiceData,
    handleTagToggle,
  };
};
