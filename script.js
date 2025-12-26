document.addEventListener('DOMContentLoaded', function() {
    const enlargeableImgs = document.querySelectorAll('.enlargeable-img');
    const enlargedView = document.getElementById('enlargedView');
    const enlargedImg = document.getElementById('enlargedImg');
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    let currentIndex = 0;
    const imgSources = Array.from(enlargeableImgs).map(img => img.src);
    
    // Function to update the enlarged image
    function updateEnlargedImage(index) {
        currentIndex = index;
        enlargedImg.src = imgSources[currentIndex];
    }
    
    // Add click event to each thumbnail
    enlargeableImgs.forEach((img, index) => {
        img.addEventListener('click', function() {
            updateEnlargedImage(index);
            enlargedView.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Close button functionality
    closeBtn.addEventListener('click', function() {
        enlargedView.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Navigation buttons
    prevBtn.addEventListener('click', function() {
        let newIndex = currentIndex - 1;
        if (newIndex < 0) newIndex = imgSources.length - 1;
        updateEnlargedImage(newIndex);
    });
    
    nextBtn.addEventListener('click', function() {
        let newIndex = currentIndex + 1;
        if (newIndex >= imgSources.length) newIndex = 0;
        updateEnlargedImage(newIndex);
    });
    
    // Close when clicking outside the image
    enlargedView.addEventListener('click', function(event) {
        if (event.target === enlargedView) {
            enlargedView.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (enlargedView.style.display === 'flex') {
            if (event.key === 'ArrowRight') {
                nextBtn.click();
            } else if (event.key === 'ArrowLeft') {
                prevBtn.click();
            } else if (event.key === 'Escape') {
                closeBtn.click();
            }
        }
    });
});