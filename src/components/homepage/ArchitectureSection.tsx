
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { techStack } from '@/data/techStack';

const ArchitectureSection = () => {
  return (
    <section id="architecture" className="container mx-auto px-4 py-20 bg-muted/30">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
        Technical Architecture
      </h2>
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Current Technology Stack</CardTitle>
            <CardDescription>Technologies and frameworks powering the Grace OS platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-grace-primary mb-3">Frontend</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  {techStack.frontend.map((tech, index) => (
                    <li key={index}>• {tech}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-grace-primary mb-3">Backend & Infrastructure</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  {techStack.backend.map((tech, index) => (
                    <li key={index}>• {tech}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-grace-primary mb-3">Third-Party Development Tools</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  {techStack.thirdPartyTools.map((tool, index) => (
                    <li key={index}>• {tool}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-grace-primary mb-3">Key Features Implemented</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                {Object.entries(techStack.features).map(([category, items]) => (
                  <div key={category}>
                    <strong>{category}</strong>
                    <ul className="text-gray-600 dark:text-gray-300 mt-1">
                      {items.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ArchitectureSection;
