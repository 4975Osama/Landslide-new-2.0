class MenuController {
    constructor() {
        this.isMenuOpen = false;
        this.openSections = new Set(); // Default open section
    }

    initialize() {
        // Initialize main menu toggle
        const mainMenuToggle = document.getElementById('mainMenuToggle');
        const mainDropdownContent = document.getElementById('mainDropdownContent');

        if (mainMenuToggle && mainDropdownContent) {
            mainMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMainMenu();
            });
        }

        // Initialize section toggles
        const sections = ['boundary', 'roads', 'vulnerable', 'historical', 'landslide2025', 'simex'];
        sections.forEach(section => this.initializeSectionToggle(section));

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.menu-container')) {
                this.closeMainMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMainMenu();
            }
        });
    }

    initializeSectionToggle(section) {
        const toggle = document.getElementById(`${section}Toggle`);
        const content = document.getElementById(`${section}Content`);

        if (toggle && content) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSection(section, toggle, content);
            });

            // Set initial state
            if (this.openSections.has(section)) {
                toggle.classList.add('active');
                content.classList.add('show');
                const chevron = toggle.querySelector('.section-chevron');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
        }
    }

    toggleMainMenu() {
        const mainDropdownContent = document.getElementById('mainDropdownContent');
        const chevron = document.querySelector('.menu-chevron');
        
        this.isMenuOpen = !this.isMenuOpen;
        
        if (this.isMenuOpen) {
            mainDropdownContent.classList.add('show');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
            mainDropdownContent.classList.remove('show');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    }

    closeMainMenu() {
        const mainDropdownContent = document.getElementById('mainDropdownContent');
        const chevron = document.querySelector('.menu-chevron');
        
        this.isMenuOpen = false;
        mainDropdownContent.classList.remove('show');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    }

    toggleSection(sectionId, toggle, content) {
        const isOpen = this.openSections.has(sectionId);
        const chevron = toggle.querySelector('.section-chevron');
        
        if (isOpen) {
            this.openSections.delete(sectionId);
            toggle.classList.remove('active');
            content.classList.remove('show');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        } else {
            this.openSections.add(sectionId);
            toggle.classList.add('active');
            content.classList.add('show');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
    }
}

// Initialize menu controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const menuController = new MenuController();
    menuController.initialize();
});



// ...existing code...
document.addEventListener('DOMContentLoaded', function() {
    const inventoryCheckbox = document.getElementById('toggle-inventory');
    const inventoryLegend = document.getElementById('inventory-legend');
    if (inventoryCheckbox && inventoryLegend) {
        inventoryCheckbox.addEventListener('change', function() {
            inventoryLegend.style.display = this.checked ? 'block' : 'none';
        });
        // Optionally, initialize legend state on page load
        inventoryLegend.style.display = inventoryCheckbox.checked ? 'block' : 'none';
    }
});
// ...existing code...