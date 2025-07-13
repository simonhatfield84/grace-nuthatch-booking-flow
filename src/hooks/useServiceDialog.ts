
import { useState, useEffect } from 'react';

export const useServiceDialog = (editingService: any, newService: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minGuests, setMinGuests] = useState(1);
  const [maxGuests, setMaxGuests] = useState(8);
  const [leadTimeHours, setLeadTimeHours] = useState(2);
  const [cancellationWindowHours, setCancellationWindowHours] = useState(24);
  const [onlineBookable, setOnlineBookable] = useState(true);
  const [active, setActive] = useState(true);
  const [isSecret, setIsSecret] = useState(false);
  const [secretSlug, setSecretSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [durationRules, setDurationRules] = useState([]);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [paymentSettings, setPaymentSettings] = useState({
    requires_payment: false,
    charge_type: 'none' as 'none' | 'all_reservations' | 'large_groups',
    minimum_guests_for_charge: 8,
    charge_amount_per_guest: 0, // Store in pence
  });

  // Initialize form data when editing or creating
  useEffect(() => {
    const serviceData = editingService || newService;
    if (serviceData) {
      console.log('Initializing service dialog with:', serviceData);
      
      setTitle(serviceData.title || '');
      setDescription(serviceData.description || '');
      setMinGuests(serviceData.min_guests || 1);
      setMaxGuests(serviceData.max_guests || 8);
      setLeadTimeHours(serviceData.lead_time_hours || 2);
      setCancellationWindowHours(serviceData.cancellation_window_hours || 24);
      setOnlineBookable(serviceData.online_bookable !== false);
      setActive(serviceData.active !== false);
      setIsSecret(serviceData.is_secret || false);
      setSecretSlug(serviceData.secret_slug || '');
      setImageUrl(serviceData.image_url || '');
      setSelectedTags(serviceData.tag_ids || []);
      setDurationRules(serviceData.duration_rules || []);
      setTermsAndConditions(serviceData.terms_and_conditions || '');
      
      // Initialize payment settings with proper defaults
      setPaymentSettings({
        requires_payment: serviceData.requires_payment || false,
        charge_type: serviceData.charge_type || 'none',
        minimum_guests_for_charge: serviceData.minimum_guests_for_charge || 8,
        charge_amount_per_guest: serviceData.charge_amount_per_guest || 0,
      });
    }
  }, [editingService, newService]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const getServiceData = () => {
    const data = {
      title,
      description,
      min_guests: minGuests,
      max_guests: maxGuests,
      lead_time_hours: leadTimeHours,
      cancellation_window_hours: cancellationWindowHours,
      online_bookable: onlineBookable,
      active,
      is_secret: isSecret,
      secret_slug: isSecret ? secretSlug : null,
      image_url: imageUrl || null,
      tag_ids: selectedTags,
      duration_rules: durationRules,
      terms_and_conditions: termsAndConditions,
      // Payment settings
      requires_payment: paymentSettings.requires_payment,
      charge_type: paymentSettings.charge_type,
      minimum_guests_for_charge: paymentSettings.charge_type === 'large_groups' 
        ? paymentSettings.minimum_guests_for_charge 
        : null,
      charge_amount_per_guest: paymentSettings.requires_payment 
        ? paymentSettings.charge_amount_per_guest 
        : 0,
    };
    
    console.log('Generated service data:', data);
    return data;
  };

  return {
    title, setTitle,
    description, setDescription,
    minGuests, setMinGuests,
    maxGuests, setMaxGuests,
    leadTimeHours, setLeadTimeHours,
    cancellationWindowHours, setCancellationWindowHours,
    onlineBookable, setOnlineBookable,
    active, setActive,
    isSecret, setIsSecret,
    secretSlug, setSecretSlug,
    imageUrl, setImageUrl,
    selectedTags,
    durationRules, setDurationRules,
    termsAndConditions, setTermsAndConditions,
    paymentSettings, setPaymentSettings,
    getServiceData,
    handleTagToggle,
  };
};
