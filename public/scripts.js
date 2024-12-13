document.getElementById('send-btn').addEventListener('click', async () => {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (!message) return;

    const sessionId = 'default-session'; // Replace with dynamic ID logic if needed
    const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
    });

    const { reply, history } = await response.json();

    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = history.map(({ role, content }) =>
        `<div class="${role}">${content}</div>`).join('');
    input.value = '';
});
