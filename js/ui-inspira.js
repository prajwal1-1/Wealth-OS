/**
 * Inspira UI Enhancements - Vanilla JS Implementation
 */

// 2. 3D Tilt & Glare Effect
function initTiltEffect() {
  const applyTilt = (selector) => {
    document.querySelectorAll(selector).forEach(card => {
      if (card.dataset.tiltInitialized) return;
      card.dataset.tiltInitialized = 'true';

      if (!card.querySelector('.glare')) {
        const glare = document.createElement('div');
        glare.className = 'glare';
        card.appendChild(glare);
      }

      const glare = card.querySelector('.glare');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        
        if(glare) {
          glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2), transparent 50%)`;
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
        if(glare) {
          glare.style.opacity = '0';
        }
      });
      
      card.addEventListener('mouseenter', () => {
        if(glare) {
          glare.style.opacity = '1';
        }
      });
    });
  };

  applyTilt('.asset-card');
  applyTilt('.metric-card');
  applyTilt('.wellness-mini-card');
  applyTilt('.kpi-card');

  const observer = new MutationObserver(() => {
    applyTilt('.asset-card');
    applyTilt('.metric-card');
    applyTilt('.wellness-mini-card');
    applyTilt('.kpi-card');
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// 4. Meteors Effect
function initMeteors() {
  const container = document.querySelector('.insight-panel');
  if (!container) return;
  
  if (container.dataset.meteorsInitialized) return;
  container.dataset.meteorsInitialized = 'true';
  container.style.position = 'relative';

  const numMeteors = 10;
  for (let i = 0; i < numMeteors; i++) {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    
    const top = Math.floor(Math.random() * 100);
    const left = Math.floor(Math.random() * 100);
    const delay = Math.random() * 5 + 2;
    const duration = Math.random() * 2 + 2;
    
    meteor.style.top = `${top}%`;
    meteor.style.left = `${left}%`;
    meteor.style.animationDelay = `${delay}s`;
    meteor.style.animationDuration = `${duration}s`;
    
    container.appendChild(meteor);
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initTiltEffect();
  initMeteors();
});

// Export a helper for AI typing if needed elsewhere
window.typeWriterReveal = function(element, htmlContent) {
  element.innerHTML = '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  function wrapTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = node.textContent.split(/(\s+)/);
      const fragment = document.createDocumentFragment();
      let hasWords = false;
      words.forEach(word => {
        if (word.trim() === '') {
          fragment.appendChild(document.createTextNode(word));
        } else {
          const span = document.createElement('span');
          span.textContent = word;
          span.className = 'typewriter-word';
          span.style.opacity = '0';
          fragment.appendChild(span);
          hasWords = true;
        }
      });
      if (hasWords) {
        node.replaceWith(fragment);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(wrapTextNodes);
    }
  }
  
  wrapTextNodes(tempDiv);
  element.innerHTML = tempDiv.innerHTML;
  
  const words = element.querySelectorAll('.typewriter-word');
  words.forEach((word, index) => {
    word.style.animation = `revealWord 0.3s forwards`;
    word.style.animationDelay = `${index * 0.05}s`;
  });
};
