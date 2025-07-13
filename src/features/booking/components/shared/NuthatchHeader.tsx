import nuthatchLogo from "@/assets/nuthatch-logo.png";

export function NuthatchHeader() {
  return (
    <header className="bg-nuthatch-white border-b border-nuthatch-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <img 
              src={nuthatchLogo} 
              alt="The Nuthatch" 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback to text if logo fails to load
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.logo-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'logo-fallback font-nuthatch-heading text-2xl font-light text-nuthatch-dark';
                  fallback.textContent = 'The Nuthatch';
                  parent.appendChild(fallback);
                }
              }}
            />
            <h1 className="font-nuthatch-heading text-2xl font-light text-nuthatch-dark hidden">
              The Nuthatch
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}