// A key will be generated and stored in local storage.
async function getKey() {
    let key = await chrome.storage.local.get('key');
    if (key && key.key) {
        return await crypto.subtle.importKey(
            'jwk',
            key.key,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        );
    } else {
        key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
        chrome.storage.local.set({ 'key': await crypto.subtle.exportKey('jwk', key) });
        return key;
    }
}

async function encrypt(data) {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        new TextEncoder().encode(data)
    );
    return {
        iv: Array.from(iv),
        encrypted: Array.from(new Uint8Array(encrypted)),
    };
}

async function decrypt(encryptedData) {
    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
        key,
        new Uint8Array(encryptedData.encrypted)
    );
    return new TextDecoder().decode(decrypted);
} 