
import React, { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * HostLayoutPreview - A preview component to test Host layout styling
 * This helps catch styling regressions by showing the exact Host interface layout
 */
export function HostLayoutPreview() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="dark host-app flex h-screen bg-host-blackest-dark text-white">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        showUserProfile={true}
        isHostMode={true}
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <main className="flex-1 overflow-auto p-4 bg-host-blackest-dark text-white">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">Host Interface Preview</h1>
              <Button 
                variant="outline" 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="bg-host-dark-gray border-host-mid-gray text-white hover:bg-host-mid-gray"
              >
                Toggle Sidebar
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-host-dark-gray border-host-mid-gray">
                <CardHeader>
                  <CardTitle className="text-white">Sample Host Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-host-mid-gray">
                    This preview shows how the Host interface should look with:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-host-mid-gray space-y-1">
                    <li>Dark background (host-blackest-dark)</li>
                    <li>Dark grey cards (host-dark-gray)</li>
                    <li>White text</li>
                    <li>Collapsed sidebar by default</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="bg-host-dark-gray border-host-mid-gray">
                <CardHeader>
                  <CardTitle className="text-white">Color Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 bg-host-blackest-dark rounded text-xs">host-blackest-dark</div>
                  <div className="p-2 bg-host-dark-gray rounded text-xs">host-dark-gray</div>
                  <div className="p-2 bg-host-mid-gray rounded text-xs">host-mid-gray</div>
                  <div className="p-2 bg-white text-black rounded text-xs">white text</div>
                </CardContent>
              </Card>
              
              <Card className="bg-host-dark-gray border-host-mid-gray">
                <CardHeader>
                  <CardTitle className="text-white">Layout Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-host-mid-gray text-sm">
                    Sidebar should be {sidebarCollapsed ? 'collapsed (64px)' : 'expanded (256px)'} with smooth transitions.
                  </p>
                  <p className="text-host-mid-gray text-sm mt-2">
                    Main content should adjust margin accordingly.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-host-dark-gray p-4 rounded-lg border border-host-mid-gray">
              <h3 className="text-white font-semibold mb-2">Regression Guard Checklist</h3>
              <div className="text-host-mid-gray text-sm space-y-1">
                <div>✓ Background: host-blackest-dark (#111315)</div>
                <div>✓ Cards: host-dark-gray (#292C2D)</div>
                <div>✓ Text: White (#FFFFFF)</div>
                <div>✓ Sidebar: Collapsed by default on iPad</div>
                <div>✓ Borders: host-mid-gray (#676767)</div>
                <div>✓ Transitions: Smooth 300ms</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
