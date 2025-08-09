
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ScanResult {
  documents: number;
  logs: number;
  errors: string[];
  scannedPaths: string[];
}

async function calculateSHA(content: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function scanProjectFiles(): Promise<ScanResult> {
  const result: ScanResult = {
    documents: 0,
    logs: 0,
    errors: [],
    scannedPaths: []
  };

  const scanPatterns = [
    'src/**/*.md',
    'src/**/*.json',
    'src/**/*.log',
    'supabase/**/*.md',
    'supabase/**/*.sql',
    'README.md',
    'package.json'
  ];

  try {
    // Simulate file system scanning (in real implementation would use Deno.readDir)
    const mockFiles = [
      { path: 'README.md', content: '# Grace Platform\nModern hospitality management', type: 'doc' },
      { path: 'src/platform/docs/README.md', content: '# Platform Documentation', type: 'doc' },
      { path: 'package.json', content: JSON.stringify({ name: 'grace', version: '1.0.0' }), type: 'doc' },
    ];

    for (const file of mockFiles) {
      try {
        const sha = await calculateSHA(file.content);
        
        // Check if file already exists with same SHA
        const { data: existing } = await supabase
          .from('platform_documents')
          .select('id')
          .eq('path', file.path)
          .eq('sha', sha)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('platform_documents')
            .insert({
              title: file.path.split('/').pop() || file.path,
              path: file.path,
              type: file.type,
              content_md: file.content,
              sha,
              file_size: file.content.length,
              last_modified: new Date().toISOString()
            });

          if (error) {
            result.errors.push(`Error inserting ${file.path}: ${error.message}`);
          } else {
            result.documents++;
          }
        }

        result.scannedPaths.push(file.path);
      } catch (error) {
        result.errors.push(`Error processing ${file.path}: ${error.message}`);
      }
    }

    // Log the scan completion
    await supabase
      .from('platform_logs')
      .insert({
        type: 'scan_complete',
        content_text: `Scanned ${result.scannedPaths.length} files, added ${result.documents} documents`,
        metadata: {
          scan_patterns: scanPatterns,
          files_scanned: result.scannedPaths.length,
          documents_added: result.documents,
          errors_count: result.errors.length
        },
        severity: result.errors.length > 0 ? 'warning' : 'info'
      });

  } catch (error) {
    result.errors.push(`Scan failed: ${error.message}`);
    
    await supabase
      .from('platform_logs')
      .insert({
        type: 'scan_error',
        content_text: `Scan failed: ${error.message}`,
        severity: 'error',
        error_details: { error: error.message }
      });
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting platform artifacts ingestion...');
    
    const result = await scanProjectFiles();
    
    console.log(`Ingestion complete. Documents: ${result.documents}, Errors: ${result.errors.length}`);
    
    return new Response(JSON.stringify({
      success: true,
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ingestion failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
