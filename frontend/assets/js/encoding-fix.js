// MindFlow AI - Complete Encoding Fix Solution
// ============================================

class EncodingFixer {
    constructor() {
        this.problematicChars = {
            'ï¿½': "'",
            'â€œ': '"',
            'â€': '"',
            'â€™': "'",
            'â€˜': "'",
            'â€¦': '...',
            'â€"': '-',
            'Ã©': 'é',
            'Ã¡': 'á',
            'Ã': 'í',
            'Ã³': 'ó',
            'Ãº': 'ú',
            'Ã±': 'ñ',
            'Ã£': 'ã',
            'Ã¤': 'ä',
            'Ã¶': 'ö',
            'Ã¼': 'ü',
            'ÃŸ': 'ß',
            'Ã†': 'Æ',
            'Ã°': 'ð',
            'Ã¸': 'ø',
            'Ã¥': 'å',
            'â€¢': '•',
            'â€“': '–',
            'â€”': '—',
            'Â': ' ',
            'â€¹': '<',
            'â€º': '>'
        };
        this.init();
    }

    init() {
        console.log('🔧 Encoding Fixer Initialized');
        this.fixEntirePage();
        this.setupMutationObserver();
    }

    fixEntirePage() {
        console.log('🔄 Scanning page for encoding issues...');
        let totalFixes = 0;

        // Fix all text content in the document
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const originalText = node.nodeValue;
            let fixedText = originalText;

            for (const [badChar, goodChar] of Object.entries(this.problematicChars)) {
                const regex = new RegExp(this.escapeRegExp(badChar), 'g');
                if (regex.test(fixedText)) {
                    fixedText = fixedText.replace(regex, goodChar);
                    totalFixes++;
                }
            }

            if (fixedText !== originalText) {
                node.nodeValue = fixedText;
            }
        }

        // Fix title and meta tags
        this.fixDocumentHead();

        if (totalFixes > 0) {
            console.log(`✅ Fixed ${totalFixes} encoding issues`);
            this.showSuccessNotification(totalFixes);
        } else {
            console.log('✅ No encoding issues found');
        }
    }

    fixDocumentHead() {
        // Fix page title
        if (document.title) {
            let fixedTitle = document.title;
            for (const [badChar, goodChar] of Object.entries(this.problematicChars)) {
                fixedTitle = fixedTitle.split(badChar).join(goodChar);
            }
            document.title = fixedTitle;
        }

        // Fix meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            let content = metaDescription.getAttribute('content');
            for (const [badChar, goodChar] of Object.entries(this.problematicChars)) {
                content = content.split(badChar).join(goodChar);
            }
            metaDescription.setAttribute('content', content);
        }
    }

    setupMutationObserver() {
        // Watch for dynamically added content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.fixNodeContent(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    fixNodeContent(element) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const originalText = node.nodeValue;
            let fixedText = originalText;

            for (const [badChar, goodChar] of Object.entries(this.problematicChars)) {
                fixedText = fixedText.split(badChar).join(goodChar);
            }

            if (fixedText !== originalText) {
                node.nodeValue = fixedText;
            }
        }
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    showSuccessNotification(fixCount) {
        const notification = document.createElement('div');
        notification.id = 'encodingFixNotification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                max-width: 300px;
            ">
                <span style="font-size: 16px;">🔧</span>
                <span>Fixed ${fixCount} encoding issues</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 8px;
                ">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Public method for manual fixing
    refixPage() {
        this.fixEntirePage();
    }
}

// Automatic execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.encodingFixer = new EncodingFixer();
    });
} else {
    window.encodingFixer = new EncodingFixer();
}

// Global function for manual fixing
window.fixPageEncoding = function() {
    if (window.encodingFixer) {
        window.encodingFixer.refixPage();
    } else {
        window.encodingFixer = new EncodingFixer();
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EncodingFixer;
}