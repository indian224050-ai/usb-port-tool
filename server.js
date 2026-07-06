const express = require('express');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Xport USB Server Running');
});

app.post('/verify-license', (req, res) => {

    const { license } = req.body;

    if (license === "TEST123") {

        return res.json({
            success: true,
            ip: req.ip,
            port: 7575
        });

    }

    return res.json({
        success: false,
        message: 'Invalid License'
    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('Server Running');
});