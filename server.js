const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- CORRECTED Nodemailer Configuration for Proton Mail ---
const transporter = nodemailer.createTransport({
    host: 'smtp.protonmail.ch',
    port: 587,
    secure: false, // Must be false for port 587, as it uses STARTTLS
    auth: {
        // --- CHANGE #1: Use the correct environment variables ---
        user: process.env.PROTON_EMAIL, // Your full Proton Mail address (e.g., thecoterie@promontoryai.com)
        pass: process.env.PROTON_TOKEN  // Your GENERATED TOKEN, not your password
    },
    // --- CHANGE #2: Remove unnecessary TLS setting ---
    // The 'tls' object is generally not needed and can cause issues.
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

// 1. Wake-up Endpoint
app.get('/wake-up', (req, res) => {
    res.status(200).json({ message: 'Server is awake and ready.' });
});

// 2. Form Submission Endpoint
app.post('/submit', async (req, res) => { // --- CHANGE #3: Use modern async/await for cleaner code ---
    const { 
        nominationType, 
        name, 
        email, 
        title, 
        company, 
        linkedin, 
        community, 
        qualification, 
        nominatorName, 
        nominatorEmail 
    } = req.body;

    // Basic validation
    if (!name || !email || !title || !company || !linkedin || !community || !qualification) {
        return res.status(400).json({ message: 'Missing required fields for the nominee.' });
    }
    if (nominationType === 'peer' && (!nominatorName || !nominatorEmail)) {
        return res.status(400).json({ message: 'Missing required fields for the nominator.' });
    }

    // --- Email Content Formatting ---
    let subject, htmlContent;
    
    if (nominationType === 'self') {
        subject = `New Coterie Nomination (Self): ${name}`;
        htmlContent = `
            <p style="font-family: Arial, sans-serif;">A new <strong>self-nomination</strong> has been submitted for The Coterie.</p>
            <h3 style="font-family: Arial, sans-serif;">Nominee Details:</h3>
            <ul style="font-family: Arial, sans-serif; line-height: 1.6;">
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community of Interest:</strong> ${community}</li>
            </ul>
            <h3 style="font-family: Arial, sans-serif;">Reason for Fit:</h3>
            <p style="font-family: Arial, sans-serif; white-space: pre-wrap;">${qualification}</p>
        `;
    } else { // Peer nomination
        subject = `New Coterie Nomination (Peer): ${name} by ${nominatorName}`;
        htmlContent = `
            <p style="font-family: Arial, sans-serif;">A new <strong>peer nomination</strong> has been submitted for The Coterie.</p>
            <h3 style="font-family: Arial, sans-serif;">Nominee Details:</h3>
            <ul style="font-family: Arial, sans-serif; line-height: 1.6;">
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community of Interest:</strong> ${community}</li>
            </ul>
            <h3 style="font-family: Arial, sans-serif;">Reason for Fit:</h3>
            <p style="font-family: Arial, sans-serif; white-space: pre-wrap;">${qualification}</p>
            <hr>
            <h3 style="font-family: Arial, sans-serif;">Nominator Details:</h3>
            <ul style="font-family: Arial, sans-serif; line-height: 1.6;">
                <li><strong>Name:</strong> ${nominatorName}</li>
                <li><strong>Email:</strong> ${nominatorEmail}</li>
            </ul>
        `;
    }

    const mailOptions = {
        from: `"The Coterie" <${process.env.PROTON_EMAIL}>`,
        to: 'thecoterie@promontoryai.com', // Where you want to receive the notification
        subject: subject,
        html: htmlContent
    };

    // --- Send Email ---
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Nomination submitted successfully.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error processing your nomination. Please try again later.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
