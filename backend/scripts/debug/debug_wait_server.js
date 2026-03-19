const net = require('net');
const start = Date.now();
console.log('Waiting for localhost:5000...');
const interval = setInterval(() => {
    const socket = new net.Socket();
    socket.connect(5000, 'localhost', () => {
        console.log('Server is UP!');
        socket.destroy();
        clearInterval(interval);
        process.exit(0);
    });
    socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > 30000) {
            console.error('Timeout waiting for server');
            process.exit(1);
        }
    });
}, 1000);
