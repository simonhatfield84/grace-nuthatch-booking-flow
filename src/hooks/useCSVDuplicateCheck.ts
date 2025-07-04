
import { useState } from "react";
import { DuplicateGuest } from "@/types/guest";
import { useGuestDuplicates } from "./useGuestDuplicates";

export const useCSVDuplicateCheck = () => {
  const [duplicates, setDuplicates] = useState<Array<{ newGuest: any; existingGuests: DuplicateGuest[] }>>([]);
  const { findDuplicates } = useGuestDuplicates();

  const checkForDuplicates = async (guests: any[]) => {
    const duplicateGroups: Array<{ newGuest: any; existingGuests: DuplicateGuest[] }> = [];
    
    for (const guest of guests) {
      if (guest.email || guest.phone) {
        try {
          const existingGuests = await findDuplicates({
            email: guest.email,
            phone: guest.phone
          });
          
          if (existingGuests.length > 0) {
            duplicateGroups.push({
              newGuest: guest,
              existingGuests
            });
          }
        } catch (error) {
          console.error('Error checking for duplicates:', error);
        }
      }
    }
    
    setDuplicates(duplicateGroups);
    return duplicateGroups;
  };

  const resetDuplicates = () => {
    setDuplicates([]);
  };

  return {
    duplicates,
    checkForDuplicates,
    resetDuplicates
  };
};
