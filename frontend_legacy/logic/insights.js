// insights.js - Interactive functionality for Insights Dashboard
function initializeInsights() {
    console.log('Initializing Insights Dashboard...');
    
    // Network graph interaction
    const networkNodes = document.querySelectorAll('.graph-svg g');
    networkNodes.forEach(node => {
        node.addEventListener('mouseenter', function() {
            this.querySelector('circle').setAttribute('fill', 'hsl(84 81% 44% / 0.3)');
            this.querySelector('text').setAttribute('font-size', '11');
        });
        
        node.addEventListener('mouseleave', function() {
            this.querySelector('circle').setAttribute('fill', 'hsl(210 25% 16%)');
            this.querySelector('text').setAttribute('font-size', '10');
        });
        
        node.addEventListener('click', function() {
            const nodeText = this.querySelector('text').textContent;
            console.log(`Node clicked: ${nodeText}`);
            // You could add more specific actions here based on which node was clicked
        });
    });

    // Center node special interaction
    const centerNode = document.querySelector('.graph-svg circle[cx="220"]');
    if (centerNode) {
        centerNode.addEventListener('click', function() {
            console.log('Center "You" node clicked - refreshing insights...');
            // This would be where you might refresh the data
            // For now we'll just animate it
            this.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 300);
        });
    }

    // Card hover effects
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        });
    });

    // Recommendation items interaction
    const recommendations = document.querySelectorAll('.list-disc li');
    recommendations.forEach(item => {
        item.addEventListener('click', function() {
            const recommendationText = this.textContent.trim();
            console.log(`Selected recommendation: ${recommendationText}`);
            
            // Visual feedback
            this.style.backgroundColor = 'hsl(84 81% 44% / 0.1)';
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 300);
        });
    });

    // Mood snapshot refresh button (we'll add one dynamically)
    const moodCard = document.querySelector('.card .card-content');
    if (moodCard) {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'refresh-button';
        refreshButton.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4"></i> Update Mood Analysis';
        refreshButton.addEventListener('click', function() {
            console.log('Refreshing mood analysis...');
            this.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Analyzing...';
            
            // Simulate API call
            setTimeout(() => {
                this.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4"></i> Update Mood Analysis';
                lucide.createIcons();
                console.log('Mood analysis refreshed');
            }, 1500);
        });
        
        moodCard.appendChild(refreshButton);
        lucide.createIcons();
    }

    // Progress graph animation
    const progressGraph = document.querySelector('.graph-svg polyline');
    if (progressGraph) {
        // Animate the graph drawing
        progressGraph.style.strokeDasharray = progressGraph.getTotalLength();
        progressGraph.style.strokeDashoffset = progressGraph.getTotalLength();
        progressGraph.style.animation = 'drawGraph 2s ease-in-out forwards';
    }

    console.log('Insights Dashboard initialized');
}

// Add animation for the graph
const style = document.createElement('style');
style.textContent = `
    @keyframes drawGraph {
        to {
            stroke-dashoffset: 0;
        }
    }
`;
document.head.appendChild(style);