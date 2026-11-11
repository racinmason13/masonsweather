(function () {
    const sheetId = '1jQ9ddsqhOXiw2RnN41ZnHs-vyhV2V2lZbmsAa0k3-GY';
    const themeStorageKey = 'mw-site-theme';

    function applyTheme(theme, persist) {
        const selectedTheme = theme === 'dark' ? 'dark' : 'light';
        const root = document.documentElement;
        root.dataset.theme = selectedTheme;
        root.classList.toggle('dark', selectedTheme === 'dark');
        root.classList.toggle('light', selectedTheme === 'light');

        if (persist) {
            try {
                localStorage.setItem(themeStorageKey, selectedTheme);
            } catch (error) {
                console.warn('Unable to save the site theme preference:', error);
            }
        }

        document.querySelectorAll('.site-theme-control').forEach(button => {
            const targetTheme = selectedTheme === 'dark' ? 'light' : 'dark';
            const label = button.querySelector('.site-theme-label');
            button.setAttribute('aria-label', `Switch to ${targetTheme} mode`);
            button.setAttribute('title', `Switch to ${targetTheme} mode`);
            button.setAttribute('aria-pressed', String(selectedTheme === 'dark'));
            if (label) label.textContent = `${targetTheme} mode`;

            const icon = button.querySelector('.site-theme-icon');
            if (icon) {
                icon.innerHTML = selectedTheme === 'dark'
                    ? '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path>'
                    : '<path d="M20.985 12.486A9 9 0 1 1 11.514 3.015a7 7 0 0 0 9.471 9.471Z"></path>';
            }
        });
    }

    function toggleTheme() {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme, true);
    }

    function installThemeControl() {
        let button = document.getElementById('theme-toggle-btn');
        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'site-theme-control';
            button.innerHTML = '<span class="site-theme-icon" aria-hidden="true">◐</span><span class="site-theme-label"></span>';

            const host = document.querySelector('.portal-nav, .dashboard-nav');
            if (host) {
                host.appendChild(button);
            } else {
                const header = document.querySelector('body > header');
                if (header && !document.body.classList.contains('site-telemetry')) {
                    header.appendChild(button);
                } else {
                    button.classList.add('site-theme-control-floating');
                    document.body.appendChild(button);
                }
            }
        }

        button.classList.add('site-theme-control');
        button.type = 'button';
        button.removeAttribute('onclick');
        button.innerHTML = '<svg class="site-theme-icon" aria-hidden="true" viewBox="0 0 24 24"></svg><span class="site-theme-label"></span>';
        button.addEventListener('click', toggleTheme);
    }

    function readSheetCell(cell) {
        if (!cell) return '';
        const value = cell.f !== undefined && cell.f !== null ? cell.f : cell.v;
        return value === undefined || value === null ? '' : String(value);
    }

    function createNationalAlertUI() {
        const banner = document.createElement('section');
        banner.className = 'site-national-alert';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'assertive');
        banner.hidden = true;

        const label = document.createElement('strong');
        label.className = 'site-national-alert-label';
        label.textContent = 'NATIONAL ALERT';
        banner.tabIndex = -1;

        const message = document.createElement('p');
        message.className = 'site-national-alert-message';

        banner.append(label, message);
        document.body.prepend(banner);

        const backdrop = document.createElement('div');
        backdrop.className = 'site-national-alert-backdrop';
        backdrop.hidden = true;
        backdrop.setAttribute('role', 'alertdialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-labelledby', 'site-national-alert-title');
        backdrop.setAttribute('aria-describedby', 'site-national-alert-dialog-message');

        const dialog = document.createElement('div');
        dialog.className = 'site-national-alert-dialog';

        const heading = document.createElement('h2');
        heading.id = 'site-national-alert-title';
        heading.textContent = 'National Weather Alert';

        const dialogMessage = document.createElement('p');
        dialogMessage.id = 'site-national-alert-dialog-message';

        const acknowledge = document.createElement('button');
        acknowledge.type = 'button';
        acknowledge.className = 'site-national-alert-acknowledge';
        acknowledge.textContent = 'Acknowledge alert';

        dialog.append(heading, dialogMessage, acknowledge);
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        return { banner, message, backdrop, dialogMessage, acknowledge };
    }

    function hashText(value) {
        let hash = 2166136261;
        for (let index = 0; index < value.length; index += 1) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    function initializeNationalAlert() {
        const ui = createNationalAlertUI();
        const pageStorageKey = `mw-national-alert:${window.location.pathname}`;
        let activeAlert = '';
        let requestPending = false;

        function closeDialog() {
            ui.backdrop.hidden = true;
            ui.banner.focus();
            document.removeEventListener('keydown', onDialogKeydown);
        }

        function onDialogKeydown(event) {
            if (event.key === 'Escape') closeDialog();
        }

        function showNationalAlert(message) {
            const text = message.trim();
            if (!text) {
                activeAlert = '';
                ui.banner.hidden = true;
                ui.backdrop.hidden = true;
                try {
                    sessionStorage.removeItem(pageStorageKey);
                } catch (error) {
                    console.warn('Unable to clear the dismissed-alert state:', error);
                }
                return;
            }

            ui.message.textContent = text;
            ui.dialogMessage.textContent = text;
            ui.banner.hidden = false;
            if (activeAlert === text) return;
            activeAlert = text;

            const alertHash = hashText(text);
            try {
                if (sessionStorage.getItem(pageStorageKey) === alertHash) return;
                sessionStorage.setItem(pageStorageKey, alertHash);
            } catch (error) {
                console.warn('Unable to save the dismissed-alert state:', error);
            }

            ui.backdrop.hidden = false;
            ui.acknowledge.focus();
            document.addEventListener('keydown', onDialogKeydown);
        }

        ui.acknowledge.addEventListener('click', closeDialog);
        ui.backdrop.addEventListener('click', event => {
            if (event.target === ui.backdrop) closeDialog();
        });

        window.handleNationalAlertSheetResponse = function (response) {
            requestPending = false;
            if (!response || !response.table || !Array.isArray(response.table.rows)) {
                console.error('The national alert sheet returned an unexpected response.');
                return;
            }

            const row = response.table.rows[8];
            const key = row && row.c ? readSheetCell(row.c[0]).trim().toUpperCase() : '';
            if (key !== 'NA') {
                console.error('Expected "NA" in cell A9 of the shared Google Sheet.');
                showNationalAlert('');
                return;
            }

            const alertText = row.c ? readSheetCell(row.c[1]) : '';
            showNationalAlert(alertText);
        };

        function fetchNationalAlert() {
            if (requestPending) return;
            requestPending = true;
            const script = document.createElement('script');
            const params = new URLSearchParams({
                tqx: 'responseHandler:handleNationalAlertSheetResponse'
            });
            script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${params.toString()}`;
            script.onload = () => {
                requestPending = false;
                script.remove();
            };
            script.onerror = () => {
                requestPending = false;
                script.remove();
                console.error('Unable to load the national alert from the shared Google Sheet.');
            };
            document.head.appendChild(script);
            window.setTimeout(() => {
                if (!requestPending) return;
                requestPending = false;
                script.remove();
                console.error('Timed out while loading the national alert from the shared Google Sheet.');
            }, 20000);
        }

        fetchNationalAlert();
        window.setInterval(fetchNationalAlert, 300000);
    }

    function initialize() {
        let savedTheme = 'light';
        try {
            const storedTheme = localStorage.getItem(themeStorageKey);
            if (storedTheme === 'light' || storedTheme === 'dark') savedTheme = storedTheme;
        } catch (error) {
            console.warn('Unable to read the saved site theme preference:', error);
        }
        installThemeControl();
        applyTheme(savedTheme, false);
        window.setSiteTheme = theme => applyTheme(theme, true);
        window.toggleSiteTheme = toggleTheme;
        window.toggleTheme = toggleTheme;
        initializeNationalAlert();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
