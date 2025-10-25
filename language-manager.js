// Language Manager - Handles language switching and translation
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('preferredLanguage') || 'ar';
        this.translations = window.translations || {};
        this.rtlLanguages = ['ar'];
        this.init();
    }

    init() {
        // Set initial language
        this.setLanguage(this.currentLanguage);
        
        // Listen for language changes
        document.addEventListener('DOMContentLoaded', () => {
            this.updatePageTranslations();
            this.createLanguageSelector();
        });
    }

    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.error(`Language ${lang} not found`);
            return;
        }

        this.currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);
        
        // Update HTML attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = this.rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
        
        // Update page translations
        this.updatePageTranslations();
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }

    getTranslation(key) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                // Fallback to Arabic if translation not found
                translation = this.translations['ar'];
                for (const fallbackKey of keys) {
                    if (translation && translation[fallbackKey]) {
                        translation = translation[fallbackKey];
                    } else {
                        return key; // Return key if no translation found
                    }
                }
                break;
            }
        }
        
        return translation;
    }

    translate(key) {
        return this.getTranslation(key);
    }

    updatePageTranslations() {
        // Update all elements with data-translate attribute
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.value = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // Update all elements with data-translate-title attribute
        const titleElements = document.querySelectorAll('[data-translate-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-translate-title');
            element.title = this.getTranslation(key);
        });
    }

    createLanguageSelector() {
        // Check if language selector already exists
        if (document.getElementById('languageSelector')) {
            return;
        }

        const selector = document.createElement('div');
        selector.id = 'languageSelector';
        selector.className = 'language-selector';
        selector.innerHTML = `
            <button class="language-btn" id="languageBtn">
                <span class="language-flag">${this.getLanguageFlag(this.currentLanguage)}</span>
                <span class="language-name">${this.getLanguageName(this.currentLanguage)}</span>
                <svg class="language-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <div class="language-dropdown" id="languageDropdown">
                <button class="language-option" data-lang="ar">
                    <span class="language-flag">🇸🇦</span>
                    <span>العربية</span>
                </button>
                <button class="language-option" data-lang="fr">
                    <span class="language-flag">🇫🇷</span>
                    <span>Français</span>
                </button>
                <button class="language-option" data-lang="en">
                    <span class="language-flag">🇬🇧</span>
                    <span>English</span>
                </button>
            </div>
        `;

        // Find header nav or create a container for it
        const nav = document.querySelector('.nav') || document.querySelector('.header-content');
        if (nav) {
            nav.insertBefore(selector, nav.firstChild);
        } else {
            document.body.appendChild(selector);
        }

        // Add event listeners
        const languageBtn = document.getElementById('languageBtn');
        const languageDropdown = document.getElementById('languageDropdown');
        
        languageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdown.classList.toggle('show');
        });

        // Language option click handlers
        const languageOptions = document.querySelectorAll('.language-option');
        languageOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = option.getAttribute('data-lang');
                this.setLanguage(lang);
                languageDropdown.classList.remove('show');
                this.updateLanguageButton();
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            languageDropdown.classList.remove('show');
        });
    }

    updateLanguageButton() {
        const languageBtn = document.getElementById('languageBtn');
        if (languageBtn) {
            const flagSpan = languageBtn.querySelector('.language-flag');
            const nameSpan = languageBtn.querySelector('.language-name');
            
            if (flagSpan) flagSpan.textContent = this.getLanguageFlag(this.currentLanguage);
            if (nameSpan) nameSpan.textContent = this.getLanguageName(this.currentLanguage);
        }
    }

    getLanguageFlag(lang) {
        const flags = {
            ar: '🇸🇦',
            fr: '🇫🇷',
            en: '🇬🇧'
        };
        return flags[lang] || '🌐';
    }

    getLanguageName(lang) {
        const names = {
            ar: 'العربية',
            fr: 'Français',
            en: 'English'
        };
        return names[lang] || lang;
    }

    // Helper function to format dates based on current language
    formatDate(date, options = {}) {
        const locales = {
            ar: 'ar-SA',
            fr: 'fr-FR',
            en: 'en-US'
        };
        
        const locale = locales[this.currentLanguage] || 'ar-SA';
        return new Date(date).toLocaleDateString(locale, options);
    }

    // Helper function to format numbers based on current language
    formatNumber(number) {
        const locales = {
            ar: 'ar-SA',
            fr: 'fr-FR',
            en: 'en-US'
        };
        
        const locale = locales[this.currentLanguage] || 'ar-SA';
        return new Intl.NumberFormat(locale).format(number);
    }
}

// Initialize language manager
const languageManager = new LanguageManager();

// Global helper functions
function t(key) {
    return languageManager.translate(key);
}

function setLanguage(lang) {
    languageManager.setLanguage(lang);
}

function getCurrentLanguage() {
    return languageManager.currentLanguage;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LanguageManager, languageManager, t, setLanguage, getCurrentLanguage };
}
