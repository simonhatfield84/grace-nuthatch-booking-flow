
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    const collectDebugInfo = () => {
      const root = document.documentElement;
      const body = document.body;
      const rootStyles = window.getComputedStyle(root);
      const bodyStyles = window.getComputedStyle(body);
      
      // Check localStorage theme
      const storedTheme = localStorage.getItem('grace-theme');
      
      const info = {
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        isIPad: navigator.userAgent.includes('iPad') || 
                 (navigator.userAgent.includes('Mac') && 'ontouchend' in document),
        storedTheme,
        rootClasses: root.className,
        bodyClasses: body.className,
        rootBg: rootStyles.backgroundColor,
        bodyBg: bodyStyles.backgroundColor,
        rootColor: rootStyles.color,
        bodyColor: bodyStyles.color,
        cssVariables: {
          background: rootStyles.getPropertyValue('--background'),
          foreground: rootStyles.getPropertyValue('--foreground'),
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      setDebugInfo(info);
      console.log('🐛 Enhanced Debug Info:', info);
    };
    
    collectDebugInfo();
    
    window.addEventListener('resize', collectDebugInfo);
    return () => window.removeEventListener('resize', collectDebugInfo);
  }, []);
  
  return (
    <Card className="fixed top-4 right-4 z-50 max-w-sm bg-white border-red-500 border-2 text-black">
      <CardHeader>
        <CardTitle className="text-red-600">Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-1">
        <div><strong>iPad:</strong> {debugInfo.isIPad ? 'Yes' : 'No'}</div>
        <div><strong>Stored Theme:</strong> {debugInfo.storedTheme}</div>
        <div><strong>Root BG:</strong> {debugInfo.rootBg}</div>
        <div><strong>Body BG:</strong> {debugInfo.bodyBg}</div>
        <div><strong>Root Classes:</strong> {debugInfo.rootClasses}</div>
        <div><strong>CSS --background:</strong> {debugInfo.cssVariables?.background}</div>
        <div><strong>Viewport:</strong> {debugInfo.viewport?.width}x{debugInfo.viewport?.height}</div>
      </CardContent>
    </Card>
  );
}
