async function getAccounts() {
    const result = await chrome.storage.local.get('accounts');
    if (result.accounts) {
        // The secrets are encrypted, so we need to decrypt them.
        const decryptedAccounts = await Promise.all(result.accounts.map(async (account) => {
            const secret = await decrypt(account.secret);
            return { ...account, secret };
        }));
        return decryptedAccounts;
    }
    return [];
}

async function saveAccount(account) {
    const result = await chrome.storage.local.get('accounts');
    const accounts = result.accounts || [];
    // The secret needs to be encrypted before saving.
    const encryptedSecret = await encrypt(account.secret);
    accounts.push({ ...account, secret: encryptedSecret });
    await chrome.storage.local.set({ accounts });
}

async function deleteAccount(secretToDelete) {
    const result = await chrome.storage.local.get('accounts');
    const encryptedAccounts = result.accounts || [];

    const decryptedAccounts = await Promise.all(encryptedAccounts.map(async (account) => {
        const secret = await decrypt(account.secret);
        return { ...account, secret };
    }));

    const remainingAccounts = decryptedAccounts.filter(account => account.secret !== secretToDelete);

    const newEncryptedAccounts = await Promise.all(remainingAccounts.map(async (account) => {
        const encryptedSecret = await encrypt(account.secret);
        return { name: account.name, secret: encryptedSecret };
    }));

    await chrome.storage.local.set({ accounts: newEncryptedAccounts });
} 