const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Nodemailer Configuration for Proton Mail SMTP Submission ---
const transporter = nodemailer.createTransport({
    host: 'smtp.protonmail.ch',
    port: 587,
    secure: false, // This must be false to use STARTTLS encryption
    auth: {
        user: process.env.PROTON_EMAIL, // Your full email address (e.g., thecoterie@promontoryai.com)
        pass: process.env.PROTON_TOKEN  // The SMTP Submission TOKEN you generated in Proton Mail
    }
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter verification failed!', error);
    } else {
        console.log('✅ Email transporter is ready to send emails.');
    }
});

// --- API Endpoints ---

// Root Endpoint (Status Check)
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'The Coterie Nomination API',
        message: 'This server is running and ready to receive POST requests at the /submit endpoint.'
    });
});

// Wake-up Endpoint
app.get('/wake-up', (req, res) => {
    res.status(200).json({ message: 'Server is awake and ready.' });
});

// Form Submission Endpoint
app.post('/submit', async (req, res) => {
    const { 
        nominationType, name, email, title, company, linkedin, 
        community, qualification, nominatorName, nominatorEmail 
    } = req.body;

    let subject, htmlContent;
    
    if (nominationType === 'self') {
        subject = `New Coterie Nomination (Self): ${name}`;
        htmlContent = `
            <p>A new <strong>self-nomination</strong> has been submitted.</p>
            <h3>Nominee Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community:</strong> ${community}</li>
            </ul>
            <h3>Reason for Fit:</h3>
            <p>${qualification}</p>
        `;
    } else {
        subject = `New Coterie Nomination (Peer): ${name} by ${nominatorName}`;
        htmlContent = `
            <p>A new <strong>peer nomination</strong> has been submitted.</p>
            <h3>Nominee Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community:</strong> ${community}</li>
            </ul>
            <h3>Reason for Fit:</h3>
            <p>${qualification}</p>
            <hr>
            <h3>Nominator Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${nominatorName}</li>
                <li><strong>Email:</strong> ${nominatorEmail}</li>
            </ul>
        `;
    }

    const mailOptions = {
        from: `"The Coterie" <${process.env.PROTON_EMAIL}>`,
        to: process.env.PROTON_EMAIL, // Send the notification to yourself
        subject: subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully via Proton Mail.');
        res.status(200).json({ message: 'Nomination submitted successfully.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error processing your nomination.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
