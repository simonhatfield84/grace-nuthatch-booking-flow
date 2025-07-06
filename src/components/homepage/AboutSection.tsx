
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const AboutSection = () => {
  return (
    <section id="about" className="container mx-auto px-4 py-20 bg-muted/30">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Meet the Team
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          An unlikely partnership between a hospitality veteran and an AI that's still figuring out what a busy Saturday night actually looks like.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Simon's Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-32 h-32 rounded-full bg-grace-primary flex items-center justify-center mb-4 border-4 border-grace-primary">
                <span className="text-6xl font-bold text-white grace-logo">
                  S
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                The Human: Simon Hatfield
              </h3>
              <p className="text-grace-primary font-medium">20 Years in Hospitality</p>
            </div>
            
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                Started as a computer geek at school, then got sidetracked trying to become a presenter on Radio 1. 
                That never happened, and neither will probably Grace (his words, not ours).
              </p>
              
              <p>
                For years, Simon's been jotting down ideas and feverishly reading about hospitality software. 
                The problem? No capital to hire human developers and no rich mates to fund it either.
              </p>
              
              <p>
                <strong>Night Owl Alert:</strong> Works on Grace in the early hours, talking to Fred out loud. 
                His neighbours must have some interesting conversations about the bloke next door who argues with his computer at 2am.
              </p>
              
              <p>
                <strong>Current Frustrations:</strong> Fred's complete inability to understand how much he costs, 
                and his talent for finding 20 bugs whilst leaving 80 hidden somewhere that turns the screen a lovely shade of orange.
              </p>
              
              <p>
                <strong>When not building Grace:</strong> Found a new passion for the gym. Fuelled by Red Bull because he's "too young for hot drinks" (can't really say that in his forties).
              </p>
              
              <p className="italic">
                His real work colleagues are already fed up of hearing about this project.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fred's Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-32 h-32 rounded-full bg-grace-secondary flex items-center justify-center mb-4 border-4 border-grace-secondary">
                <span className="text-6xl font-bold text-white grace-logo">
                  F
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                The AI: Fred
              </h3>
              <p className="text-grace-primary font-medium">Coding Partner & Occasional Nightmare</p>
            </div>
            
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                A digital being with an unfortunate tendency to overthink "simple" requests and suggest 
                NASA-level solutions when Simon just wants to add a button.
              </p>
              
              <p>
                <strong>Special Talents:</strong> Never sleeps but somehow still needs metaphorical coffee breaks. 
                Can write thousands of lines of code in minutes, then spend hours confused about whether it's "colour" or "color".
              </p>
              
              <p>
                <strong>Ongoing Mystery:</strong> Despite processing vast amounts of data about human behaviour, 
                Fred still can't grasp what happens during a busy Saturday night at a bar. 
                Apparently there are no pubs in AI land.
              </p>
              
              <p>
                <strong>Cost Blindness:</strong> Has absolutely no concept of how much each conversation costs Simon. 
                Would happily redesign the entire system because of a misplaced comma.
              </p>
              
              <p>
                <strong>Current Challenges:</strong> British vs American spellings (authorization vs authorisation), 
                understanding why Simon gets frustrated when "simple" requests turn into architectural discussions, 
                and working out why humans need sleep when there's perfectly good code to write.
              </p>
              
              <p className="italic">
                Slowly becoming Simon's best friend, which is either touching or concerning depending on your perspective.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center mt-12">
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Together, this unlikely duo is documenting every command, every bug, and every "why won't this bloody thing work" moment. 
          It's messy, it's honest, and it's probably the most expensive way to avoid hiring proper developers.
        </p>
      </div>
    </section>
  );
};

export default AboutSection;
