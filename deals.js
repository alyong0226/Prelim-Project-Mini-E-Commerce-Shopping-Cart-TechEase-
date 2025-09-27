document.addEventListener('DOMContentLoaded', function() {
     initializeCart();
     setupAddToCartButtons();
     startCountdownTimer();
 });

 function startCountdownTimer() {
    const targetTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    
    const timer = setInterval(function() {
        const now = new Date().getTime();
        const distance = targetTime - now;
        
        if (distance < 0) {
            clearInterval(timer);
            resetTimer();
            return;
        }
        
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');
        
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
    }, 1000);
  }

  function resetTimer() {
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    if (hoursElement) hoursElement.textContent = '23';
    if (minutesElement) minutesElement.textContent = '59';
    if (secondsElement) secondsElement.textContent = '59';
    startCountdownTimer();
  }
