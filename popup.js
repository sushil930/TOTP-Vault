document.addEventListener('DOMContentLoaded', () => {
    const accountsList = document.getElementById('accounts-list');
    const addAccountBtn = document.getElementById('submit-account-btn');
    const accountNameInput = document.getElementById('account-name');
    const totpSecretInput = document.getElementById('totp-secret');

    let accounts = [];
    let intervalId;

    const renderAccounts = () => {
        accountsList.innerHTML = '';

        // Empty state can be handled via CSS if the list is empty

        accounts.forEach((account, index) => {
            let totpCode;
            try {
                totpCode = window.otplib.authenticator.generate(account.secret);
            } catch (e) {
                console.error('Error generating code for', account.name, e);
                totpCode = 'Invalid';
            }

            const accountItem = document.createElement('div');
            accountItem.className = 'account-item fade-in';
            accountItem.style.animationDelay = `${index * 50}ms`;

            accountItem.innerHTML = `
                <div class="account-details" data-secret="${account.secret}" title="Click to copy">
                    <span class="account-name">${account.name}</span>
                    <span class="totp-code">${totpCode}</span>
                </div>
                <button class="delete-btn" data-secret="${account.secret}" title="Delete">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                </button>
                <div class="progress-bar" data-secret="${account.secret}"></div>
            `;
            accountsList.appendChild(accountItem);
        });
        updateTimers();
    };

    const updateTimers = () => {
        const progressBars = document.querySelectorAll('.progress-bar');
        if (progressBars.length > 0) {
            const timeRemaining = window.otplib.authenticator.timeRemaining();
            const percentage = (timeRemaining / 30) * 100;

            if (timeRemaining >= 29) { // Use >= 29 to catch the refresh moment
                renderAccounts();
            } else {
                progressBars.forEach(bar => {
                    bar.style.width = `${percentage}%`;
                });
            }
        }
    };

    const loadAccounts = async () => {
        accounts = await getAccounts();
        renderAccounts();
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(updateTimers, 1000);
    };

    accountsList.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const secret = deleteBtn.dataset.secret;
            if (confirm(`Are you sure you want to delete this account?`)) {
                await deleteAccount(secret);
                await loadAccounts();
            }
            return;
        }

        const infoTarget = e.target.closest('.account-details');
        if (infoTarget) {
            const codeElement = infoTarget.querySelector('.totp-code');
            const secret = infoTarget.dataset.secret;
            try {
                const currentCode = window.otplib.authenticator.generate(secret);
                navigator.clipboard.writeText(currentCode).then(() => {
                    codeElement.textContent = 'Copied!';
                    codeElement.classList.add('copy-feedback');
                    setTimeout(loadAccounts, 1000);
                });
            } catch (err) {
                codeElement.textContent = 'Invalid';
            }
        }
    });

    addAccountBtn.addEventListener('click', async () => {
        const name = accountNameInput.value.trim();
        const secret = totpSecretInput.value.trim().replace(/\s/g, '');

        if (name && secret) {
            try {
                window.otplib.authenticator.generate(secret);
                await saveAccount({ name, secret });
                accountNameInput.value = '';
                totpSecretInput.value = '';
                loadAccounts();
            } catch (e) {
                alert('Could not add account. Please ensure the TOTP secret is a valid Base32 string.');
            }
        }
    });

    loadAccounts();
});
