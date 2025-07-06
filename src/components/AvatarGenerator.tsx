
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const AvatarGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');

  const generateAvatar = async (character: 'simon' | 'fred') => {
    try {
      setIsGenerating(true);
      setStatus(`Generating ${character}'s avatar...`);
      
      const { data, error } = await supabase.functions.invoke('generate-avatars', {
        body: { character }
      });

      if (error) throw error;

      // Convert base64 to blob and download
      const imageData = data.imageBase64;
      const byteCharacters = atob(imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${character}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus(`${character}'s avatar generated and downloaded!`);
    } catch (error) {
      console.error('Error generating avatar:', error);
      setStatus(`Error generating ${character}'s avatar: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBothAvatars = async () => {
    await generateAvatar('simon');
    await generateAvatar('fred');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md">
      <h3 className="text-lg font-semibold mb-4">Generate Avatars</h3>
      <div className="space-y-3">
        <Button 
          onClick={() => generateAvatar('simon')} 
          disabled={isGenerating}
          className="w-full"
        >
          Generate Simon's Avatar
        </Button>
        <Button 
          onClick={() => generateAvatar('fred')} 
          disabled={isGenerating}
          className="w-full"
        >
          Generate Fred's Avatar
        </Button>
        <Button 
          onClick={generateBothAvatars} 
          disabled={isGenerating}
          variant="outline"
          className="w-full"
        >
          Generate Both Avatars
        </Button>
      </div>
      {status && (
        <p className="mt-4 text-sm text-gray-600">{status}</p>
      )}
      <p className="mt-4 text-xs text-gray-500">
        Generated images will be downloaded to your computer. 
        Save them as simon.png and fred.png in your public folder.
      </p>
    </div>
  );
};

export default AvatarGenerator;
