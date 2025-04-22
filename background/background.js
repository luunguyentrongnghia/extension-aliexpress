async function refreshAccessToken() {
    const { refreshToken } = await chrome.storage.local.get('refreshToken');  // Lấy refresh token từ storage

    const response = await fetch('http://localhost:8000/api/token/refresh/', {  // Gọi API refresh token
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            refresh: refreshToken
        })
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    await chrome.storage.local.set({
        accessToken: data.access,
        refreshToken: data.refresh
    });

    return data.access;  // Trả về access token mới
}
chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {   
    if (message.action === 'decodeToken') {
        try {
            const decoded=await refreshAccessToken(message.token);
            console.log('Decoded token:', decoded);
            sendResponse({ decoded });
        } catch (error) {
            console.error('Error decoding token:', error);
            sendResponse({ error: 'Invalid token' });
        }
    }
    return true; // Đảm bảo phản hồi bất đồng bộ
})

